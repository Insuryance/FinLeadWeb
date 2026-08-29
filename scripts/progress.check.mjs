// Checks for the progress stage mapping in app/try/progress.mjs.
//
//   npm run test:progress                    unit checks only
//   npm run test:progress -- run.json        also walks a real run's log line by line
//
// The mapping exists to put readable wording in front of a viewer. It must never invent progress: a
// stage may only tick when a log line says it finished.

import { readFileSync } from "node:fs";
import { formatDuration, progressStages } from "../app/try/progress.mjs";

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

const stamp = (message) => `2026-08-23T07:41:59.000Z  ${message}`;
const statuses = (result) => result.stages.map((s) => s.status);

// The real GCV log, verbatim.
const GCV_LOG = [
  "Queued — starting extraction pipeline",
  "POI_ONLY · Stage 1 preprocess (Unstructured) …",
  "POI_ONLY · Stage 1 done in 60ms — 2 tables, 2 footnote lines",
  "POI_ONLY · Stage 1.5 classified in 8s — 1 rule grids, 0 reference",
  "POI_ONLY · Stage 2 resolving variables …",
  "POI_ONLY · Stage 2 resolved 14 variables in 20s",
  "POI_ONLY · Stage 3 extracting rules …",
  "POI_ONLY · Stage 3: 2 chunks across rule grids (2 at a time)…",
  "POI_ONLY · Stage 3: 1/2 chunks · 105 rules so far",
  "POI_ONLY · Stage 3: 2/2 chunks · 195 rules so far",
  "POI_ONLY · Stage 3 done in 7m22s — 195 rules, coverage 164%",
  "POI_ONLY · ⏱ breakdown — preprocess 60ms · classify 8s · resolve 20s · extract 7m22s",
  "Done in 472.1s — review the results",
].map(stamp);

// ---- nothing yet ----
check("an empty log leaves every stage pending", statuses(progressStages([])), [
  "pending",
  "pending",
  "pending",
  "pending",
  "pending",
]);
check("an empty log reports zero progress", progressStages([]).fraction, 0);

// ---- a completed run ----
const complete = progressStages(GCV_LOG, []);
check("a finished log completes every stage", statuses(complete), [
  "done",
  "done",
  "done",
  "done",
  "done",
]);
check("a finished log reports full progress", complete.fraction, 1);
check("a finished log is marked complete", complete.complete, true);
check(
  "each stage carries the figure its own line reported",
  complete.stages.map((s) => s.detail),
  ["2 tables, 2 footnotes", "1 rule grid", "14 columns mapped", "195 rules extracted", null],
);
check(
  "the engineering prefix never reaches a label or detail",
  complete.stages.some((s) => /POI_ONLY|Stage \d/.test(`${s.label} ${s.detail}`)),
  false,
);
// The coverage denominator is broken (164%), so it must not be surfaced anywhere.
check(
  "the unreliable coverage figure is never shown",
  JSON.stringify(complete.stages).includes("164"),
  false,
);

// ---- verification detail comes from the rules, not the log ----
check(
  "verification reports the rules' own verdicts",
  progressStages(GCV_LOG, [
    { ast: { z3Verdict: "satisfiable" } },
    { ast: { z3Verdict: "satisfiable" } },
    { ast: { z3Verdict: "contradiction" } },
  ]).stages[4].detail,
  "2 of 3 can fire",
);
check(
  "verification says nothing when no rule was annotated",
  progressStages(GCV_LOG, [{}, {}]).stages[4].detail,
  null,
);

// ---- part way through ----
const midExtraction = progressStages(GCV_LOG.slice(0, 9), []);
check("mid-extraction marks earlier stages done and extraction active", statuses(midExtraction), [
  "done",
  "done",
  "done",
  "active",
  "pending",
]);
check(
  "the active stage shows the chunk count from the log",
  midExtraction.stages[3].detail,
  "105 rules from 1 of 2 sections",
);
check("mid-extraction progress sits between the stage boundaries", 
  midExtraction.fraction > 3 / 5 && midExtraction.fraction < 4 / 5, true);
check(
  "the LAST chunk line wins, not the first",
  progressStages(GCV_LOG.slice(0, 10), []).stages[3].detail,
  "195 rules from 2 of 2 sections",
);

// ---- monotonic: progress must never go backwards as lines arrive ----
let previous = -1;
let monotonic = true;
for (let count = 0; count <= GCV_LOG.length; count += 1) {
  const fraction = progressStages(GCV_LOG.slice(0, count), []).fraction;
  if (fraction < previous) monotonic = false;
  previous = fraction;
}
check("progress never decreases as the log grows", monotonic, true);

// ---- a run that reports no reference grids vs some ----
check(
  "reference grids are mentioned only when present",
  progressStages(
    [stamp("Stage 1.5 classified in 3s — 7 rule grids, 15 reference")],
    [],
  ).stages[1].detail,
  "7 rule grids, 15 reference",
);

// ---- durations, read from the log's own "in Xs" text ----
check(
  "each stage reports the duration its own line stated",
  progressStages(GCV_LOG, []).stages.map((s) => s.seconds),
  [0.06, 8, 20, 442, null],
);
// The closing "Done in 472.1s" is the whole pipeline. Attributing it to the last stage would claim
// verification took eight minutes, so it is reported separately.
check("the total wall-clock is reported apart from the stages", progressStages(GCV_LOG, []).totalSeconds, 472.1);
check("no total before the run closes", progressStages(GCV_LOG.slice(0, 9), []).totalSeconds, null);
check("sub-second work is shown in ms", formatDuration(0.66), "660ms");
check("seconds under ten keep a decimal", formatDuration(8), "8.0s");
check("whole seconds round", formatDuration(20), "20s");
check("minutes and seconds are zero-padded", formatDuration(2292), "38m12s");
check("a missing duration formats to nothing", formatDuration(null), null);

// ---- chunk metrics drive the segmented bar and the counter ----
check(
  "the section total is known from the announce line, before any chunk lands",
  progressStages(GCV_LOG.slice(0, 8), []).stages[3].metrics,
  { chunksDone: 0, chunksTotal: 2, rules: 0 },
);
check(
  "chunk progress and the running rule total are tracked",
  progressStages(GCV_LOG.slice(0, 9), []).stages[3].metrics,
  { chunksDone: 1, chunksTotal: 2, rules: 105 },
);
check(
  "a completed extraction reports every section done",
  progressStages(GCV_LOG, []).stages[3].metrics,
  { chunksDone: 2, chunksTotal: 2, rules: 195 },
);
check(
  "the headline metric follows the extraction stage",
  progressStages(GCV_LOG.slice(0, 9), []).metrics.rules,
  105,
);
check("no metrics before extraction starts", progressStages(GCV_LOG.slice(0, 6), []).metrics, null);

// ---- optional: walk a real payload ----
const fixture = process.argv[2];
if (fixture) {
  const body = JSON.parse(readFileSync(fixture, "utf8"));
  const lines = body.progressLog ?? [];
  const rules = (body.comparison ?? body).engines?.[0]?.rules ?? [];
  console.log(`\n--- ${body.fileName ?? fixture}: ${lines.length} log lines ---`);
  const final = progressStages(lines, rules);
  for (const stage of final.stages) {
    const mark = stage.status === "done" ? "✓" : stage.status === "active" ? "◌" : "·";
    console.log(`   ${mark} ${stage.label}${stage.detail ? `  — ${stage.detail}` : ""}`);
  }
  console.log(`   progress: ${Math.round(final.fraction * 100)}%`);
  check("a real completed run reaches 100%", final.fraction, 1);
  check(
    "a real run leaves no stage pending",
    final.stages.filter((s) => s.status !== "done").length,
    0,
  );
}

console.log(`\n${failures === 0 ? "ALL PROGRESS CHECKS PASSED" : `${failures} PROGRESS CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
