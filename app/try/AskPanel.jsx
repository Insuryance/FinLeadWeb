// A scripted conversation over the extracted book.
//
// Deliberately NOT a real chat: the input is inert and the questions are fixed. That is a product
// decision, not a shortcut — a live text box on a public page is an open prompt against the model,
// with the spend and abuse surface that implies. The panel says so rather than pretending the box is
// broken.
//
// Everything shown comes from askDemo.mjs, which derives it from the run. The only thing this file
// invents is the pacing.

import { useState } from "react";
import { columnLetter } from "./askDemo.mjs";
import { fieldLabel } from "./pivot.mjs";

const THINKING_MS = 620;
// Long spreadsheet headers ("20 to 40 upto 90% disc w/o Nil dep (TATA & AL Only)") destroy the column
// rhythm. Trimmed for display with the full text kept on the title attribute.
const HEADER_MAX = 22;

function short(text, limit = HEADER_MAX) {
  const value = String(text ?? "");
  return value.length > limit ? `${value.slice(0, limit - 1)}…` : value;
}

export default function AskPanel({ questions, ruleCount, sheetCount }) {
  const [asked, setAsked] = useState([]);
  const [thinking, setThinking] = useState(null);

  if (!questions?.length) return null;

  const ask = (question) => {
    if (thinking || asked.some((entry) => entry.id === question.id)) return;
    setThinking(question.id);
    setTimeout(() => {
      setAsked((previous) => [...previous, question]);
      setThinking(null);
    }, THINKING_MS);
  };

  const remaining = questions.filter(
    (question) => !asked.some((entry) => entry.id === question.id) && question.id !== thinking,
  );
  const pending = questions.find((question) => question.id === thinking);

  return (
    <section className="gt-ask">
      <header className="gt-ask-head">
        <span className="gt-ask-mark" aria-hidden="true" />
        <span className="gt-ask-title">Ask the book</span>
        <span className="gt-ask-tag">guided demo</span>
      </header>

      <div className="gt-ask-log">
        <Turn>
          <p className="gt-ask-open">
            I have <strong>{ruleCount.toLocaleString()}</strong> payout rules from{" "}
            <strong>{sheetCount}</strong> sheets in front of me — each one still linked to the cell it
            came from.
          </p>
        </Turn>

        {asked.map((question) => (
          <div className="gt-ask-pair" key={question.id}>
            <Said question={question} />
            <Turn>
              <Answer question={question} />
            </Turn>
          </div>
        ))}

        {pending && (
          <div className="gt-ask-pair">
            <Said question={pending} />
            <Turn>
              <span className="gt-ask-dots" aria-label="working">
                <i />
                <i />
                <i />
              </span>
            </Turn>
          </div>
        )}
      </div>

      {remaining.length > 0 && (
        <div className="gt-ask-chips">
          {remaining.map((question) => (
            <button
              key={question.id}
              type="button"
              className="gt-chip"
              onClick={() => ask(question)}
              disabled={Boolean(thinking)}
              title={question.question}
            >
              {question.label ?? question.question}
            </button>
          ))}
        </div>
      )}

      <div className="gt-ask-composer" aria-hidden="true">
        <span className="gt-ask-composer-text">
          Ask anything of your own book — inside the product
        </span>
        <span className="gt-ask-send" />
      </div>
    </section>
  );
}

function Turn({ children }) {
  return (
    <div className="gt-ask-bot">
      <span className="gt-ask-avatar" aria-hidden="true">
        <span />
      </span>
      <div className="gt-ask-bubble">{children}</div>
    </div>
  );
}

function Said({ question }) {
  return (
    <div className="gt-ask-user">
      <span>{question.question}</span>
    </div>
  );
}

// Exported for the render checks. The panel reveals answers through click state, which server
// rendering never reaches, so without this the answer renderers — the charts and the provenance
// excerpt, the most complex markup here — would ship having never been executed once.
export function Answer({ question }) {
  const { kind, answer } = question;
  if (kind === "provenance") return <Provenance answer={answer} />;
  if (kind === "footnote") return <Footnote answer={answer} />;
  if (kind === "table") return <TopPayouts answer={answer} />;
  if (kind === "chart") return <Chart answer={answer} />;
  if (kind === "drivers") return <Drivers answer={answer} />;
  return null;
}

/**
 * The provenance answer, and the reason the panel exists: an extracted number shown back in the
 * worksheet it was read from, at a reference the viewer can open in Excel and check.
 *
 * Rendered to look like a spreadsheet — column letters along the top, the row number in a gutter —
 * because the claim being made is "this is a real cell", and it lands harder when it looks like one.
 */
function Provenance({ answer }) {
  const { at } = answer;
  // Two label columns plus the column that was hit. Everything between is elided: a 14-column row
  // rendered whole is unreadable at this size and buries the point.
  const shown = [...new Set([0, 1, at.columnIndex].filter((index) => index !== null))].sort(
    (a, b) => a - b,
  );
  const elided = at.columnIndex > 2;

  return (
    <>
      <p>
        Sheet <strong>{at.sheetName}</strong>, cell <strong>{at.reference}</strong> — the{" "}
        <em>{at.columnHeader}</em> column on the <em>{at.rowLabel}</em> row.
      </p>

      <div className="gt-sheetlet">
        <table>
          <thead>
            <tr>
              <th className="gt-sheetlet-gutter" />
              {shown.map((index, position) => (
                <th key={index} className={index === at.columnIndex ? "is-hit" : ""}>
                  {position === 2 && elided && <span className="gt-sheetlet-gap">…</span>}
                  {columnLetter(index)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="gt-sheetlet-headrow">
              <td className="gt-sheetlet-gutter" />
              {shown.map((index) => (
                <td key={index} title={String(at.headers[index] ?? "")}>
                  {short(at.headers[index])}
                </td>
              ))}
            </tr>
            <tr>
              <td className="gt-sheetlet-gutter">{at.rowNumber}</td>
              {shown.map((index) => (
                <td
                  key={index}
                  className={index === at.columnIndex ? "gt-sheetlet-hit" : ""}
                  title={String(at.cells[index] ?? "")}
                >
                  {short(at.cells[index], 18)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <p className="fl-muted gt-ask-note">
        Every rule keeps this link, so any payout can be traced back to the cell that set it — and
        re-checked when the insurer reissues the book.
      </p>
    </>
  );
}

function Footnote({ answer }) {
  return (
    <>
      <p>
        Those cells carry no number at all. {answer.ruleCount.toLocaleString()} rules resolve to the
        regulator&rsquo;s schedule instead:
      </p>
      <div className="gt-ask-split">
        {answer.components.map((component) => (
          <div className="gt-ask-part" key={component.label}>
            <span className="gt-ask-part-value">{component.percentage}%</span>
            <span className="fl-muted gt-ask-part-of">of {component.label}</span>
          </div>
        ))}
      </div>
      {answer.separateBases && (
        <p className="fl-muted gt-ask-note">
          These sit on different premium bases, so they are never added into one rate — a detail a
          spreadsheet formula usually gets wrong.
        </p>
      )}
    </>
  );
}

function TopPayouts({ answer }) {
  return (
    <>
      <p>The highest rates in the book:</p>
      <ul className="gt-ask-rows">
        {answer.rows.map((row, index) => (
          <li key={`${row.sheet}-${row.label}-${index}`}>
            <span className="gt-ask-rate">{row.payout}%</span>
            <span className="gt-ask-where">
              {row.label}
              {row.column && <span className="fl-muted"> · {short(row.column, 30)}</span>}
            </span>
            <span className="fl-muted gt-ask-ref">
              {row.sheet}
              {row.reference && ` ${row.reference}`}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

function Chart({ answer }) {
  if (answer.chartType === "comparison_bar") return <ComparisonBar answer={answer} />;
  return null;
}

/** Two sheets set against each other band by band, with the gap labelled. */
function ComparisonBar({ answer }) {
  const { categories, data, note } = answer;
  const [left, right] = categories;
  const peak = Math.max(...data.flatMap((row) => [Number(row[left]) || 0, Number(row[right]) || 0]), 1);

  return (
    <>
      <p className="gt-chart-title">{answer.title}</p>
      <div className="gt-chart">
        <div className="gt-chart-legend">
          <span>
            <i style={{ background: "#d9c9a3" }} />
            {left}
          </span>
          <span>
            <i style={{ background: "rgba(217,201,163,.38)" }} />
            {right}
          </span>
        </div>
        <ul className="gt-chart-pairs">
          {data.map((row) => {
            const leftValue = Number(row[left]) || 0;
            const rightValue = Number(row[right]) || 0;
            return (
              <li key={row.period}>
                <span className="gt-chart-band" title={row.period}>
                  {short(row.period, 30)}
                </span>
                <span className="gt-chart-pair">
                  <span className="gt-chart-track">
                    <i style={{ width: `${(leftValue / peak) * 100}%`, background: "#d9c9a3" }} />
                    <b>{leftValue}%</b>
                  </span>
                  <span className="gt-chart-track">
                    <i
                      style={{
                        width: `${(rightValue / peak) * 100}%`,
                        background: "rgba(217,201,163,.38)",
                      }}
                    />
                    <b>{rightValue}%</b>
                  </span>
                </span>
                <span
                  className={`gt-chart-delta ${row.delta === 0 ? "is-flat" : row.delta > 0 ? "is-up" : "is-down"}`}
                >
                  {row.delta === 0 ? "same" : `${row.delta > 0 ? "+" : ""}${row.delta}`}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      {note?.widest && note.widest.delta !== 0 && (
        <p className="fl-muted gt-ask-note">
          The widest gap is {Math.abs(note.widest.delta)} points on{" "}
          <em>{short(note.widest.period, 42)}</em> — the same vehicle earns{" "}
          {note.widest.delta > 0 ? note.left : note.right} materially more. Two tabs
          apart in the workbook, so nobody spots it by reading.
        </p>
      )}
    </>
  );
}

function Drivers({ answer }) {
  const { verification } = answer;
  const peak = Math.max(...answer.fields.map((field) => field.count), 1);
  return (
    <>
      <p>Six things decide the rate. This is how often each is used:</p>
      <ul className="gt-ask-rank">
        {answer.fields.map((field) => (
          <li key={field.field}>
            <span className="gt-ask-where">{fieldLabel(field.field)}</span>
            <span className="gt-ask-bar">
              <i style={{ width: `${Math.max(3, Math.round((field.count / peak) * 100))}%` }} />
            </span>
            <span className="fl-muted gt-ask-count">{field.count.toLocaleString()}</span>
          </li>
        ))}
      </ul>
      {verification && verification.checked > 0 && (
        <p className="fl-muted gt-ask-note">
          {verification.contradictions === 0 ? (
            <>
              All {verification.checked.toLocaleString()} rules were checked for conflicts and none
              contradict each other — a book this size almost always hides a few.
            </>
          ) : (
            <>
              {verification.contradictions} of {verification.checked.toLocaleString()} rules can never
              apply, because their own conditions rule each other out.
            </>
          )}
        </p>
      )}
    </>
  );
}
