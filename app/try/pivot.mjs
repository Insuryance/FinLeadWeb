// Rebuilding a grid from extracted rules.
//
// A rule carries its conditions as JSON-Logic, so a list of rules reads as a wall of
// "state == X AND segment in [...]" — complete, but nearly impossible to check against the source
// sheet. The source was a grid, so the useful view is a grid: put the two conditions that vary most
// on the axes and the payout in the cell, and a reader can compare it to the workbook cell by cell.
//
// These functions are pure and free of React so they can be exercised directly.

const RANGE_SYMBOLS = { "!=": "≠", "<": "<", "<=": "≤", ">": ">", ">=": "≥" };
const COMPARISON_OPS = Object.keys(RANGE_SYMBOLS).concat("==");

export function parseCondition(rule) {
  const raw = rule.logicalExpression ?? rule.condition ?? "";
  if (!raw) return null;
  try {
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
}

/** Flattens nested and/or into one entry per comparison, discarding the boolean structure. */
export function flattenPredicates(node, collected = []) {
  if (!node || typeof node !== "object") return collected;
  for (const [op, args] of Object.entries(node)) {
    if (op === "and" || op === "or") {
      (Array.isArray(args) ? args : []).forEach((child) => flattenPredicates(child, collected));
      continue;
    }
    if (op !== "in" && !COMPARISON_OPS.includes(op)) continue;
    const left = Array.isArray(args) ? args[0] : null;
    const field = left && typeof left === "object" ? left.var : left;
    const right = Array.isArray(args) ? args[1] : null;
    if (field == null) continue;
    collected.push({
      field: String(field),
      op,
      values: Array.isArray(right) ? right : [right],
    });
  }
  return collected;
}

/** "SC, EV" for set membership, "≥ 4" for a bound, the bare value for equality. */
export function predicateLabel(predicate) {
  const rendered = predicate.values.map((value) => String(value)).join(", ");
  if (predicate.op === "in" || predicate.op === "==") return rendered;
  return `${RANGE_SYMBOLS[predicate.op] ?? predicate.op} ${rendered}`;
}

const LOWER_BOUND_OPS = [">=", ">"];
const UPPER_BOUND_OPS = ["<=", "<"];

/**
 * One label per field, composed from every predicate touching that field.
 *
 * A band expressed as two predicates — `weight >= 2.3` and `weight <= 3.5` — is rendered as the
 * range "2.3 – 3.5" rather than "≥ 2.3 · ≤ 3.5". That is how the source column was labelled, and it
 * also lets the label sort numerically, which the symbol-prefixed form cannot.
 */
export function bindingsOf(rule) {
  const byField = new Map();
  for (const predicate of flattenPredicates(parseCondition(rule))) {
    if (!byField.has(predicate.field)) byField.set(predicate.field, []);
    byField.get(predicate.field).push(predicate);
  }

  const bindings = new Map();
  for (const [field, predicates] of byField) {
    bindings.set(field, composeLabel(predicates));
  }
  return bindings;
}

/** A range when the predicates bound both ends of one field, otherwise each label in turn. */
function composeLabel(predicates) {
  if (predicates.length === 2) {
    const lower = predicates.find((entry) => LOWER_BOUND_OPS.includes(entry.op));
    const upper = predicates.find((entry) => UPPER_BOUND_OPS.includes(entry.op));
    if (lower && upper) {
      return `${lower.values.join(", ")} – ${upper.values.join(", ")}`;
    }
  }
  return predicates.map(predicateLabel).join(" · ");
}

// Readable names for the payout components the extractor emits. Anything unmapped falls back to the
// raw token, lowercased — a new component type should read oddly, not disappear.
const PAYOUT_COMPONENT_LABELS = {
  OD_PLUS_ADDON: "OD+addon",
  OD: "OD",
  TP: "TP",
  NET: "net",
  CD1: "CD1",
  CD2: "CD2",
};

function componentLabel(component) {
  return (
    PAYOUT_COMPONENT_LABELS[component] ?? String(component).toLowerCase().replace(/_/g, " ")
  );
}

/**
 * The payout as it should be read, in order of how much the pipeline actually knows.
 *
 * 1. `payoutBreakdown` — a structured multi-component payout. A commercial-vehicle grid writes
 *    "IRDA" in the cell and defines it in a footnote ("19.5% on OD and 2.5% on TP"); the extractor
 *    reads that footnote and emits the components. This is the most informative form and the only
 *    correct one, because the components have different bases and cannot be summed into one number.
 * 2. Non-numeric `payoutSourceText` — the original cell, when it was not a number. Such a cell
 *    parses to `fixedPay: 0`, which is a different and wrong claim: it understates the payout and
 *    makes it indistinguishable from cells that really are zero.
 * 3. `fixedPay` — the parsed number, for ordinary numeric cells.
 */
export function payoutOf(rule) {
  // An explicit kind wins over any number, because these cells carry no payout to read. "D" is the
  // workbook's abbreviation for Declined, and MISP names a distribution channel — showing either as
  // 0% would claim the insurer writes the business for nothing, which is a different statement.
  if (rule.payoutKind === "DECLINED") return "Declined";
  if (rule.payoutKind === "MISP") return "At MISP rates";
  if (rule.payoutKind === "CD_CAP" && Array.isArray(rule.payoutCaps)) {
    const cap = rule.payoutCaps[0];
    return cap?.percentage != null ? `${cap.percentage}% discount cap` : "discount cap";
  }
  if (rule.payoutKind === "CD_CAPS" && Array.isArray(rule.payoutCaps)) {
    return rule.payoutCaps
      .map((cap) =>
        cap.percentage !== null && cap.percentage !== undefined
          ? `${cap.label} ${cap.percentage}%`
          : `${cap.label} ${cap.text}`,
      )
      .join(" · ");
  }

  const breakdown = Array.isArray(rule.payoutBreakdown)
    ? rule.payoutBreakdown.filter((part) => part && part.percentage != null)
    : [];
  if (breakdown.length > 0) {
    return breakdown
      .map((part) => `${part.percentage}% ${componentLabel(part.component)}`)
      .join(" · ");
  }

  const sourceText = rule.payoutSourceText;
  if (typeof sourceText === "string" && sourceText.trim() && !isNumeric(sourceText)) {
    return sourceText.trim();
  }
  const value = rule.fixedPay ?? rule.payoutPercentage ?? rule.payout;
  if (value === null || value === undefined) return sourceText ?? "—";
  return typeof value === "number" ? `${Number(value.toFixed(4))}%` : String(value);
}

function isNumeric(text) {
  return Number.isFinite(Number.parseFloat(text)) && /^\s*[-+]?[\d.,]+%?\s*$/.test(text);
}

/** Reads field keys the way a person does: `vehicle_segment` -> "vehicle segment". */
// Column keys are the pipeline's internal vocabulary. `rto_cluster` and `gvw_tonnage` are precise and
// mean nothing to a reader deciding whether to trust the output, so the known ones get the name an
// underwriter would use. Anything unmapped falls back to de-underscoring rather than being hidden,
// because an unrecognised key is a signal worth seeing.
const FIELD_LABELS = {
  rto_cluster: "Location",
  gvw_tonnage: "Weight (t)",
  vehicle_weight: "Weight (t)",
  gvw: "Gross weight (t)",
  vehicle_make: "Make",
  vehicle_age: "Vehicle age",
  vehicle_fuel_type: "Fuel",
  nil_dep: "Nil depreciation",
  product_sub_category: "Product",
  policy_type: "Policy type",
};

export function fieldLabel(field) {
  return FIELD_LABELS[field] ?? field.replace(/_/g, " ");
}

/** Orders axis labels as a grid reads — leading numbers numerically, everything else by name. */
export function naturalCompare(a, b) {
  const left = Number.parseFloat(a);
  const right = Number.parseFloat(b);
  const leftIsNumber = Number.isFinite(left);
  const rightIsNumber = Number.isFinite(right);
  if (leftIsNumber && rightIsNumber && left !== right) return left - right;
  if (leftIsNumber !== rightIsNumber) return leftIsNumber ? -1 : 1;
  return String(a).localeCompare(String(b));
}

/**
 * Rolls the per-rule satisfiability verdicts up into one statement.
 *
 * A verdict of `satisfiable` means the solver found an input for which the rule fires;
 * `contradiction` means no such input exists, so the rule can never apply — a genuine extraction
 * defect. `unavailable` means the environment had no solver, and is counted apart from
 * `parse_failed` so "we could not check" never reads as "we checked and it failed".
 *
 * `unconstrained` is counted separately and deliberately. The extractor emits `{"and":[]}` when it
 * could not determine a row's conditions; that parses cleanly and is trivially satisfiable, so a
 * naive tally reports it as verified. It is the opposite of reassuring — a rule with no conditions
 * matches EVERY input, which is a worse defect than one that matches none. Folding these into
 * `satisfiable` would let a corpus of empty rules present itself as fully verified.
 */
export function verificationSummary(rules) {
  const counts = {};
  let checked = 0;
  let unconstrained = 0;
  for (const rule of rules) {
    const verdict = rule.ast?.z3Verdict;
    if (!verdict) continue;
    checked += 1;
    counts[verdict] = (counts[verdict] ?? 0) + 1;
    if (rule.ast?.parsed && (rule.ast?.variables?.length ?? 0) === 0) unconstrained += 1;
  }
  const contradictions = counts.contradiction ?? 0;
  const satisfiable = counts.satisfiable ?? 0;
  return {
    total: rules.length,
    checked,
    counts,
    satisfiable,
    contradictions,
    unconstrained,
    // Rules that were checked, can fire, and actually constrain something.
    sound: Math.max(0, satisfiable - unconstrained),
    unverifiable: (counts.parse_failed ?? 0) + (counts.unavailable ?? 0),
  };
}

/**
 * Per-chunk extraction health.
 *
 * `coverage` is deliberately NOT surfaced: its denominator is keyed by sheet name inconsistently
 * (normalized vs original), which yields values above 1.0, so reporting it would mislead. The
 * per-chunk statuses are sound and are what a reader needs — a chunk that came back PARTIAL dropped
 * source rows, and hiding that would overstate the extraction.
 */
export function extractionHealth(reconciliation) {
  const chunks = Array.isArray(reconciliation?.chunks) ? reconciliation.chunks : [];
  const incomplete = chunks.filter((chunk) => chunk?.status && chunk.status !== "DONE");
  return { total: chunks.length, incomplete };
}

/** Variables the pipeline itself flagged as not belonging to the resolved vocabulary. */
export function unresolvedVariables(rules) {
  const unresolved = new Set();
  for (const rule of rules) {
    for (const used of rule.provenance?.usedVariables ?? []) {
      if (used.mappingStatus === "UNRESOLVED" && used.variable) unresolved.add(used.variable);
    }
  }
  return unresolved;
}

/**
 * Reconciles variable names the extractor invented against the vocabulary Stage 2 resolved.
 *
 * Stage 3 sometimes names a column itself instead of using the resolved key. On the goods-carrier
 * grid it emitted `vehicle_weight` for one chunk and the resolved `gvw_tonnage` for the other, which
 * splits a single tonnage axis into two half-populated ones and makes the grid look like a partial
 * extraction. The payload marks the invented name UNRESOLVED in provenance, so this does not have to
 * guess which names are suspect.
 *
 * A merge is only proposed when all four conditions hold, which is what makes it a reconciliation
 * rather than a rename:
 *   1. the source name is declared UNRESOLVED in provenance
 *   2. the target name IS in the resolved vocabulary
 *   3. both take exactly the same set of values
 *   4. no rule uses both — so no rule can lose a condition to the merge
 *
 * Returns the aliases plus a description of each merge, because a reader is entitled to know that
 * two names were shown as one.
 */
export function reconcileVocabulary(rules, variableResolutions = []) {
  const resolvedKeys = new Set(
    variableResolutions.map((entry) => entry?.mappedKey).filter(Boolean),
  );
  const unresolved = unresolvedVariables(rules);
  const bindingsPerRule = rules.map(bindingsOf);
  const labelsByField = new Map();
  for (const bindings of bindingsPerRule) {
    for (const [field, label] of bindings) {
      if (!labelsByField.has(field)) labelsByField.set(field, new Set());
      labelsByField.get(field).add(label);
    }
  }

  const signature = (field) =>
    JSON.stringify([...(labelsByField.get(field) ?? [])].sort(naturalCompare));
  const coOccurs = (first, second) =>
    bindingsPerRule.some((bindings) => bindings.has(first) && bindings.has(second));

  const aliases = new Map();
  const merges = [];
  for (const candidate of unresolved) {
    if (!labelsByField.has(candidate) || resolvedKeys.has(candidate)) continue;
    for (const target of resolvedKeys) {
      if (!labelsByField.has(target)) continue;
      if (signature(candidate) !== signature(target)) continue;
      if (coOccurs(candidate, target)) continue;
      aliases.set(candidate, target);
      merges.push({
        from: candidate,
        to: target,
        ruleCount: bindingsPerRule.filter((bindings) => bindings.has(candidate)).length,
      });
      break;
    }
  }
  return { aliases, merges };
}

/**
 * Splits rules into ones that can be plotted and ones that cannot, and ranks fields by how many
 * distinct values they take. The extractor emits `{"and":[]}` when it could not determine a row's
 * conditions; those rules have nowhere to sit on a grid and are counted rather than dropped.
 *
 * A field is only reported as `fixed` when it takes one value AND every plotted rule mentions it —
 * otherwise "same for every rule" would be a false claim about a field that just one rule uses.
 *
 * `aliases` renames fields as bindings are read, so a vocabulary reconciliation flows through the
 * axes, the pivot and the qualifier list without any of them needing to know about it.
 */
export function analyseRules(rules, aliases = new Map()) {
  const plotted = [];
  const unplottable = [];
  const labelsByField = new Map();
  const ruleCountByField = new Map();

  for (const rule of rules) {
    const bindings = applyAliases(bindingsOf(rule), aliases);
    if (bindings.size === 0) {
      unplottable.push(rule);
      continue;
    }
    plotted.push({ rule, bindings });
    for (const [field, label] of bindings) {
      if (!labelsByField.has(field)) labelsByField.set(field, new Set());
      labelsByField.get(field).add(label);
      ruleCountByField.set(field, (ruleCountByField.get(field) ?? 0) + 1);
    }
  }

  const fields = [...labelsByField.entries()]
    .map(([field, labels]) => ({
      field,
      labels: [...labels].sort(naturalCompare),
      count: labels.size,
      ruleCount: ruleCountByField.get(field) ?? 0,
    }))
    .sort((a, b) => b.count - a.count || a.field.localeCompare(b.field));

  return {
    plotted,
    unplottable,
    fields,
    varying: fields.filter((entry) => entry.count > 1),
    fixed: fields.filter((entry) => entry.count === 1 && entry.ruleCount === plotted.length),
  };
}

/** Renames binding keys through the alias map, keeping the first label when two keys collapse. */
function applyAliases(bindings, aliases) {
  if (aliases.size === 0) return bindings;
  const renamed = new Map();
  for (const [field, label] of bindings) {
    const target = aliases.get(field) ?? field;
    if (!renamed.has(target)) renamed.set(target, label);
  }
  return renamed;
}

/**
 * Groups rules into rows x columns. A cell can hold more than one rule.
 *
 * Rules that do not mention both axis fields are returned as `unplaced` rather than filed under a
 * placeholder label: a "—" row sitting beside real data reads as a value the grid contains, which
 * it is not. The caller reports the count and the reader can pick different axes.
 */
export function buildPivot(plotted, rowField, columnField) {
  const rows = new Map();
  const columnLabels = new Set();
  const unplaced = [];

  for (const entry of plotted) {
    const rowLabel = entry.bindings.get(rowField);
    const columnLabel = columnField ? entry.bindings.get(columnField) : "";
    if (rowLabel === undefined || columnLabel === undefined) {
      unplaced.push(entry);
      continue;
    }
    columnLabels.add(columnLabel);
    if (!rows.has(rowLabel)) rows.set(rowLabel, new Map());
    const cells = rows.get(rowLabel);
    if (!cells.has(columnLabel)) cells.set(columnLabel, []);
    cells.get(columnLabel).push(entry);
  }

  return {
    rows,
    unplaced,
    rowLabels: [...rows.keys()].sort(naturalCompare),
    columnLabels: [...columnLabels].sort(naturalCompare),
  };
}

/**
 * The default axes: the pair of varying fields that PLACES THE MOST RULES, tie-broken by how full
 * the resulting grid is.
 *
 * Cardinality alone is the obvious choice and the wrong one. The two fields with the most distinct
 * values are often mentioned by different subsets of rules, so pairing them yields a large, mostly
 * empty grid with an "absent" row and column. Co-presence optimises directly for what a reader
 * wants: a dense matrix that looks like the sheet it came from. On a uniform grid — one condition
 * per row heading, one per column heading — both signals agree anyway.
 *
 * The higher-cardinality field goes on the rows, because a grid is easier to read tall than wide.
 */
export function defaultAxes(analysis) {
  const candidates = analysis.varying;
  if (candidates.length < 2) {
    return {
      rowField: candidates[0]?.field ?? analysis.fields[0]?.field ?? null,
      columnField: null,
    };
  }

  let best = null;
  for (let first = 0; first < candidates.length; first += 1) {
    for (let second = first + 1; second < candidates.length; second += 1) {
      const score = scoreAxisPair(analysis.plotted, candidates[first], candidates[second]);
      if (!best || score.placed > best.placed || (score.placed === best.placed && score.density > best.density)) {
        best = score;
      }
    }
  }
  return { rowField: best.rowField, columnField: best.columnField };
}

/** How many rules a pair of fields places, and how much of the resulting grid is filled. */
function scoreAxisPair(plotted, firstField, secondField) {
  const [rows, columns] =
    firstField.count >= secondField.count ? [firstField, secondField] : [secondField, firstField];
  const pivot = buildPivot(plotted, rows.field, columns.field);
  const cellTotal = pivot.rowLabels.length * pivot.columnLabels.length;
  let occupied = 0;
  for (const rowLabel of pivot.rowLabels) {
    for (const columnLabel of pivot.columnLabels) {
      if ((pivot.rows.get(rowLabel)?.get(columnLabel) ?? []).length > 0) occupied += 1;
    }
  }
  return {
    rowField: rows.field,
    columnField: columns.field,
    placed: plotted.length - pivot.unplaced.length,
    density: cellTotal === 0 ? 0 : occupied / cellTotal,
  };
}
