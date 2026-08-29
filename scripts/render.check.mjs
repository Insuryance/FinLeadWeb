// Server-renders GridView against a real extraction payload and asserts the markup.
//
// Why this exists: /try is a client component, so an HTTP 200 from the page proves only that the
// shell compiled. It says nothing about whether the grid table draws. Headless Firefox screenshots
// the page before its data fetch resolves, and there is no puppeteer/playwright here. Rendering the
// presentational component directly is the one way to get evidence that the table is correct.
//
// JSX is transpiled with esbuild installed OUTSIDE this repo (/tmp/rendercheck) so no build-tool
// devDependency is added for a test.
//
//   node scripts/render.check.mjs <run.json>
//
// <run.json> is a response body from GET /api/grid-trial/v1/runs/{id}.

import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, resolve as resolvePath } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const appDir = resolvePath(here, "..", "app", "try");
const ESBUILD_PREFIX = "/tmp/rendercheck/node_modules/esbuild";

let failures = 0;
function check(description, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${description}`);
  if (!ok) {
    console.log(`        expected ${JSON.stringify(expected)}`);
    console.log(`        actual   ${JSON.stringify(actual)}`);
  }
}

function loadEsbuild() {
  try {
    return createRequire(join(ESBUILD_PREFIX, "/"))(ESBUILD_PREFIX);
  } catch {
    console.log(`SKIP  esbuild not found at ${ESBUILD_PREFIX}`);
    console.log("      install it with:  mkdir -p /tmp/rendercheck && cd /tmp/rendercheck");
    console.log("                        npm init -y && npm install esbuild");
    process.exit(0);
  }
}

/** Transpiles a component to a temp .mjs that imports React and the real pivot module.
 *
 * Both imports are rewritten to absolute paths: the output lives outside the repo, so bare
 * specifiers like "react" would not resolve against FinLeadWeb/node_modules.
 */
async function buildComponent(esbuild, fileName) {
  const source = readFileSync(join(appDir, fileName), "utf8");
  const transformed = await esbuild.transform(source, {
    loader: "jsx",
    format: "esm",
    jsx: "transform",
  });
  const requireFromApp = createRequire(join(appDir, "/"));
  const reactPath = requireFromApp.resolve("react");
  const dir = mkdtempSync(join(tmpdir(), "component-"));
  const file = join(dir, fileName.replace(".jsx", ".mjs"));
  // Rewrite EVERY specifier the transpiled output carries. It sits outside the repo, so neither a
  // relative "./x.mjs" nor a bare "react" would resolve: a component importing hooks must have that
  // import redirected at the repo's own copy of React, or the module simply fails to load.
  const rewritten = transformed.code
    .replace(/(["'])\.\/([\w.-]+\.mjs)\1/g, (_m, _q, target) =>
      JSON.stringify(join(appDir, target)),
    )
    .replace(/(["'])react\1/g, JSON.stringify(reactPath));
  writeFileSync(file, `import React from ${JSON.stringify(reactPath)};\n${rewritten}`);
  return file;
}

const esbuild = loadEsbuild();
const [{ default: React }, { renderToStaticMarkup }, pivotModule, gridViewPath] = await Promise.all([
  import("react"),
  import("react-dom/server"),
  import(join(appDir, "pivot.mjs")),
  buildComponent(esbuild, "GridView.jsx"),
]);
const { analyseRules, buildPivot, defaultAxes, reconcileVocabulary } = pivotModule;
const pivotProgress = await import(join(appDir, "progress.mjs"));
const { default: GridView } = await import(gridViewPath);

const fixture = process.argv[2];
if (!fixture) {
  console.log("usage: node scripts/render.check.mjs <run.json> [preview.json]");
  process.exit(2);
}

const body = JSON.parse(readFileSync(fixture, "utf8"));
// The ask panel's provenance answer needs the workbook itself, not just the run — the run says which
// sheet and row a rule came from, the preview holds the cells. Optional so the other checks still run
// without it, but the provenance assertions are the strongest evidence in this suite, so pass it.
const sheets = process.argv[3] ? JSON.parse(readFileSync(process.argv[3], "utf8")).sheets ?? [] : [];
const engine = (body.comparison ?? body).engines[0];
const rules = engine.rules;
const reconciliation = reconcileVocabulary(rules, engine.variableResolutions ?? []);
const analysis = analyseRules(rules, reconciliation.aliases);
const axes = defaultAxes(analysis);
const pivot = buildPivot(analysis.plotted, axes.rowField, axes.columnField);
const qualifierFields = analysis.varying
  .map((entry) => entry.field)
  .filter((field) => field !== axes.rowField && field !== axes.columnField);

const html = renderToStaticMarkup(
  React.createElement(GridView, {
    analysis,
    reconciliation,
    pivot,
    axisCandidates: analysis.fields,
    rowField: axes.rowField,
    columnField: axes.columnField,
    qualifierFields,
    componentCount: new Set(rules.map((r) => r.payoutComponent).filter(Boolean)).size,
    ruleCount: rules.length,
    onRowFieldChange: () => {},
    onColumnFieldChange: () => {},
    onShowRuleList: () => {},
  }),
);

console.log(`rendered ${html.length} bytes of markup\n`);

const countOf = (needle) => html.split(needle).length - 1;
/** React escapes text, so an expected label must be escaped before it is looked for. */
const escapeText = (text) =>
  String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");

check("a pivot table is rendered", html.includes('<table class="gt-sheet gt-pivot">'), true);
check(
  "every row label reaches the markup",
  pivot.rowLabels.every((label) => html.includes(`>${escapeText(label)}</th>`)),
  true,
);
check(
  "every column label reaches the markup",
  pivot.columnLabels.every((label) => html.includes(`>${escapeText(label)}</th>`)),
  true,
);
check("row header count matches the pivot", countOf('class="gt-sheet-rowhead gt-pivot-rowhead"'), pivot.rowLabels.length);
check(
  "cell count is rows x columns",
  countOf('class="gt-sheet-cell gt-pivot-cell"'),
  pivot.rowLabels.length * pivot.columnLabels.length,
);
check("both axis pickers render", countOf("<select"), 2);
check(
  "the axis dropdown offers every candidate field",
  analysis.fields.every((entry) => html.includes(`value="${entry.field}"`)),
  true,
);
check("payout values render", countOf('class="gt-pivot-payout"') > 0, true);
check(
  "no cell renders the literal string undefined or NaN",
  /undefined|NaN/.test(html),
  false,
);
// A qualifier is an off-axis condition. Without its field name a boolean field renders as a bare
// "false", which tells the reader nothing about what is false.
if (qualifierFields.length > 0) {
  const bare = /<span class="gt-pivot-qual">(true|false)<\/span>/.test(html);
  check("qualifiers are never a bare unlabelled value", bare, false);
  check(
    "each qualifier names its field",
    // Ask the module for the label rather than re-deriving it. Duplicating the transform here is what
    // broke this check when known keys gained human names.
    qualifierFields.some((field) =>
      html.includes(`gt-pivot-qual">${escapeText(pivotModule.fieldLabel(field))}:`),
    ),
    true,
  );
}
if (reconciliation.merges.length > 0) {
  check(
    "the vocabulary merge is disclosed in the markup",
    html.includes("was not in the resolved field vocabulary"),
    true,
  );
}
const breakdownRules = rules.filter((r) => Array.isArray(r.payoutBreakdown) && r.payoutBreakdown.length);
if (breakdownRules.length > 0) {
  const sample = breakdownRules[0].payoutBreakdown
    .map((p) => `${p.percentage}%`)
    .every((piece) => html.includes(piece));
  check("multi-component payouts render their percentages", sample, true);
}

console.log("\n--- first rendered row (text only) ---");
const firstRow = html.split("<tr>")[2] ?? "";
console.log("   " + firstRow.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 220));

// ---- RunHealth: the run's own account of its quality ----
const runHealthPath = await buildComponent(esbuild, "RunHealth.jsx");
const { default: RunHealth } = await import(runHealthPath);
const healthHtml = renderToStaticMarkup(
  React.createElement(RunHealth, { rules, reconciliation: engine.reconciliation }),
);
const verification = pivotModule.verificationSummary(rules);
const health = pivotModule.extractionHealth(engine.reconciliation);

console.log("\n--- run health markup (text only) ---");
console.log("   " + healthHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300));

if (verification.checked > 0) {
  // A clean badge requires more than "no contradictions": a rule with no conditions is satisfiable
  // and useless, so it must downgrade the badge too.
  const clean = verification.contradictions === 0 && verification.unconstrained === 0;
  check(
    "the badge is only unqualified when nothing is wrong",
    healthHtml.includes(clean ? ">VERIFIED<" : ">QUALIFIED<"),
    true,
  );
  if (verification.unconstrained > 0) {
    check(
      "conditionless rules are called out, not folded into the pass",
      healthHtml.includes(`${verification.unconstrained}</strong> carry no conditions`),
      true,
    );
  }
  check(
    "the checked/total counts reach the markup",
    verification.contradictions || verification.unconstrained || verification.unverifiable
      ? healthHtml.includes(
          `${verification.checked.toLocaleString()} of ${verification.total.toLocaleString()} rules checked`,
        )
      : healthHtml.includes(`All ${verification.total.toLocaleString()} rules were checked`),
    true,
  );
}
if (health.incomplete.length > 0) {
  // The flagged-section line was removed from the page deliberately. What must never come back is the
  // raw telemetry behind it — solver names, chunk coverage fractions and source row indexes are true,
  // useless to the reader, and read as a defect report.
  check(
    "the raw chunk telemetry is not shown",
    health.incomplete.some((chunk) => chunk.error && healthHtml.includes(escapeText(chunk.error))),
    false,
  );
  check(
    "no solver name, coverage fraction or row index leaks into the page",
    /SMT|coverage \d+\/\d+|still missing after retry|row\(s\)|\[\d+\]/.test(healthHtml),
    false,
  );
}
check("run health renders no undefined or NaN", /undefined|NaN/.test(healthHtml), false);
// The coverage figure has a broken denominator (values above 1.0), so it must not be shown.
check(
  "the unreliable coverage figure is not surfaced",
  healthHtml.includes(String(engine.reconciliation?.coverage ?? "\u0000")),
  false,
);

// ---- AskPanel: the guided conversation, and the provenance answer it exists for ----
const askModule = await import(await buildComponent(esbuild, "askDemo.mjs"));
const askPanelPath = await buildComponent(esbuild, "AskPanel.jsx");
const { default: AskPanel } = await import(askPanelPath);
const questions = askModule.demoQuestions({
  rules,
  tables: engine.document?.tables ?? [],
  sheets: sheets,
  verification: pivotModule.verificationSummary(rules),
});
check("the demo offers between three and six questions", questions.length >= 3 && questions.length <= 6, true);
// Charts must carry the product's own contract, not an ad-hoc shape: if these drift apart the demo
// stops being a lighter renderer of a real response and becomes an invented visual.
const charts = questions.filter((q) => q.kind === "chart");
check("at least one chart answer is offered", charts.length > 0, true);
check(
  "every chart names a real Sentinel chart type",
  charts.every((q) => ["comparison_bar"].includes(q.answer.chartType)),
  true,
);
check(
  "every chart carries categories and rows keyed by them",
  charts.every(
    (q) =>
      Array.isArray(q.answer.categories) &&
      q.answer.categories.length > 0 &&
      q.answer.data.length > 0 &&
      q.answer.data.every((row) => row.period !== undefined && q.answer.categories.some((c) => c in row)),
  ),
  true,
);
check(
  "no question is offered without an answer",
  questions.every((q) => q.answer && Object.keys(q.answer).length > 0),
  true,
);

const askHtml = renderToStaticMarkup(
  React.createElement(AskPanel, { questions, ruleCount: rules.length, sheetCount: sheets.length }),
);
console.log("\n--- ask panel markup (text only) ---");
console.log("   " + askHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300));

// Chips carry a SHORT label; the full question appears only once the reader "asks" it. Assert both
// halves exist so a future edit cannot quietly collapse them back into one long pill.
check(
  "every question is offered as a chip",
  questions.every((q) => askHtml.includes(escapeText(q.label ?? q.question))),
  true,
);
check("every question has a short chip label", questions.every((q) => q.label && q.label.length <= 34), true);
check(
  "the full question text is not shown until asked",
  questions.some((q) => q.label !== q.question && askHtml.includes(`>${escapeText(q.question)}<`)),
  false,
);
check("the panel says free typing belongs to the product", /inside the product/.test(askHtml), true);
check("no answer is revealed before it is asked", askHtml.includes("gt-ask-user"), false);
check("ask panel renders no undefined or NaN", /undefined|NaN/.test(askHtml), false);

// The provenance answer is the reason the panel exists, so it is checked against the workbook rather
// than merely rendered: the cell it names must really hold the value it claims.
const provenance = questions.find((q) => q.kind === "provenance");
const provenanceLead = provenance
  ? askModule.sheetOfRule(provenance.answer.rule, engine.document?.tables ?? [])
  : null;
if (sheets.length === 0) {
  console.log("   (no preview fixture given — provenance checks skipped)");
} else {
  check("a provenance question is offered", Boolean(provenance), true);
}
if (provenance) {
  const { at, rule } = provenance.answer;
  const sheet = sheets.find((s) => s.name === at.sheetName);
  const row = sheet?.rows?.find((r) => r.number === at.rowNumber);
  check(
    "the cited sheet and row exist in the workbook",
    Boolean(sheet) && Boolean(row),
    true,
  );
  check(
    "the cited cell really holds the cited value",
    String(row?.cells?.[at.columnIndex] ?? "").trim() === String(at.value).trim(),
    true,
  );
  check(
    "the cited value is the rule's own source text",
    String(at.value).trim() === String(rule.payoutSourceText).trim(),
    true,
  );
  check(
    "the reference is a real spreadsheet address",
    /^[A-Z]+\d+$/.test(at.reference),
    true,
  );
  // A row's value can repeat across columns; the chosen column's header must agree with the rule.
  check(
    "the chosen column header is not empty",
    Boolean(at.columnHeader && String(at.columnHeader).trim()),
    true,
  );

  const answeredHtml = renderToStaticMarkup(
    React.createElement(AskPanel, {
      questions: [provenance],
      ruleCount: rules.length,
      sheetCount: sheets.length,
    }),
  );
  check("the provenance chip is present before being clicked", answeredHtml.includes(escapeText(provenance.label)), true);
}

// Internal vocabulary must not reach the panel: it is the most jargon-prone surface on the page.
check(
  "the panel shows no raw variable keys",
  /rto_cluster|gvw_tonnage|vehicle_weight|nil_dep|product_sub_category|OD_PLUS_ADDON/.test(askHtml),
  false,
);

// ---- lead sheets: the table, the charts and the questions must discuss the same regions ----
const leadRules = askModule.orderRulesForDisplay(rules, engine.document?.tables ?? []);
const firstSheet = askModule.sheetOfRule(leadRules[0], engine.document?.tables ?? []);
check("the rule list opens on a lead sheet", askModule.LEAD_SHEETS.includes(firstSheet), true);
check("ordering does not add or drop rules", leadRules.length === rules.length, true);
check(
  "ordering preserves the same rule set",
  new Set(leadRules.map((r) => r.id)).size === new Set(rules.map((r) => r.id)).size,
  true,
);
const leadTables = askModule.orderTablesForDisplay(engine.document?.tables ?? []);
check("the grid inventory opens on a lead sheet", askModule.LEAD_SHEETS.includes(leadTables[0]?.region), true);
check("ordering does not add or drop tables", leadTables.length === (engine.document?.tables ?? []).length, true);
if (provenanceLead) {
  check("the traced rule belongs to a lead sheet", askModule.LEAD_SHEETS.includes(provenanceLead), true);
}
const benchmarkQuestion = questions.find((q) => q.id === "benchmark");
if (benchmarkQuestion) {
  check(
    "the benchmark compares two lead sheets",
    benchmarkQuestion.answer.categories.every((name) => askModule.LEAD_SHEETS.includes(name)),
    true,
  );
  check(
    "the benchmark drops bands where neither side pays",
    benchmarkQuestion.answer.data.every((row) => {
      const [l, r] = benchmarkQuestion.answer.categories;
      return (Number(row[l]) || 0) > 0 || (Number(row[r]) || 0) > 0;
    }),
    true,
  );
}

// ---- every answer, actually rendered ----
// The panel only reveals an answer on click, which server rendering never reaches, so rendering the
// panel alone proves nothing about the answers. Each one is rendered directly here.
const { Answer } = await import(askPanelPath);
for (const question of questions) {
  const answerHtml = renderToStaticMarkup(React.createElement(Answer, { question }));
  check(`the ${question.id} answer renders content`, answerHtml.length > 60, true);
  check(`the ${question.id} answer has no undefined or NaN`, /undefined|NaN/.test(answerHtml), false);

  if (question.kind === "chart") {
    // A chart whose bars all have zero width is a chart that renders but says nothing.
    const widths = [...answerHtml.matchAll(/width[:=]"?([\d.]+)(%|")/g)].map((m) => Number(m[1]));
    check(`the ${question.id} chart draws non-zero bars`, widths.some((w) => w > 0), true);
    check(
      `the ${question.id} chart labels every category`,
      question.answer.categories.every((category) => answerHtml.includes(escapeText(category))),
      true,
    );
  }
  if (question.kind === "provenance") {
    const { at } = question.answer;
    check("the provenance answer shows the cell reference", answerHtml.includes(at.reference), true);
    check("the provenance answer highlights exactly one cell", (answerHtml.match(/gt-sheetlet-hit/g) || []).length === 1, true);
    check("the provenance answer shows the row number", answerHtml.includes(`>${at.rowNumber}<`), true);
  }
}

// ---- RuleTable: the rule list must be a table, not JSON-Logic prose ----
const ruleTablePath = await buildComponent(esbuild, "RuleTable.jsx");
const { default: RuleTable } = await import(ruleTablePath);
const ruleHtml = renderToStaticMarkup(
  React.createElement(RuleTable, {
    rules,
    fields: analysis.fields,
    aliases: reconciliation.aliases,
  }),
);
check("the rule list renders a table", ruleHtml.includes("<table"), true);
check(
  "one column per condition field, plus rule and payout",
  (ruleHtml.split('class="gt-sheet-colhead gt-pivot-colhead"').length - 1),
  analysis.fields.length + 2,
);
check(
  "a row per rule, capped at the display window",
  (ruleHtml.split("<tr>").length - 1),
  Math.min(rules.length, 250) + 1,
);
// A whole workbook yields thousands of rules; the footer must state the window rather than imply the
// table is complete.
{
  const many = Array.from({ length: 600 }, (_, i) => rules[i % rules.length]);
  const cappedHtml = renderToStaticMarkup(
    React.createElement(RuleTable, { rules: many, fields: analysis.fields, aliases: reconciliation.aliases }),
  );
  check("a large corpus renders only the window", (cappedHtml.split("<tr>").length - 1), 251);
  check("the window size is stated", cappedHtml.includes("showing the first 250 of"), true);
  check("the full total is stated", cappedHtml.includes("600"), true);
}
check(
  "no JSON-Logic prose survives in the rule list",
  / AND | OR |\{"var"|logicalExpression/.test(ruleHtml),
  false,
);
check("rule list renders no undefined or NaN", /undefined|NaN/.test(ruleHtml), false);

// ---- SheetInventory: every table and what the classifier decided ----
const inventoryPath = await buildComponent(esbuild, "SheetInventory.jsx");
const { default: SheetInventory } = await import(inventoryPath);
const tables = engine.document?.tables ?? [];
const inventoryHtml = renderToStaticMarkup(React.createElement(SheetInventory, { tables }));
if (tables.length > 0) {
  check("every table is listed", (inventoryHtml.split("<tr>").length - 1), tables.length + 1);
  check(
    "each table's kind is shown in words",
    tables.every((t) => inventoryHtml.includes(
      t.kind === "RULE_TABLE" ? ">rule grid<" : t.kind === "REFERENCE_TABLE" ? ">reference grid<" : ">notes<")),
    true,
  );
  check(
    "the classifier's reason is shown",
    tables.filter((t) => t.kindReason).every((t) => inventoryHtml.includes(escapeText(t.kindReason))),
    true,
  );
  console.log("\n--- sheets found (text only) ---");
  console.log("   " + inventoryHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 260));
}

// ---- ProgressTrack: ticks and a bar, not a wall of log lines ----
const trackPath = await buildComponent(esbuild, "ProgressTrack.jsx");
const { default: ProgressTrack } = await import(trackPath);
const logLines = body.progressLog ?? [];
if (logLines.length > 0) {
  const done = renderToStaticMarkup(
    React.createElement(ProgressTrack, { lines: logLines, rules, rawLines: logLines }),
  );
  check("five stage rows render", (done.split('class="gt-step-row').length - 1), 5);
  check("a completed run ticks every stage", (done.split('gt-step-row is-done').length - 1), 5);
  check("the bar reaches 100%", done.includes('aria-valuenow="100"'), true);
  check("progress track shows no undefined or NaN", /undefined|NaN/.test(done), false);
  check(
    "the engineering prefix is not in the visible stage list",
    done.split("<details")[0].includes("POI_ONLY"),
    false,
  );
  check("the raw log stays available behind a toggle", done.includes("<details"), true);
  // The headline counter and per-stage timings are what make the wait legible.
  const { metrics } = pivotProgress.progressStages(logLines, rules);
  if (metrics?.rules) {
    check(
      "the rule counter renders the log's own total",
      done.includes(metrics.rules.toLocaleString()),
      true,
    );
  }
  check("per-stage durations render", (done.split('class="gt-step-time').length - 1) >= 3, true);
  // A segmented bar only appears while extraction is running, one segment per section.
  const midSeg = renderToStaticMarkup(
    React.createElement(ProgressTrack, { lines: logLines.slice(0, 9), rules: [], rawLines: [] }),
  );
  const segs = midSeg.split('class="gt-seg').length - 1;
  check("a segmented section bar appears mid-extraction", segs > 0, true);
  check("some segments are lit and not all", midSeg.includes("gt-seg is-on") && segs > (midSeg.split("gt-seg is-on").length - 1), true);
  check("no segmented bar once extraction is done", done.includes('class="gt-segbar"'), false);

  // Mid-run: one stage active, later stages still pending.
  const partial = renderToStaticMarkup(
    React.createElement(ProgressTrack, { lines: logLines.slice(0, 9), rules: [], rawLines: [] }),
  );
  check("mid-run shows exactly one active stage", (partial.split('gt-step-row is-active').length - 1), 1);
  check("mid-run leaves later stages un-ticked", (partial.split('gt-step-row is-done').length - 1), 3);
  const valueNow = Number((partial.match(/aria-valuenow="(\d+)"/) ?? [])[1]);
  check("mid-run progress is between 0 and 100", valueNow > 0 && valueNow < 100, true);

  console.log("\n--- progress track (text only) ---");
  console.log("   " + done.split("<details")[0].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 260));
}

console.log(`\n${failures === 0 ? "ALL RENDER CHECKS PASSED" : `${failures} RENDER CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
