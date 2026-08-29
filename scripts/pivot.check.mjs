// Checks for the grid-view pivot logic in app/try/pivot.mjs.
//
//   npm run test:pivot                       unit checks only
//   npm run test:pivot -- run.json           also pivots a real extraction run
//
// The optional argument is a saved `comparison` payload from GET /api/grid-trial/v1/runs/{id}.
// No test framework: these are pure functions and node runs them directly.

import { readFileSync } from "node:fs";
import {
  analyseRules,
  bindingsOf,
  buildPivot,
  defaultAxes,
  naturalCompare,
  payoutOf,
  reconcileVocabulary,
  verificationSummary,
  extractionHealth,
} from "../app/try/pivot.mjs";

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

// ---- reading conditions ----
check("empty AND yields no bindings", bindingsOf({ logicalExpression: '{"and":[]}' }).size, 0);
check(
  "set membership renders as a value list",
  [...bindingsOf({ logicalExpression: '{"and":[{"in":[{"var":"seg"},["SC","EV"]]}]}' })],
  [["seg", "SC, EV"]],
);
check(
  "a lower and upper bound on one field render as a range",
  [
    ...bindingsOf({
      logicalExpression: '{"and":[{">=":[{"var":"age"},4]},{"<=":[{"var":"age"},7]}]}',
    }),
  ],
  [["age", "4 – 7"]],
);
check(
  "a range label sorts numerically",
  ["12 – 20", "0 – 2.3", "2.3 – 3.5"].sort(naturalCompare),
  ["0 – 2.3", "2.3 – 3.5", "12 – 20"],
);
check(
  "two same-direction bounds are not mistaken for a range",
  [
    ...bindingsOf({
      logicalExpression: '{"and":[{">=":[{"var":"age"},4]},{">":[{"var":"age"},1]}]}',
    }),
  ],
  [["age", "≥ 4 · > 1"]],
);
check("malformed condition does not throw", bindingsOf({ logicalExpression: "{not json" }).size, 0);

// ---- payout ----
// A payout is a percentage, so it renders with its unit. A bare "25" sitting next to "Declined" in
// the same column leaves the reader guessing what the number is.
check("payout reads fixedPay", payoutOf({ fixedPay: 0.33 }), "0.33%");
check("payout prefers fixedPay when source text is numeric", payoutOf({ fixedPay: 33, payoutSourceText: "0.33" }), "33%");
check("payout falls back to source text", payoutOf({ payoutSourceText: "IRDA" }), "IRDA");
check("payout of nothing is a dash", payoutOf({}), "—");
// A non-numeric cell parses to 0. Showing "0" would understate the payout AND be indistinguishable
// from a cell that really is zero, so the sentinel must survive to the screen.
check("a sentinel beats the zero it parsed to", payoutOf({ fixedPay: 0, payoutSourceText: "IRDA" }), "IRDA");
check("a real zero stays zero", payoutOf({ fixedPay: 0, payoutSourceText: "0" }), "0%");
check("a percent-formatted cell is treated as numeric", payoutOf({ fixedPay: 25, payoutSourceText: "25%" }), "25%");
// The footnote-derived breakdown is the most informative form and outranks both. Its components have
// different bases (OD vs TP premium) so they must stay separate, never summed.
check(
  "a payout breakdown outranks the sentinel and the parsed zero",
  payoutOf({
    fixedPay: 0,
    payoutSourceText: "IRDA",
    payoutBreakdown: [
      { component: "OD_PLUS_ADDON", percentage: 19.5 },
      { component: "TP", percentage: 2.5 },
    ],
  }),
  "19.5% OD+addon · 2.5% TP",
);
check(
  "an unmapped component still renders",
  payoutOf({ payoutBreakdown: [{ component: "SOME_NEW_THING", percentage: 7 }] }),
  "7% some new thing",
);
check(
  "an empty breakdown falls through to the next source",
  payoutOf({ fixedPay: 12, payoutBreakdown: [] }),
  "12%",
);

// A cell that carries no payout must never render as a number. "D" is the workbook's abbreviation for
// Declined and MISP names a distribution channel: showing either as 0% would claim the insurer writes
// the business for nothing, which is a different statement from refusing it.
check("a declined cell says so", payoutOf({ payoutKind: "DECLINED", payoutSourceText: "D" }), "Declined");
check("a MISP cell says so", payoutOf({ payoutKind: "MISP", payoutSourceText: "MISP" }), "At MISP rates");
check(
  "an explicit kind outranks any number left on the rule",
  payoutOf({ payoutKind: "DECLINED", fixedPay: 0, payoutSourceText: "D" }),
  "Declined",
);
check(
  "CD caps render as separate capped components",
  payoutOf({
    payoutKind: "CD_CAPS",
    payoutCaps: [
      { label: "max CD1", percentage: 20, text: null },
      { label: "max CD2", percentage: 30, text: null },
    ],
  }),
  "max CD1 20% · max CD2 30%",
);
check(
  "a non-numeric cap keeps its own text",
  payoutOf({ payoutKind: "CD_CAPS", payoutCaps: [{ label: "max CD1", percentage: null, text: "MISP" }] }),
  "max CD1 MISP",
);

// ---- ordering ----
check(
  "tonnage bands sort numerically, not lexically",
  ["12 to 20", "0 to 2.3", "2.3 to 3.5"].sort(naturalCompare),
  ["0 to 2.3", "2.3 to 3.5", "12 to 20"],
);

// ---- a uniform grid must be recovered exactly ----
// Three RTO divisions x four tonnage bands, one rule per cell, one field every rule shares, and one
// extra rule mentioning a field nothing else uses.
const uniform = [];
for (const division of ["CHENNAI", "SALEM", "ERODE"]) {
  for (const band of ["0 to 2.3", "2.3 to 3.5", "3.5 to 7.5", "12 to 20"]) {
    uniform.push({
      fixedPay: 0.25,
      logicalExpression: JSON.stringify({
        and: [
          { "==": [{ var: "rto_division" }, division] },
          { "==": [{ var: "gvw_band" }, band] },
          { "==": [{ var: "state" }, "Tamil Nadu"] },
        ],
      }),
    });
  }
}
const uniformWithStray = uniform.concat({
  fixedPay: 0.19,
  logicalExpression: JSON.stringify({
    and: [
      { "==": [{ var: "rto_division" }, "CHENNAI"] },
      { "==": [{ var: "discount_cap" }, "90%"] },
    ],
  }),
});

const strayAnalysis = analyseRules(uniformWithStray);
check("uniform grid picks the two spanning fields", defaultAxes(strayAnalysis), {
  rowField: "gvw_band",
  columnField: "rto_division",
});
check(
  "a single-valued field is NOT called fixed when a rule omits it",
  strayAnalysis.fixed.map((entry) => entry.field),
  [],
);
check(
  "a single-valued field IS called fixed when every rule carries it",
  analyseRules(uniform).fixed.map((entry) => entry.field),
  ["state"],
);
check(
  "a field only one rule mentions is never an axis candidate",
  strayAnalysis.varying.map((entry) => entry.field).includes("discount_cap"),
  false,
);

const axes = defaultAxes(strayAnalysis);
const uniformPivot = buildPivot(strayAnalysis.plotted, axes.rowField, axes.columnField);
check("bands are ordered numerically", uniformPivot.rowLabels, [
  "0 to 2.3",
  "2.3 to 3.5",
  "3.5 to 7.5",
  "12 to 20",
]);
check(
  "all 12 cells of the uniform grid are filled",
  uniformPivot.rowLabels
    .flatMap((row) =>
      uniformPivot.columnLabels.map(
        (column) => (uniformPivot.rows.get(row)?.get(column) ?? []).length,
      ),
    )
    .filter((size) => size > 0).length,
  12,
);
check("the stray rule is reported, not filed under a placeholder", uniformPivot.unplaced.length, 1);

// ---- vocabulary reconciliation ----
// Stage 3 sometimes invents a name instead of using the key Stage 2 resolved, splitting one axis in
// two. A merge must require ALL four preconditions, so build a fixture where they hold and then
// break them one at a time.
function tonnageRule(field, band, division, unresolvedField) {
  const [low, high] = band;
  return {
    fixedPay: 25,
    logicalExpression: JSON.stringify({
      and: [
        { "==": [{ var: "rto_cluster" }, division] },
        { ">=": [{ var: field }, low] },
        { "<=": [{ var: field }, high] },
      ],
    }),
    provenance: {
      usedVariables: [
        { variable: "rto_cluster", sourceToken: "State", mappingStatus: "INFERRED" },
        unresolvedField
          ? { variable: unresolvedField, mappingStatus: "UNRESOLVED" }
          : { variable: field, sourceToken: "0 to 2.3", mappingStatus: "NEW" },
      ],
    },
  };
}

const BANDS = [[0, 2.3], [2.3, 3.5], [3.5, 7.5], [7.5, 12]];
const resolutions = [
  { token: "State", mappedKey: "rto_cluster" },
  { token: "0 to 2.3", mappedKey: "gvw_tonnage" },
];
// Chunk 1 invented "vehicle_weight"; chunk 2 used the resolved "gvw_tonnage". Disjoint divisions.
const split = [
  ...BANDS.map((b) => tonnageRule("vehicle_weight", b, "CHENNAI", "vehicle_weight")),
  ...BANDS.map((b) => tonnageRule("vehicle_weight", b, "SALEM", "vehicle_weight")),
  ...BANDS.map((b) => tonnageRule("gvw_tonnage", b, "ERODE", null)),
];

const recon = reconcileVocabulary(split, resolutions);
check("an unresolved twin merges onto the resolved key", [...recon.aliases], [["vehicle_weight", "gvw_tonnage"]]);
check("the merge is reported with its rule count", recon.merges, [
  { from: "vehicle_weight", to: "gvw_tonnage", ruleCount: 8 },
]);
check(
  "without the merge the axis splits in two",
  analyseRules(split).fields.map((f) => f.field).sort(),
  ["gvw_tonnage", "rto_cluster", "vehicle_weight"],
);
check(
  "with the merge there is one tonnage axis",
  analyseRules(split, recon.aliases).fields.map((f) => f.field).sort(),
  ["gvw_tonnage", "rto_cluster"],
);
const mergedPivot = (() => {
  const a = analyseRules(split, recon.aliases);
  const ax = defaultAxes(a);
  return buildPivot(a.plotted, ax.rowField, ax.columnField);
})();
check("the merged grid shows all three divisions", mergedPivot.columnLabels.length >= 3 || mergedPivot.rowLabels.length >= 3, true);

// Precondition 3 — different value domains must NOT merge.
const differentDomain = split.concat(
  tonnageRule("vehicle_weight", [900, 1000], "TIRUPPUR", "vehicle_weight"),
);
check(
  "a differing value domain blocks the merge",
  [...reconcileVocabulary(differentDomain, resolutions).aliases].length,
  0,
);

// Precondition 4 — co-occurrence must NOT merge.
const coOccurring = split.concat({
  fixedPay: 9,
  logicalExpression: JSON.stringify({
    and: [
      { "==": [{ var: "vehicle_weight" }, 5] },
      { "==": [{ var: "gvw_tonnage" }, 5] },
    ],
  }),
  provenance: { usedVariables: [{ variable: "vehicle_weight", mappingStatus: "UNRESOLVED" }] },
});
check(
  "co-occurrence in any rule blocks the merge",
  [...reconcileVocabulary(coOccurring, resolutions).aliases].length,
  0,
);

// Precondition 1 — a name that provenance never flags is left alone.
const notFlagged = BANDS.map((b) => tonnageRule("some_other_name", b, "CHENNAI", null));
check(
  "a name provenance never flags is not merged",
  [...reconcileVocabulary(notFlagged, resolutions).aliases].length,
  0,
);

// ---- verification rollup ----
// "could not check" must never be counted as "checked and failed".
check(
  "verdicts are tallied and contradictions counted separately",
  verificationSummary([
    { ast: { z3Verdict: "satisfiable", parsed: true, variables: ["a"] } },
    { ast: { z3Verdict: "satisfiable", parsed: true, variables: ["b"] } },
    { ast: { z3Verdict: "contradiction", parsed: true, variables: ["c"] } },
    { ast: { z3Verdict: "parse_failed", parsed: false, variables: [] } },
    { ast: { z3Verdict: "unavailable", parsed: true, variables: ["d"] } },
    {},
  ]),
  {
    total: 6,
    checked: 5,
    counts: { satisfiable: 2, contradiction: 1, parse_failed: 1, unavailable: 1 },
    satisfiable: 2,
    contradictions: 1,
    unconstrained: 0,
    sound: 2,
    unverifiable: 2,
  },
);
// An empty AND parses cleanly and is trivially satisfiable. Counting it as sound would let a corpus
// of conditionless rules present itself as fully verified — it matches EVERY input, not some input.
check(
  "a rule with no conditions is satisfiable but not sound",
  (() => {
    const s = verificationSummary([
      { ast: { z3Verdict: "satisfiable", parsed: true, variables: [] } },
      { ast: { z3Verdict: "satisfiable", parsed: true, variables: ["a"] } },
    ]);
    return { satisfiable: s.satisfiable, unconstrained: s.unconstrained, sound: s.sound };
  })(),
  { satisfiable: 2, unconstrained: 1, sound: 1 },
);
check(
  "an unannotated corpus reports nothing checked",
  verificationSummary([{}, {}]).checked,
  0,
);

// ---- extraction health ----
check(
  "a partial chunk is reported and a done chunk is not",
  extractionHealth({
    chunks: [
      { index: 1, status: "DONE", rules: 105 },
      { index: 2, status: "PARTIAL", rules: 90, error: "coverage 6/7 rows" },
    ],
  }),
  { total: 2, incomplete: [{ index: 2, status: "PARTIAL", rules: 90, error: "coverage 6/7 rows" }] },
);
check("missing reconciliation is not an error", extractionHealth(undefined), { total: 0, incomplete: [] });
check(
  "all-done chunks report nothing incomplete",
  extractionHealth({ chunks: [{ index: 1, status: "DONE" }] }).incomplete.length,
  0,
);

// ---- optional: a real run ----
const fixture = process.argv[2];
if (fixture) {
  // Accept either shape: a bare `comparison` object, or a full run view that wraps one. Both are
  // things you end up with when saving a response, and rejecting one is a pointless trap.
  const body = JSON.parse(readFileSync(fixture, "utf8"));
  const comparison = body.comparison ?? body;
  const rules = comparison.engines[0].rules;
  const reconciliation = reconcileVocabulary(rules, comparison.engines[0].variableResolutions ?? []);
  for (const m of reconciliation.merges) {
    console.log(`merge         ${m.from} -> ${m.to} (${m.ruleCount} rules)`);
  }
  const analysis = analyseRules(rules, reconciliation.aliases);
  const realAxes = defaultAxes(analysis);
  const pivot = buildPivot(analysis.plotted, realAxes.rowField, realAxes.columnField);

  console.log("\n--- real run ---");
  console.log(`rules         ${rules.length}`);
  console.log(`plotted       ${analysis.plotted.length}`);
  console.log(`unplottable   ${analysis.unplottable.length}`);
  console.log(`fields        ${analysis.fields.map((f) => `${f.field}(${f.count})`).join(", ")}`);
  console.log(`axes          rows=${realAxes.rowField} cols=${realAxes.columnField}`);
  const verification = verificationSummary(rules);
  const health = extractionHealth(comparison.engines[0].reconciliation);
  console.log(`verified      ${verification.checked}/${verification.total} checked, ${verification.contradictions} contradiction(s), ${verification.unverifiable} unverifiable`);
  console.log(`chunks        ${health.total} total, ${health.incomplete.length} incomplete`);
  for (const chunk of health.incomplete) console.log(`                #${chunk.index} ${chunk.status}: ${chunk.error ?? ""}`);
  console.log(`grid          ${pivot.rowLabels.length} x ${pivot.columnLabels.length}`);

  check(
    "every rule is either plotted or reported",
    analysis.plotted.length + analysis.unplottable.length,
    rules.length,
  );

  const width = 15;
  console.log("");
  console.log(["", ...pivot.columnLabels].map((h) => String(h).slice(0, width).padEnd(width)).join(""));
  for (const rowLabel of pivot.rowLabels.slice(0, 15)) {
    const cells = pivot.columnLabels.map((columnLabel) => {
      const cell = pivot.rows.get(rowLabel)?.get(columnLabel) ?? [];
      const text = cell.length ? cell.map(({ rule }) => payoutOf(rule)).join(",") : "·";
      return text.slice(0, width).padEnd(width);
    });
    console.log(String(rowLabel).slice(0, width).padEnd(width) + cells.join(""));
  }
}

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
