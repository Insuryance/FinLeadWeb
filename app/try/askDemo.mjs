// The scripted assistant behind the demo panel.
//
// Every answer here is DERIVED from the run payload — the rules, their provenance, the workbook
// preview and the footnotes the pipeline read. None of it is written prose about what the product
// might say. That matters for two reasons: a canned transcript would go stale the moment the run
// changes, and a demo that invents its own answers is the one thing a technical viewer will catch.
//
// If the data needed for a question is not present, the question is not offered. It is better to
// show three answerable questions than five where two are empty.

const COMPONENT_LABELS = {
  NET: "net premium",
  OD: "own-damage premium",
  TP: "third-party premium",
  OD_PLUS_ADDON: "own damage + add-ons",
};

/**
 * Sheets to lead with come from the sample definition (`sample.leadSheets`), not from here.
 *
 * The rule list is windowed, so whichever sheets the pipeline happened to extract first are the only
 * ones a viewer sees. Which sheets are worth opening on is a judgement about a particular workbook,
 * so it lives with that workbook's catalogue entry — a second card names its own, and a card that
 * names none keeps the run's own order.
 */
const NO_LEAD_SHEETS = [];

/** The worksheet tab a rule came from, or null when its table cannot be resolved. */
export function sheetOfRule(rule, tables) {
  const tableIndex = rule?.provenance?.tableIndex ?? rule?.sourceTable;
  if (tableIndex === undefined) return null;
  return tablesByIndex(tables).get(tableIndex)?.region ?? null;
}

function leadRank(sheetName, leadSheets = NO_LEAD_SHEETS) {
  const index = leadSheets.indexOf(sheetName);
  return index === -1 ? leadSheets.length : index;
}

/**
 * Rules reordered so the lead sheets come first, preserving the pipeline's order within each sheet.
 * Display only — the analysis and reconciliation still see the run's own ordering.
 */
export function orderRulesForDisplay(rules, tables, leadSheets = NO_LEAD_SHEETS) {
  return rules
    .map((rule, index) => ({ rule, index, rank: leadRank(sheetOfRule(rule, tables), leadSheets) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((entry) => entry.rule);
}

/** Tables reordered on the same rule, so the inventory agrees with the rule list. */
export function orderTablesForDisplay(tables, leadSheets = NO_LEAD_SHEETS) {
  return [...(tables ?? [])]
    .map((table, index) => ({ table, index, rank: leadRank(table?.region, leadSheets) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((entry) => entry.table);
}

/** Spreadsheet column letter for a zero-based index: 0 -> A, 26 -> AA. */
export function columnLetter(index) {
  let letters = "";
  let n = index + 1;
  while (n > 0) {
    const remainder = (n - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}

function tablesByIndex(tables) {
  const byIndex = new Map();
  for (const table of tables ?? []) {
    if (table?.tableIndex !== undefined && table?.tableIndex !== null) {
      byIndex.set(table.tableIndex, table);
    }
  }
  return byIndex;
}

function sheetsByName(sheets) {
  const byName = new Map();
  for (const sheet of sheets ?? []) if (sheet?.name) byName.set(sheet.name, sheet);
  return byName;
}

/**
 * Resolve a rule back to the cell it came from.
 *
 * The chain is: provenance.tableIndex -> table.region (which holds the sheet TAB NAME, not a cell
 * range) -> that sheet in the workbook preview -> provenance.sourceRows[0] as a 1-based worksheet
 * row. The column is then the cell in that row whose text equals the rule's payoutSourceText.
 *
 * A value can repeat across columns in one row, so a value match alone picks the wrong column: on
 * the ROI sheet every IRDA cell matches the first IRDA column. Candidates are therefore ranked by
 * how well the column's own header agrees with the rule's numeric bounds, and only then by position.
 * Returns null rather than a guess when the row cannot be found.
 */
export function locateRule(rule, tables, sheets) {
  const provenance = rule?.provenance ?? {};
  const rowNumber = (provenance.sourceRows ?? rule?.sourceRows ?? [])[0];
  const tableIndex = provenance.tableIndex ?? rule?.sourceTable;
  if (rowNumber === undefined || tableIndex === undefined) return null;

  const table = tablesByIndex(tables).get(tableIndex);
  if (!table?.region) return null;
  const sheet = sheetsByName(sheets).get(table.region);
  if (!sheet) return null;

  const row = (sheet.rows ?? []).find((candidate) => candidate?.number === rowNumber);
  if (!row) return null;

  const headers = table.columnHeaders ?? [];
  const wanted = String(rule?.payoutSourceText ?? "").trim();
  const candidates = (row.cells ?? [])
    .map((cell, index) => ({ index, cell }))
    .filter(({ cell }) => wanted !== "" && String(cell).trim() === wanted);

  const bounds = numericBounds(rule);
  const scored = candidates
    .map((candidate) => ({
      ...candidate,
      score: headerAgreement(headers[candidate.index], bounds),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const chosen = scored[0];
  return {
    sheetName: sheet.name,
    rowNumber,
    cells: row.cells ?? [],
    headers,
    // The row's leading text cells are what a person reads to recognise the row — "Kerala /
    // ERNAKULAM" locates it far better than "row 4" does.
    //
    // Scans for the first two non-numeric cells rather than taking cells[0..1]: on a private-car sheet
    // the label columns are not always first, and slicing blindly produced an EMPTY label, which then
    // rendered as "Where does the  payout come from?".
    rowLabel: (row.cells ?? [])
      .slice(0, Math.max(2, (chosen?.index ?? 2)))
      .map((cell) => String(cell).trim())
      .filter((text) => text && !/^[\d.,%]+$/.test(text))
      .slice(0, 2)
      .join(" / "),
    columnIndex: chosen ? chosen.index : null,
    columnLetter: chosen ? columnLetter(chosen.index) : null,
    columnHeader: chosen ? headers[chosen.index] ?? null : null,
    value: chosen ? String(chosen.cell) : null,
    reference: chosen ? `${columnLetter(chosen.index)}${rowNumber}` : `row ${rowNumber}`,
    exact: Boolean(chosen),
  };
}

/** The numeric window a rule constrains, used to disambiguate repeated values across columns. */
function numericBounds(rule) {
  try {
    const numbers = [];
    const walk = (node) => {
      if (!node || typeof node !== "object") return;
      for (const [op, args] of Object.entries(node)) {
        if (!Array.isArray(args)) continue;
        if (op === "and" || op === "or") args.forEach(walk);
        else for (const arg of args) if (typeof arg === "number") numbers.push(arg);
      }
    };
    walk(JSON.parse(rule.logicalExpression));
    return numbers;
  } catch {
    return [];
  }
}

/** How strongly a column header's own numbers agree with the rule's bounds. */
function headerAgreement(header, bounds) {
  if (!header || bounds.length === 0) return 0;
  const inHeader = String(header).match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  if (inHeader.length === 0) return 0;
  return inHeader.filter((value) => bounds.includes(value)).length;
}

function ruleFieldSet(rule) {
  const fields = new Set();
  const walk = (node) => {
    if (!node || typeof node !== "object") return;
    for (const [op, args] of Object.entries(node)) {
      if (!Array.isArray(args)) continue;
      if (op === "and" || op === "or") args.forEach(walk);
      else for (const arg of args) if (arg && typeof arg === "object" && "var" in arg) fields.add(arg.var);
    }
  };
  try {
    walk(JSON.parse(rule.logicalExpression));
  } catch {
    /* a rule whose logic will not parse simply contributes no fields */
  }
  return fields;
}

/**
 * Build the preset conversation. Each entry carries a `kind` the panel knows how to render and an
 * `answer` object holding only data, so the panel does no computation and no interpretation.
 */
/** The presentation fields of a per-sheet tally, without the accumulator internals. */
function pick(entry) {
  if (!entry) return null;
  return { sheet: entry.sheet, average: entry.average, rules: entry.count, max: entry.max };
}

/**
 * Set the two largest sheets against each other on the weight bands they have in common.
 *
 * This is the comparison a person cannot do by eye, because each region lives on its own tab and the
 * columns are not in the same order. Returns null unless the two sheets genuinely share at least three
 * columns — a comparison over one band is noise dressed as a finding.
 */
function buildBenchmark(rules, tables, sheets, leadSheets = NO_LEAD_SHEETS) {
  const perSheet = new Map();
  for (const rule of rules) {
    const at = locateRule(rule, tables, sheets);
    const pay = Number(rule.fixedPay);
    if (!at?.exact || !at.columnHeader || !Number.isFinite(pay)) continue;
    const columns = perSheet.get(at.sheetName) ?? new Map();
    const cell = columns.get(at.columnHeader) ?? { total: 0, count: 0 };
    cell.total += pay;
    cell.count += 1;
    columns.set(at.columnHeader, cell);
    perSheet.set(at.sheetName, columns);
  }

  // Prefer the lead sheets so the chart names the regions the rest of the page is already showing.
  // Falls back to the two sheets with the most resolved columns when a lead sheet has none.
  const ranked = [...perSheet.entries()].sort(
    (a, b) => leadRank(a[0], leadSheets) - leadRank(b[0], leadSheets) || b[1].size - a[1].size,
  );
  if (ranked.length < 2) return null;

  const [leftName, leftColumns] = ranked[0];
  // The right-hand sheet should also be one the page is already showing, so a lead sheet with enough
  // shared columns wins over an unrelated sheet that happens to share more. `ranked` is already in
  // lead order, so the first candidate clearing the threshold is the most preferred one.
  const candidates = ranked.slice(1).map(([rightName, rightColumns]) => ({
    rightName,
    rightColumns,
    shared: [...leftColumns.keys()].filter((column) => rightColumns.has(column)),
  }));
  const best =
    candidates.find((candidate) => candidate.shared.length >= 3) ??
    [...candidates].sort((a, b) => b.shared.length - a.shared.length)[0];
  if (!best || best.shared.length < 3) return null;

  // Numeric-looking bands first so the axis reads in a sensible order, then by name.
  const ordered = best.shared
    .map((column) => ({ column, lead: Number(String(column).match(/\d+(?:\.\d+)?/)?.[0] ?? Infinity) }))
    .sort((a, b) => a.lead - b.lead || a.column.localeCompare(b.column));

  const data = ordered
    .map(({ column }) => {
      const left = leftColumns.get(column);
      const right = best.rightColumns.get(column);
      const leftAverage = left.total / left.count;
      const rightAverage = right.total / right.count;
      return {
        period: column,
        [leftName]: Number(leftAverage.toFixed(1)),
        [best.rightName]: Number(rightAverage.toFixed(1)),
        delta: Number((leftAverage - rightAverage).toFixed(1)),
      };
    })
    // A band where neither region pays anything is two empty bars and a "same" label: it occupies a
    // row of the chart to say nothing. Bands where only ONE side is zero are kept — that is a real
    // and striking difference.
    .filter((row) => row[leftName] > 0 || row[best.rightName] > 0)
    .slice(0, 6);
  if (data.length < 3) return null;

  return {
    id: "benchmark",
    label: "Benchmark two regions",
    question: `How does ${leftName} compare with ${best.rightName} band for band?`,
    kind: "chart",
    answer: {
      chartType: "comparison_bar",
      title: `Average commission by weight band — ${leftName} vs ${best.rightName}`,
      categories: [leftName, best.rightName],
      data,
      note: {
        widest: [...data].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0],
        left: leftName,
        right: best.rightName,
      },
    },
  };
}

export function demoQuestions({
  rules = [],
  tables = [],
  sheets = [],
  verification,
  leadSheets = NO_LEAD_SHEETS,
}) {
  const questions = [];

  // 1. Provenance. The whole point: an extracted number traced back to a cell a person can open.
  const traceable = orderRulesForDisplay(rules, tables, leadSheets)
    .map((rule) => ({ rule, at: locateRule(rule, tables, sheets) }))
    .filter(
      ({ at, rule }) =>
        at?.exact &&
        Number.isFinite(Number(rule.fixedPay)) &&
        // Without a row label the question reads "Where does the  payout come from?". Prefer a rule
        // whose row a person can actually recognise.
        Boolean(at.rowLabel),
    );
  if (traceable.length > 0) {
    const { rule, at } = traceable[0];
    questions.push({
      id: "provenance",
      // Two forms on purpose. `label` is what the chip shows — short enough that five of them tile
      // evenly instead of wrapping into a ragged wall. `question` is what the reader "said", so it
      // can be a full sentence naming the actual row.
      label: "Trace a payout to its cell",
      question: `Where does the ${at.rowLabel} payout actually come from?`,
      kind: "provenance",
      answer: {
        rule,
        at,
        traceableCount: traceable.length,
        totalCount: rules.length,
      },
    });
  }

  // 2. A term the workbook uses instead of a number, resolved into components.
  //
  // Note on sourcing: these cells say "IRDA" and carry no percentage. The components come from the
  // IRDA schedule the pipeline applied (rule.irdaPayoutConfigApplied), NOT from a footnote in this
  // workbook — nothing in document.footers or any table's footnotes mentions IRDA, so claiming a
  // footnote here would be a fabrication.
  const irdaRule = rules.find(
    (rule) => Array.isArray(rule.payoutBreakdown) && rule.payoutBreakdown.length > 0,
  );
  if (irdaRule) {
    const irdaRules = rules.filter(
      (rule) => Array.isArray(rule.payoutBreakdown) && rule.payoutBreakdown.length > 0,
    );
    questions.push({
      id: "footnote",
      label: "What do the IRDA cells pay?",
      question: 'Some cells just say "IRDA" instead of a number \u2014 what do they actually pay?',
      kind: "footnote",
      answer: {
        components: irdaRule.payoutBreakdown.map((part) => ({
          label: COMPONENT_LABELS[part.component] ?? String(part.component ?? "").toLowerCase(),
          percentage: part.percentage,
        })),
        ruleCount: irdaRules.length,
        // Components apply to different premium bases, so they must never be added together.
        separateBases: irdaRule.payoutBreakdown.length > 1,
      },
    });
  }

  // 3. Highest payouts — the question anyone asks first of a commission grid.
  //
  // Several rules can share a row and a rate (one per tonnage column), so the raw top-5 repeats the
  // same line. Deduplicate on where the number came from, and prefer an entry whose column was
  // pinned exactly over one that only knows the row.
  const paid = rules
    .filter((rule) => Number.isFinite(Number(rule.fixedPay)))
    .map((rule) => ({ rule, at: locateRule(rule, tables, sheets) }))
    .sort(
      (a, b) =>
        Number(b.rule.fixedPay) - Number(a.rule.fixedPay) ||
        Number(Boolean(b.at?.exact)) - Number(Boolean(a.at?.exact)),
    );
  const seen = new Set();
  const topRows = [];
  for (const { rule, at } of paid) {
    const key = `${at?.sheetName ?? rule.sheetName}|${at?.rowLabel ?? rule.name}|${rule.fixedPay}`;
    if (seen.has(key)) continue;
    seen.add(key);
    topRows.push({
      label: at?.rowLabel || rule.name,
      column: at?.columnHeader ?? "",
      sheet: at?.sheetName ?? rule.sheetName ?? "",
      reference: at?.exact ? at.reference : "",
      payout: Number(rule.fixedPay),
      component: COMPONENT_LABELS[rule.payoutComponent] ?? "",
    });
    if (topRows.length === 5) break;
  }
  if (topRows.length > 0) {
    questions.push({
      id: "top",
      label: "Highest rates in the book",
      question: "Which payouts in this book are the most generous?",
      kind: "table",
      answer: { rows: topRows, max: topRows[0].payout },
    });
  }

  // 4. The workbook itself, in the same paired-bar form as the two-region benchmark.
  //
  // A stacked count-per-band chart was here first. It showed volume, which is the least interesting
  // thing about a commission book — what matters is the rate, and how far the top of a sheet sits
  // above its own average. Same visual language as the benchmark below, so the two read as one idea.
  const bySheet = new Map();
  for (const rule of rules) {
    const sheetName = sheetOfRule(rule, tables) ?? rule.sheetName;
    const pay = Number(rule.fixedPay);
    if (!sheetName || !Number.isFinite(pay)) continue;
    const bucket = bySheet.get(sheetName) ?? { count: 0, total: 0, max: 0 };
    bucket.count += 1;
    bucket.total += pay;
    bucket.max = Math.max(bucket.max, pay);
    bySheet.set(sheetName, bucket);
  }
  if (bySheet.size > 1) {
    const tallies = [...bySheet.entries()].map(([sheet, bucket]) => ({
      sheet,
      ...bucket,
      average: bucket.total / bucket.count,
    }));
    // Lead sheets first, then the rest by size, so the chart opens on the sheets the table shows.
    const ordered = [
      ...leadSheets.map((name) => tallies.find((entry) => entry.sheet === name)).filter(Boolean),
      ...tallies
        .filter((entry) => !leadSheets.includes(entry.sheet))
        .sort((a, b) => b.count - a.count),
    ].slice(0, 7);

    questions.push({
      id: "compare",
      label: "Chart the whole workbook",
      question: "Across the workbook, how far does each sheet's top rate sit above its average?",
      kind: "chart",
      answer: {
        chartType: "comparison_bar",
        title: "Average against highest commission, per sheet",
        categories: ["average", "highest"],
        data: ordered.map((entry) => ({
          period: entry.sheet,
          average: Number(entry.average.toFixed(1)),
          highest: entry.max,
          delta: Number((entry.max - entry.average).toFixed(1)),
          rules: entry.count,
        })),
        note: {
          regions: tallies.length,
          richest: pick([...tallies].sort((a, b) => b.average - a.average)[0]),
          leanest: pick([...tallies].sort((a, b) => a.average - b.average)[0]),
        },
      },
    });
  }

  // 5. Two regions set against each other on the bands they share, as a grouped bar with deltas.
  const benchmark = buildBenchmark(rules, tables, sheets, leadSheets);
  if (benchmark) questions.push(benchmark);

  // 6. What the rules actually key on. Answers "is this a real model of the book, or a flat list?"
  const fieldCounts = new Map();
  for (const rule of rules) {
    for (const field of ruleFieldSet(rule)) {
      fieldCounts.set(field, (fieldCounts.get(field) ?? 0) + 1);
    }
  }
  if (fieldCounts.size > 0) {
    questions.push({
      id: "drivers",
      label: "What drives the rate?",
      question: "What decides the rate \u2014 and did anything contradict itself?",
      kind: "drivers",
      answer: {
        fields: [...fieldCounts.entries()]
          .map(([field, count]) => ({ field, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6),
        verification: verification ?? null,
        total: rules.length,
      },
    });
  }

  return questions;
}
