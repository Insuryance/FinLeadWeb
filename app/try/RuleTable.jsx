// Extracted rules as a table: one column per condition field.
//
// Replaces a single "Condition" column holding JSON-Logic rendered as prose
// ("rto_cluster in [CHENNAI] AND vehicle_weight >= 0 AND vehicle_weight <= 2.3"). That form is
// accurate and unreadable — a reader cannot scan it, sort it, or compare two rules by eye. Giving
// each field its own column turns the same data into something that reads like the source sheet.
//
// Columns are ordered by how many rules use them, so the fields that matter are leftmost.

import { bindingsOf, fieldLabel, payoutOf } from "./pivot.mjs";

// A whole commission workbook yields thousands of rules — the 21-sheet goods-carrier book produces
// several thousand. Rendering every row costs tens of thousands of DOM nodes for rows nobody scrolls
// to, so the table shows a window by default and says exactly how much it is showing.
const DEFAULT_LIMIT = 250;

/** Applies the vocabulary reconciliation, so this table agrees with the resolved field list. */
function bindingsFor(rule, aliases) {
  const bindings = bindingsOf(rule);
  if (!aliases || aliases.size === 0) return bindings;
  const renamed = new Map();
  for (const [field, label] of bindings) {
    const target = aliases.get(field) ?? field;
    if (!renamed.has(target)) renamed.set(target, label);
  }
  return renamed;
}

export default function RuleTable({ rules, fields, aliases, limit = DEFAULT_LIMIT }) {
  const columns = fields.map((entry) => entry.field);
  const shown = rules.slice(0, limit);
  const rows = shown.map((rule) => ({ rule, bindings: bindingsFor(rule, aliases) }));
  const withoutConditions = rows.filter((row) => row.bindings.size === 0).length;
  const truncated = rules.length > shown.length;

  return (
    <>
      <div className="gt-scroll gt-sheet-wrap">
        <table className="gt-sheet gt-pivot">
          <thead>
            <tr>
              <th className="gt-sheet-colhead gt-pivot-colhead">Rule</th>
              <th className="gt-sheet-colhead gt-pivot-colhead">Payout</th>
              {columns.map((field) => (
                <th key={field} className="gt-sheet-colhead gt-pivot-colhead">
                  {fieldLabel(field)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ rule, bindings }, index) => (
              <tr key={rule.id ?? index}>
                <td className="gt-sheet-cell gt-rule-name">{rule.name ?? "—"}</td>
                <td className="gt-sheet-cell gt-pivot-cell">
                  <span className="gt-pivot-payout" title={rule.payoutSourceText || undefined}>
                    {payoutOf(rule)}
                  </span>
                </td>
                {columns.map((field) => (
                  <td key={field} className="gt-sheet-cell">
                    {bindings.get(field) ?? <span className="gt-pivot-empty">·</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="fl-muted gt-foot">
        {truncated ? (
          <>
            showing the first {shown.length.toLocaleString()} of{" "}
            <strong>{rules.length.toLocaleString()}</strong> rules
          </>
        ) : (
          <>{rules.length.toLocaleString()} rules</>
        )}{" "}
        · {columns.length} condition fields
        {withoutConditions > 0 && (
          <>
            {" · "}
            <strong>{withoutConditions}</strong> of those shown carry no conditions, so every
            condition column is empty for them
          </>
        )}
      </p>
    </>
  );
}
