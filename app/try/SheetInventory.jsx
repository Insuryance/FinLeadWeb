// Every table the pipeline found in the workbook, and what it decided each one is.
//
// Stage 1.5 classifies each table as a rule grid, a reference lookup, or metadata, and records why.
// That decision governs everything downstream — only rule grids are extracted — so it belongs on
// screen. Without it a reader cannot tell whether a sheet produced no rules because it holds none or
// because the classifier misread it.

const KIND_LABELS = {
  RULE_TABLE: "rule grid",
  REFERENCE_TABLE: "reference grid",
  METADATA: "notes",
};

/** Rule grids drive extraction, so they read as the confident case; notes are deliberately faint. */
function toneFor(kind) {
  if (kind === "RULE_TABLE") return "gt-tone-ok";
  if (kind === "REFERENCE_TABLE") return "gt-tone-warn";
  return "gt-tone-new";
}

function kindLabel(kind) {
  return KIND_LABELS[kind] ?? String(kind ?? "unclassified").toLowerCase().replace(/_/g, " ");
}

export default function SheetInventory({ tables }) {
  if (!Array.isArray(tables) || tables.length === 0) return null;

  const ruleGrids = tables.filter((table) => table.kind === "RULE_TABLE").length;
  const referenceGrids = tables.filter((table) => table.kind === "REFERENCE_TABLE").length;

  return (
    <>
      <p className="fl-muted gt-note">
        {tables.length} table{tables.length === 1 ? "" : "s"} found · {ruleGrids} rule grid
        {ruleGrids === 1 ? "" : "s"} · {referenceGrids} reference grid
        {referenceGrids === 1 ? "" : "s"} · only rule grids are extracted
      </p>
      <div className="gt-scroll">
        <table className="gt-table">
          <thead>
            <tr>
              <th>Sheet / region</th>
              <th>Type</th>
              <th>Size</th>
              <th>Why</th>
            </tr>
          </thead>
          <tbody>
            {tables.map((table, index) => (
              <tr key={table.tableIndex ?? index}>
                <td>{table.region ?? `table ${index + 1}`}</td>
                <td>
                  <span className={`gt-tone ${toneFor(table.kind)}`}>{kindLabel(table.kind)}</span>
                </td>
                <td className="gt-nowrap">
                  {table.rows ?? "?"} × {table.cols ?? "?"}
                </td>
                <td className="fl-muted">{table.kindReason ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
