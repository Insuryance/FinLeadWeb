/**
 * Generates the static demo payloads the /try page serves in production.
 *
 * Why this exists: the page shows two extractions that will never change. Live runs are off by
 * design, so nothing about it is dynamic — yet serving it from the API meant an investor demo
 * depended on a JVM and a Postgres staying healthy, and on this infrastructure both degrade after
 * about a day. Baking the data removes the whole failure class: Vercel serves it from CDN with no
 * backend, no database and no deploy of either.
 *
 * It also trims hard. The API returns the pipeline's own payload, which is the right contract for
 * the tenant product but carries a great deal the page never reads — per-rule mapping prose, the
 * rendered HTML of every table, full AST detail. Keeping only what is read takes both cards from
 * 16.6 MB to 0.44 MB gzipped.
 *
 * The trim is a whitelist, deliberately. A blacklist would silently start shipping any field a
 * future pipeline change adds, which is how the 22 MB detectedGrid leak happened.
 *
 * Usage, with the backend running:
 *   node scripts/build-demo-payloads.mjs
 *   node scripts/build-demo-payloads.mjs --api http://localhost:3005/api/grid-trial
 *
 * Writes public/demo/{samples,<id>.preview,<id>.run}.json. Re-run after a new extraction and commit
 * the result; that is the only step needed to publish a new card.
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";

const args = process.argv.slice(2);
const apiFlag = args.indexOf("--api");
const API = apiFlag >= 0 ? args[apiFlag + 1] : "http://localhost:3005/api/grid-trial";
const OUT = join(process.cwd(), "public", "demo");

/** Fields a rule needs for the table, the payout, provenance and the verdict badge. */
const RULE_FIELDS = [
  "id",
  "name",
  "fixedPay",
  "payoutSourceText",
  "payoutComponent",
  "payoutBreakdown",
  "irdaPayoutConfigApplied",
  "logicalExpression",
  "sheetName",
  "sourceRows",
  "sourceTable",
  // Added by correctPayouts, so they must be on the whitelist or the correction is discarded.
  "payoutKind",
  "payoutCaps",
  "payoutRescaled",
];

/** Table fields the sheet inventory and the provenance resolver need. */
const TABLE_FIELDS = [
  "tableIndex",
  "kind",
  "kindReason",
  "region",
  "rows",
  "cols",
  "columnHeaders",
  "footnotes",
];

function pick(source, fields) {
  const out = {};
  for (const field of fields) if (source?.[field] !== undefined) out[field] = source[field];
  return out;
}

/**
 * Corrections applied to what the pipeline produced.
 *
 * These are display-correctness fixes for the demo. The underlying defects are in extraction and are
 * tracked separately — nothing here should be read as the pipeline being right.
 *
 * 1. Fractions that were never scaled to percent.
 *
 *    These grids write percentages as decimals. Most such cells are percent-formatted (numFmt
 *    "0.0%"), and the pipeline scaled 2,906 of them correctly. It left 254 alone, all from columns
 *    whose cells carry NO percent format — for example sheet "TW 1+1 & SATP", whose row-4 headers
 *    read CD1 / Max CD2 and whose column D holds 0.0-0.75.
 *
 *    That they are percentages is not inferred from the shape of the number. The workbook states it
 *    in prose on its own sheets: "Bharat Benz and Mahindra to operate at 70% CD1" and
 *    "CD1 - 85%  CD2 - 5%  SATP - 32.5%". A 0.7% two-wheeler commission is not a thing.
 *
 *    The count is asserted, so if a future run changes what needs correcting this fails loudly
 *    instead of quietly rescaling a different set of rules.
 *
 * 2. Non-numeric payouts become an explicit kind.
 *
 *    "D" is the workbook's abbreviation for Declined — it writes "Declined" in full on other sheets
 *    ("UP53 is Declined", "Age 1+: Declined"). The pipeline mapped it to fixedPay 0, which conflates
 *    "we pay nothing" with "we will not write this at all".
 *
 *    "MISP" names the dealer distribution channel and carries no number. The pipeline invented one,
 *    differently each time: 0 for 122 rules, then 22.5, 20, 50, 55, 40, 60, 65. Those are dropped.
 *
 *    "Max CD1: 0.2, Max CD2: 0.3" is two caps, not one payout, so it becomes two components the way
 *    the IRDA breakdown already does.
 */
function correctPayouts(rules) {
  const stats = { scaled: 0, declined: 0, misp: 0, capped: 0, discountCaps: 0, inventedDropped: 0 };

  for (const rule of rules) {
    const text = String(rule.payoutSourceText ?? "").trim();

    if (/^D$/i.test(text)) {
      stats.declined += 1;
      if (typeof rule.fixedPay === "number") stats.inventedDropped += 1;
      rule.payoutKind = "DECLINED";
      delete rule.fixedPay;
      continue;
    }

    if (/^MISP$/i.test(text)) {
      stats.misp += 1;
      if (typeof rule.fixedPay === "number") stats.inventedDropped += 1;
      rule.payoutKind = "MISP";
      delete rule.fixedPay;
      continue;
    }

    const caps = [...text.matchAll(/(Min|Max)\s+(CD\d[^:]*?):\s*([\d.]+|MISP|D)\b/gi)];
    if (caps.length > 0) {
      stats.capped += 1;
      rule.payoutKind = "CD_CAPS";
      rule.payoutCaps = caps.map((match) => {
        const raw = match[3];
        const numeric = Number(raw);
        return {
          label: `${match[1].toLowerCase()} ${match[2].trim()}`,
          percentage: Number.isFinite(numeric) ? asPercent(numeric) : null,
          text: Number.isFinite(numeric) ? null : raw,
        };
      });
      delete rule.fixedPay;
      continue;
    }

    // A fraction the pipeline failed to scale: source says 0.55, fixedPay says 0.55.
    const value = Number(text);
    if (
      /^0?\.\d+$/.test(text) &&
      typeof rule.fixedPay === "number" &&
      Math.abs(rule.fixedPay - value) < 1e-9
    ) {
      rule.fixedPay = asPercent(value);
      rule.payoutRescaled = true;
      stats.scaled += 1;
    }

    // 3. A CD1/CD2 column is a DISCOUNT CAP, not a commission.
    //
    // These grids put several different measures side by side — CD1, CD2, SATP and commission — and
    // extraction flattens all of them into one payout field. That is why 46 of the 55 values above
    // 60% are CD columns: "CD1 70%" is the maximum discount allowed, not a 70% payout. The workbook
    // says as much itself: "CD1 - 85%  CD2 - 5%  SATP - 32.5%" are three separate quantities on one
    // row.
    //
    // Detected from the rule name because the trimmed payload cannot resolve a rule to its column
    // header (the preview holds only the first rows of each sheet). That is a heuristic, and it is
    // here so the demo does not present a cap as a payout. The real fix is for extraction to carry
    // the measure per column instead of one payout field.
    if (rule.payoutKind === undefined && /\bCD\s?[12]\b|MaxCD[12]|_CD[12]/i.test(rule.name ?? "")) {
      rule.payoutKind = "CD_CAP";
      if (typeof rule.fixedPay === "number") {
        rule.payoutCaps = [{ label: "discount cap", percentage: rule.fixedPay, text: null }];
        delete rule.fixedPay;
      }
      stats.discountCaps += 1;
    }
  }
  return stats;
}

/** A decimal below 1 in these grids is a percentage written as a fraction. */
function asPercent(value) {
  return value < 1 ? Number((value * 100).toFixed(4)) : value;
}

function trimRule(rule) {
  const out = pick(rule, RULE_FIELDS);
  const provenance = rule.provenance ?? {};
  out.provenance = {
    sheet: provenance.sheet ?? null,
    tableIndex: provenance.tableIndex ?? null,
    sourceRows: provenance.sourceRows ?? null,
    // Only the two fields the vocabulary reconciliation reads. mappingReason is the model's prose
    // and is the single largest contributor to rule size.
    usedVariables: (provenance.usedVariables ?? []).map((used) => ({
      variable: used.variable,
      mappingStatus: used.mappingStatus,
    })),
  };
  if (rule.ast) {
    out.ast = { z3Verdict: rule.ast.z3Verdict, variables: rule.ast.variables };
  }
  return out;
}

function trimRun(run, extractedAt) {
  const engine = run.comparison.engines[0];
  const reconciliation = engine.reconciliation ?? {};
  return {
    status: run.status,
    // Shown on the page. A demo that says when the extraction actually ran reads as a real result
    // rather than something generated on the spot.
    extractedAt: extractedAt ?? null,
    // The progress replay is driven entirely by these lines and their timestamps, so they stay whole.
    progressLog: run.progressLog ?? [],
    comparison: {
      engines: [
        {
          engine: engine.engine,
          ok: engine.ok,
          elapsedMs: engine.elapsedMs,
          timings: engine.timings ?? null,
          rules: engine.rules.map(trimRule),
          variableResolutions: engine.variableResolutions ?? [],
          document: {
            tables: (engine.document?.tables ?? []).map((table) => pick(table, TABLE_FIELDS)),
            footers: engine.document?.footers ?? [],
          },
          reconciliation: {
            // coverage is deliberately dropped, not merely unused: its denominator is broken and it
            // reports above 100%. Not shipping it means it cannot be surfaced by accident.
            chunks: (reconciliation.chunks ?? []).map((chunk) =>
              pick(chunk, ["index", "sheet", "status", "rules"]),
            ),
            aliases: reconciliation.aliases ?? null,
          },
        },
      ],
    },
  };
}

async function fetchJson(path) {
  const res = await fetch(API + path);
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.json();
}

function report(label, before, after) {
  const raw = JSON.stringify(after);
  const gz = gzipSync(Buffer.from(raw)).length;
  console.log(
    `  ${label.padEnd(34)} ${(before / 1048576).toFixed(2)} MB -> ${(raw.length / 1048576).toFixed(2)} MB` +
      `  (gzip ${(gz / 1024).toFixed(0)} KB)`,
  );
  return gz;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const catalogue = await fetchJson("/samples");
  let totalGz = 0;
  const written = [];

  for (const sample of catalogue.samples) {
    const preview = await fetchJson(`/samples/${encodeURIComponent(sample.id)}/preview`);
    // Ask for the run the same way the page does. With live runs off this returns the cached run
    // rather than starting anything.
    const started = await fetchJson(`/runs?sampleId=${encodeURIComponent(sample.id)}`).catch(
      async () => {
        const res = await fetch(`${API}/runs`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sampleId: sample.id }),
        });
        if (!res.ok) throw new Error(`POST /runs ${sample.id} -> ${res.status}`);
        return res.json();
      },
    );
    if (!started.cached) {
      throw new Error(
        `${sample.id}: the API started a LIVE run. Refusing to generate — set ` +
          `gridtrial.allow-live-runs=false and use the cached run.`,
      );
    }
    const run = await fetchJson(`/runs/${started.runId}`);

    const trimmed = trimRun(run, started.extractedAt ?? run.extractedAt ?? null);
    const corrections = correctPayouts(trimmed.comparison.engines[0].rules);
    console.log(
      `  ${(sample.id + " corrections").padEnd(34)} ` +
        `rescaled ${corrections.scaled}, declined ${corrections.declined}, ` +
        `MISP ${corrections.misp}, CD caps ${corrections.capped}, ` +
        `discount-cap columns ${corrections.discountCaps}, ` +
        `invented numbers dropped ${corrections.inventedDropped}`,
    );
    if (sample.id === "digit-pc-2w" && corrections.scaled !== 254) {
      throw new Error(
        `digit-pc-2w: expected to rescale exactly 254 rules, rescaled ${corrections.scaled}. ` +
          `The set needing correction changed — re-verify against the workbook's number formats ` +
          `before widening this.`,
      );
    }
    if (trimmed.comparison.engines[0].rules.length !== run.comparison.engines[0].rules.length) {
      throw new Error(`${sample.id}: rule count changed during trim`);
    }
    totalGz += report(`${sample.id} run`, JSON.stringify(run).length, trimmed);
    totalGz += report(`${sample.id} preview`, JSON.stringify(preview).length, preview);
    writeFileSync(join(OUT, `${sample.id}.run.json`), JSON.stringify(trimmed));
    writeFileSync(join(OUT, `${sample.id}.preview.json`), JSON.stringify(preview));
    written.push({ ...sample, runId: started.runId });
  }

  writeFileSync(join(OUT, "samples.json"), JSON.stringify({ samples: written }));
  console.log(`  ${"catalogue".padEnd(34)} ${written.length} card(s)`);
  console.log(`  total gzipped: ${(totalGz / 1024).toFixed(0)} KB`);
  console.log(`  wrote ${OUT}`);
}

main().catch((error) => {
  console.error(`  FAILED: ${error.message}`);
  process.exit(1);
});
