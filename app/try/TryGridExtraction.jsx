"use client";

// Live grid-extraction trial. Everything shown here comes from the FinLead extraction
// pipeline via /api/grid-trial/* (see app/api/grid-trial/[...path]/route.js) — no canned data.
//
// Flow: list samples -> preview the workbook (instant, no model call) -> run the pipeline
// (or serve a saved run) -> show extracted rules and how each column was understood.

import { useEffect, useMemo, useRef, useState } from "react";
import SiteHeader from "../components/SiteHeader";
import ProgressTrack from "./ProgressTrack";
import RunHealth from "./RunHealth";
import RuleTable from "./RuleTable";
import SheetInventory from "./SheetInventory";
import AskPanel from "./AskPanel";
import { analyseRules, reconcileVocabulary, verificationSummary } from "./pivot.mjs";
import { demoQuestions, orderRulesForDisplay, orderTablesForDisplay } from "./askDemo.mjs";

const API = "/api/grid-trial";

// The trial serves previously completed extractions, so there is nothing to poll. Instead the saved
// run's real progress log is replayed, with each line's delay proportional to how long that stage
// actually took. The pacing is compressed into REPLAY_MS so a viewer sees the shape of the work
// (rule extraction dominating) without waiting minutes, and every line and timing shown is genuine.
const REPLAY_MS = 7000;

async function api(path, options) {
  const res = await fetch(API + path, {
    ...options,
    headers: { "content-type": "application/json", ...(options?.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}

/**
 * Schedules each progress line at its real relative offset, scaled to totalMs.
 * Falls back to even spacing when the lines carry no parseable timestamps.
 */
function replaySchedule(lines, totalMs) {
  const stamps = lines.map((line) => {
    const split = line.indexOf("  ");
    return split > 0 ? Date.parse(line.slice(0, split)) : NaN;
  });
  const usable = stamps.every((s) => Number.isFinite(s));
  if (!usable) return lines.map((_, i) => ((i + 1) / lines.length) * totalMs);
  const first = stamps[0];
  const span = stamps[stamps.length - 1] - first;
  if (span <= 0) return lines.map((_, i) => ((i + 1) / lines.length) * totalMs);
  return stamps.map((s) => ((s - first) / span) * totalMs);
}

function statusTone(status) {
  if (status === "MATCHED") return "gt-tone-ok";
  if (status === "INFERRED") return "gt-tone-warn";
  return "gt-tone-new";
}

/** Renders JSON-Logic as readable text; falls back to raw JSON for shapes it does not know. */
function humanise(node) {
  if (node === null || typeof node !== "object") return JSON.stringify(node);
  if (Array.isArray(node)) return node.map(humanise).join(", ");
  const [op, args] = Object.entries(node)[0] || [];
  if (op === "var") return String(args);
  if (op === "and" || op === "or") return args.map(humanise).join(op === "and" ? " AND " : " OR ");
  if (op === "in") return `${humanise(args[0])} in [${(args[1] || []).join(", ")}]`;
  if (["==", "!=", "<", "<=", ">", ">="].includes(op)) return `${humanise(args[0])} ${op} ${humanise(args[1])}`;
  return JSON.stringify(node);
}

function condition(rule) {
  const raw = rule.logicalExpression ?? rule.condition ?? "";
  if (!raw) return "—";
  try {
    return humanise(typeof raw === "string" ? JSON.parse(raw) : raw);
  } catch {
    return String(raw);
  }
}

/** 0 -> "A", 25 -> "Z", 26 -> "AA". Bijective base-26, as spreadsheets label columns. */
function columnLabel(index) {
  let label = "";
  let n = index;
  while (n >= 0) {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  }
  return label;
}

/** Values that a spreadsheet would right-align: numbers, percentages, currency. */
function isNumericish(value) {
  return /^[-+]?[₹$€£]?\s?[\d,]+(\.\d+)?%?$/.test(String(value).trim());
}

export default function TryGridExtraction() {
  const [samples, setSamples] = useState([]);
  const [bootError, setBootError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [preview, setPreview] = useState(null);
  const [sheetTab, setSheetTab] = useState(0);
  const [run, setRun] = useState(null);
  const [running, setRunning] = useState(false);
  const [cacheInfo, setCacheInfo] = useState(null);
  const [runError, setRunError] = useState(null);
  const [view, setView] = useState("rules");
  const [shownLines, setShownLines] = useState(0);
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    api("/samples")
      .then((body) => setSamples(body.samples || []))
      .catch((e) => setBootError(e.message));
  }, []);

  async function choose(sample) {
    timers.current.forEach(clearTimeout);
    setSelected(sample);
    setPreview(null);
    setSheetTab(0);
    setRun(null);
    setCacheInfo(null);
    setRunError(null);
    setView("rules");
    setShownLines(0);
    try {
      setPreview(await api(`/samples/${encodeURIComponent(sample.id)}/preview`));
    } catch (e) {
      setRunError(`Could not load the workbook preview: ${e.message}`);
    }
  }

  async function start() {
    setRunning(true);
    setRunError(null);
    setCacheInfo(null);
    setRun(null);
    setShownLines(0);
    try {
      const started = await api("/runs", {
        method: "POST",
        body: JSON.stringify({ sampleId: selected.id }),
      });
      const full = await api(`/runs/${started.runId}`);
      setCacheInfo({ extractedAt: started.extractedAt });
      replay(full);
    } catch (e) {
      setRunError(e.message);
      setRunning(false);
    }
  }

  /** Reveals the saved progress lines on their real relative cadence, then the results. */
  function replay(full) {
    const lines = full.progressLog || [];
    if (!lines.length) {
      setRun(full);
      setRunning(false);
      return;
    }
    const offsets = replaySchedule(lines, REPLAY_MS);
    timers.current.forEach(clearTimeout);
    timers.current = offsets.map((delay, i) =>
      setTimeout(() => {
        setShownLines(i + 1);
        if (i === lines.length - 1) {
          setRun(full);
          setRunning(false);
        }
      }, Math.max(250, delay)),
    );
    setRun({ ...full, comparison: null });
  }

  const engine = run?.comparison?.engines?.[0] || null;
  const rules = engine?.rules || [];
  const mappings = engine?.variableResolutions || [];
  const timings = engine?.timings || {};
  const sheet = preview?.sheets?.[sheetTab];

  const counts = mappings.reduce((acc, m) => ({ ...acc, [m.status]: (acc[m.status] || 0) + 1 }), {});

  // Derived, not stored: the field list the rule table columns come from must not be able to drift
  // out of step with the rules currently on screen. The vocabulary reconciliation is applied here so
  // the table shows one column per real condition field rather than one per name the extractor used.
  const reconciliation = useMemo(() => reconcileVocabulary(rules, mappings), [rules, mappings]);
  // The rule list shows the first 250 of 4,705 rows, so whichever sheets the pipeline happened to
  // extract first were the only ones anyone saw. Leading with a fixed set of sheets means the table,
  // the charts and the chat questions all discuss the same regions. Display order only — the analysis
  // below still sees the run's own ordering.
  const orderedRules = useMemo(
    () => orderRulesForDisplay(rules, engine?.document?.tables ?? []),
    [rules, engine],
  );
  const orderedTables = useMemo(
    () => orderTablesForDisplay(engine?.document?.tables ?? []),
    [engine],
  );
  // The demo answers need the workbook preview as well as the run: provenance points at a sheet and a
  // row, and the preview is what holds the actual cells to show back.
  const askQuestions = useMemo(
    () =>
      demoQuestions({
        rules,
        tables: engine?.document?.tables ?? [],
        sheets: preview?.sheets ?? [],
        verification: verificationSummary(rules),
      }),
    [rules, engine, preview],
  );
  const analysis = useMemo(
    () => analyseRules(rules, reconciliation.aliases),
    [rules, reconciliation],
  );

  return (
    <div className="fl-root gt-root">
      <SiteHeader current="try" />

      <main className="gt-main">
        <header className="gt-hero">
          <div className="fl-eyebrow">Live demo</div>
          <h1 className="fl-serif gt-h1">
            See a commission grid become <span className="fl-ital">structured rules</span>
          </h1>
          <p className="fl-muted gt-lede">
            Pick one of our commission grids. FinLead reads the sheet, works out what each column
            means, and turns it into machine-readable payout rules — the same pipeline that runs in
            production, not a simulation.
          </p>
        </header>

        {bootError && (
          <div className="gt-alert">
            The extraction service is not reachable right now. {bootError}
          </div>
        )}

        {/* 1 — choose */}
        <section className="gt-step">
          <div className="gt-step-head">
            <span className="gt-step-num">1</span>
            <h2 className="gt-h2">Choose a grid</h2>
          </div>
          <div className="gt-samples">
            {samples.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`fl-card gt-sample ${selected?.id === s.id ? "is-active" : ""}`}
                onClick={() => choose(s)}
              >
                <h3 className="gt-sample-title">{s.label}</h3>
                <p className="fl-muted gt-sample-meta">
                  {s.sheetCount} sheet{s.sheetCount === 1 ? "" : "s"} · {s.cellCount.toLocaleString()} cells
                </p>
                <p className="fl-muted gt-sample-desc">{s.description}</p>
                <span className="fl-chip gt-chip">
                  {s.hasReference ? "Includes a reference sheet" : "Column meaning is inferred"}
                </span>
              </button>
            ))}
            {!samples.length && !bootError && <p className="fl-muted">Loading grids…</p>}
          </div>
        </section>

        {/* 2 — the workbook */}
        {selected && (
          <section className="gt-step">
            <div className="gt-step-head">
              <span className="gt-step-num">2</span>
              <h2 className="gt-h2">The grid we will read</h2>
              <span className="fl-muted gt-hint">straight from the workbook, no model involved</span>
            </div>
            {!preview && !runError && <p className="fl-muted">Reading the workbook…</p>}
            {preview && (
              <>
                <div className="gt-tabs">
                  {preview.sheets.map((s, i) => (
                    <button
                      key={s.name}
                      type="button"
                      className={`gt-tab ${sheetTab === i ? "is-active" : ""}`}
                      onClick={() => setSheetTab(i)}
                    >
                      {s.name}
                      {s.isReference ? " · reference" : ""}
                    </button>
                  ))}
                </div>
                {sheet?.isReference && preview.referenceSheet && (
                  <p className="fl-muted gt-note">
                    Reference mapping: <strong>{preview.referenceSheet.keyColumn}</strong> →{" "}
                    <strong>{preview.referenceSheet.valueColumn}</strong>, used to expand multi-city
                    cells into geography clusters.
                  </p>
                )}
                {/* Spreadsheet view: real worksheet row numbers in the gutter and A..n column
                    headers, so what is on screen lines up cell-for-cell with the source file. */}
                <div className="gt-scroll gt-sheet-wrap">
                  <table className="gt-sheet">
                    <thead>
                      <tr>
                        <th className="gt-sheet-corner" />
                        {Array.from({ length: sheet?.columnCount || 0 }).map((_, c) => (
                          <th key={c} className="gt-sheet-colhead">
                            {columnLabel(c)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sheet?.rows.map((row) => (
                        <tr key={row.number}>
                          <th className="gt-sheet-rowhead">{row.number}</th>
                          {Array.from({ length: sheet.columnCount }).map((_, c) => {
                            const value = row.cells[c] ?? "";
                            return (
                              <td
                                key={c}
                                className={isNumericish(value) ? "gt-sheet-cell is-num" : "gt-sheet-cell"}
                                title={value || undefined}
                              >
                                {value}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="fl-muted gt-foot">
                  {sheet?.name} · {sheet?.totalRows} rows
                  {sheet?.truncated ? ` — showing the first ${sheet.rows.length}` : ""}
                  {sheet?.merges?.length ? ` · ${sheet.merges.length} merged cell ranges` : ""}
                </p>
              </>
            )}
          </section>
        )}

        {/* 3 — run */}
        {selected && preview && (
          <section className="gt-step">
            <div className="gt-step-head">
              <span className="gt-step-num">3</span>
              <h2 className="gt-h2">Extract the rules</h2>
            </div>
            <button
              type="button"
              className="fl-btn fl-btn-primary"
              onClick={start}
              disabled={running}
            >
              {running ? "Reading the grid…" : "Extract rules"}
            </button>

            {runError && <div className="gt-alert">{runError}</div>}

            {run?.progressLog?.length > 0 && (
              <ProgressTrack
                lines={run.progressLog.slice(0, shownLines)}
                rules={rules}
                rawLines={run.progressLog.slice(0, shownLines)}
              />
            )}

            {engine && (
              <>
                <div className="gt-timings">
                  {[
                    ["Read sheet", timings.preprocessMs],
                    ["Classify layout", timings.classifyMs],
                    ["Map columns", timings.resolveMs],
                    ["Extract rules", timings.extractMs],
                  ]
                    .filter(([, v]) => v != null)
                    .map(([k, v]) => (
                      <span key={k}>
                        {k} <strong>{(v / 1000).toFixed(1)}s</strong>
                      </span>
                    ))}
                </div>
                <p className="fl-muted gt-foot">
                  Stage times above are what this extraction actually took
                  {cacheInfo?.extractedAt && cacheInfo.extractedAt !== "null"
                    ? ` when it ran on ${new Date(cacheInfo.extractedAt).toLocaleDateString()}`
                    : ""}
                  . Results are served from that run, so the grids below stay instant however many
                  people are looking.
                </p>
              </>
            )}
          </section>
        )}

        {/* 4 — results */}
        {engine && (
          <section className="gt-step">
            <div className="gt-step-head">
              <span className="gt-step-num">4</span>
              <h2 className="gt-h2">What FinLead found</h2>
              <span className="fl-muted gt-hint">
                {rules.length.toLocaleString()} payout rules · {mappings.length} columns understood
              </span>
            </div>
            <RunHealth rules={rules} />

            <div className="gt-tabs">
              <button
                type="button"
                className={`gt-tab ${view === "rules" ? "is-active" : ""}`}
                onClick={() => setView("rules")}
              >
                Payout rules
              </button>
              <button
                type="button"
                className={`gt-tab ${view === "mapping" ? "is-active" : ""}`}
                onClick={() => setView("mapping")}
              >
                How the columns were read
              </button>
              <button
                type="button"
                className={`gt-tab ${view === "sheets" ? "is-active" : ""}`}
                onClick={() => setView("sheets")}
              >
                Grids found
              </button>
            </div>

            {view === "rules" ? (
              <RuleTable rules={orderedRules} fields={analysis.fields} aliases={reconciliation.aliases} />
            ) : view === "sheets" ? (
              <SheetInventory tables={orderedTables} />
            ) : (
              <>
                <p className="fl-muted gt-note">
                  {["MATCHED", "INFERRED", "NEW"].map((s) => (
                    <span key={s} className="gt-legend">
                      <span className={`gt-tone ${statusTone(s)}`}>{s}</span> {counts[s] || 0}
                    </span>
                  ))}
                </p>
                <div className="gt-scroll">
                  <table className="gt-table">
                    <thead>
                      <tr>
                        <th>Column</th>
                        <th>Status</th>
                        <th>Mapped to</th>
                        <th>Confidence</th>
                        <th>Why</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mappings.map((m, i) => (
                        <tr key={i}>
                          <td>
                            <strong>{m.token}</strong>
                          </td>
                          <td>
                            <span className={`gt-tone ${statusTone(m.status)}`}>{m.status}</span>
                          </td>
                          <td>{m.mappedKey ?? "—"}</td>
                          <td>{Math.round((m.confidence || 0) * 100)}%</td>
                          <td className="fl-muted">{m.reasoning}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <AskPanel
              questions={askQuestions}
              ruleCount={rules.length}
              sheetCount={preview?.sheets?.length ?? 0}
            />

            <div className="gt-cta">
              <a className="fl-btn fl-btn-primary" href="mailto:surya@finleadai.com?subject=Grid%20extraction%20demo">
                Talk to us about your own grids
              </a>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
