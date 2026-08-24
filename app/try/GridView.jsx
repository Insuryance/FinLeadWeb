// The extracted rules pivoted back into a grid.
//
// Deliberately free of state, effects and data fetching: everything it draws arrives as props. That
// is what lets it be server-rendered against a real extraction payload in scripts/render.check.mjs,
// which is the only way to prove the table actually draws without a browser.

import { fieldLabel, payoutOf } from "./pivot.mjs";

/** One cell: the payout, a component tag when the run mixes components, then any off-axis condition. */
function PivotCell({ entries, componentCount, qualifierFields }) {
  if (entries.length === 0) return <span className="gt-pivot-empty">·</span>;
  return entries.map(({ rule, bindings }, index) => (
    <div key={index} className="gt-pivot-entry">
      <span className="gt-pivot-payout" title={rule.payoutSourceText || undefined}>
        {payoutOf(rule)}
      </span>
      {componentCount > 1 && rule.payoutComponent && (
        <span className="gt-pivot-tag">{rule.payoutComponent}</span>
      )}
      {/* Off-axis conditions must carry their field name. A boolean field renders as a bare
          "false" otherwise, which tells the reader nothing about what is false. */}
      {qualifierFields
        .map((field) => ({ field, label: bindings.get(field) }))
        .filter((entry) => entry.label !== undefined)
        .map((entry) => (
          <span key={entry.field} className="gt-pivot-qual">
            {fieldLabel(entry.field)}: {entry.label}
          </span>
        ))}
    </div>
  ));
}

function AxisPicker({ label, value, options, includeNone, onChange }) {
  return (
    <label className="gt-axis">
      <span className="fl-muted">{label}</span>
      <select className="gt-select" value={value ?? ""} onChange={onChange}>
        {includeNone && <option value="">none</option>}
        {options.map((entry) => (
          <option key={entry.field} value={entry.field}>
            {fieldLabel(entry.field)} ({entry.count})
          </option>
        ))}
      </select>
    </label>
  );
}

export default function GridView({
  analysis,
  reconciliation,
  pivot,
  axisCandidates,
  rowField,
  columnField,
  qualifierFields,
  componentCount,
  ruleCount,
  onRowFieldChange,
  onColumnFieldChange,
  onShowRuleList,
}) {
  if (!rowField) {
    return (
      <p className="fl-muted gt-note">
        None of the extracted rules carry conditions that can be placed on a grid. The rule list
        shows what came back.
      </p>
    );
  }

  const placed = analysis.plotted.length - pivot.unplaced.length;

  return (
    <>
      <div className="gt-axes">
        <AxisPicker
          label="Rows"
          value={rowField}
          options={axisCandidates}
          onChange={(event) => onRowFieldChange(event.target.value)}
        />
        <AxisPicker
          label="Columns"
          value={columnField}
          includeNone
          options={axisCandidates.filter((entry) => entry.field !== rowField)}
          onChange={(event) => onColumnFieldChange(event.target.value || null)}
        />
      </div>

      {/* Showing two field names as one column is a judgement the reader is entitled to see. */}
      {reconciliation.merges.length > 0 && (
        <p className="fl-muted gt-note">
          {reconciliation.merges.map((merge) => (
            <span key={merge.from}>
              <strong>{fieldLabel(merge.from)}</strong> was not in the resolved field vocabulary. It
              takes exactly the same values as <strong>{fieldLabel(merge.to)}</strong> and no rule
              uses both, so the {merge.ruleCount} rules naming it are shown on that column.
            </span>
          ))}
        </p>
      )}

      {analysis.fixed.length > 0 && (
        <p className="fl-muted gt-note">
          Same for every rule below:{" "}
          {analysis.fixed.map((entry) => (
            <span key={entry.field} className="fl-chip gt-chip">
              {fieldLabel(entry.field)} = {entry.labels[0]}
            </span>
          ))}
        </p>
      )}

      <div className="gt-scroll gt-sheet-wrap">
        <table className="gt-sheet gt-pivot">
          <thead>
            <tr>
              <th className="gt-sheet-corner gt-pivot-corner">{fieldLabel(rowField)}</th>
              {pivot.columnLabels.map((label) => (
                <th key={label} className="gt-sheet-colhead gt-pivot-colhead">
                  {label || "payout"}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pivot.rowLabels.map((rowLabel) => (
              <tr key={rowLabel}>
                <th className="gt-sheet-rowhead gt-pivot-rowhead">{rowLabel}</th>
                {pivot.columnLabels.map((columnLabel) => (
                  <td key={columnLabel} className="gt-sheet-cell gt-pivot-cell">
                    <PivotCell
                      entries={pivot.rows.get(rowLabel)?.get(columnLabel) || []}
                      componentCount={componentCount}
                      qualifierFields={qualifierFields}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="fl-muted gt-foot">
        {placed} of {ruleCount} rules on this grid
        {qualifierFields.length > 0 && (
          <> · cells also show {qualifierFields.map(fieldLabel).join(", ")}</>
        )}
        {pivot.unplaced.length > 0 && (
          <>
            {" · "}
            <strong>{pivot.unplaced.length}</strong> do not use both of these fields — try different
            axes
          </>
        )}
        {analysis.unplottable.length > 0 && (
          <>
            {" · "}
            <strong>{analysis.unplottable.length}</strong> came back with no resolvable conditions —{" "}
            <button type="button" className="gt-link" onClick={onShowRuleList}>
              see them in the rule list
            </button>
          </>
        )}
      </p>
    </>
  );
}
