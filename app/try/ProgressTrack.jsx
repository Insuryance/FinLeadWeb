// Pipeline progress, presented for someone judging the product rather than debugging it.
//
// Three things carry the weight, and all three are read from the pipeline's own log:
//   * a rule counter that climbs as chunks land
//   * a segmented bar, one segment per section of the workbook, lighting up as each completes
//   * a per-stage elapsed time, so the effort is legible
//
// Nothing advances on a timer. A stage ticks because a log line said it finished, a segment lights
// because the log reported that chunk, and the counter only ever shows a number the log printed. The
// count-up animation interpolates between two real values; it never runs ahead of the latest one.

import { useEffect, useRef, useState } from "react";
import { formatDuration, progressStages } from "./progress.mjs";

/** Eases toward a target so the figure reads as climbing rather than jumping between poll results. */
function useCountUp(target, durationMs = 900) {
  const [value, setValue] = useState(target ?? 0);
  const fromRef = useRef(target ?? 0);
  const frameRef = useRef(0);

  useEffect(() => {
    if (target == null) return undefined;
    const from = fromRef.current;
    if (from === target) return undefined;
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min(1, (now - start) / durationMs);
      // easeOutCubic: fast to begin, settling onto the real figure.
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
      else fromRef.current = target;
    };

    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, durationMs]);

  return value;
}

function Tick() {
  return (
    <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">
      <path
        d="M2.5 8.5l3.2 3.2L13.5 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StageIcon({ status }) {
  if (status === "done") {
    return (
      <span className="gt-step-icon is-done">
        <Tick />
      </span>
    );
  }
  return <span className={`gt-step-icon${status === "active" ? " is-active" : ""}`} aria-hidden="true" />;
}

/** One segment per section of the workbook. Caps the segment count so 400 sections stay legible. */
function SectionBar({ done, total }) {
  if (!total) return null;
  const segments = Math.min(total, 60);
  const filled = Math.round((done / total) * segments);
  return (
    <div className="gt-segbar" aria-hidden="true">
      {Array.from({ length: segments }).map((_, index) => (
        <span
          key={index}
          className={`gt-seg${index < filled ? " is-on" : ""}${index === filled ? " is-next" : ""}`}
        />
      ))}
    </div>
  );
}

export default function ProgressTrack({ lines, rules, rawLines }) {
  const { stages, fraction, complete, metrics, totalSeconds } = progressStages(lines, rules);
  const ruleCount = useCountUp(metrics?.rules ?? 0);
  const percent = Math.round(fraction * 100);

  return (
    <div className={`gt-track${complete ? " is-complete" : ""}`}>
      <div className="gt-track-head">
        <div className="gt-track-count">
          <span className="gt-count-value">{ruleCount.toLocaleString()}</span>
          <span className="gt-count-label fl-muted">
            {complete ? "payout rules extracted" : "payout rules so far"}
          </span>
        </div>
        <div className="gt-track-pct" aria-hidden="true">
          {complete && totalSeconds != null ? formatDuration(totalSeconds) : `${percent}%`}
        </div>
      </div>

      <div
        className="gt-track-bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <span className="gt-track-fill" style={{ width: `${percent}%` }} />
      </div>

      <ol className="gt-steps">
        {stages.map((stage) => (
          <li key={stage.key} className={`gt-step-row is-${stage.status}`}>
            <StageIcon status={stage.status} />
            <span className="gt-step-label">{stage.label}</span>
            {stage.detail && <span className="gt-step-detail fl-muted">{stage.detail}</span>}
            {stage.seconds != null && (
              <span className="gt-step-time fl-muted">{formatDuration(stage.seconds)}</span>
            )}
            {stage.status === "active" && stage.metrics?.chunksTotal > 1 && (
              <SectionBar done={stage.metrics.chunksDone ?? 0} total={stage.metrics.chunksTotal} />
            )}
          </li>
        ))}
      </ol>

      {rawLines?.length > 0 && (
        <details className="gt-track-raw">
          <summary className="fl-muted">
            {complete ? "Technical log" : "Technical log (live)"}
          </summary>
          <div className="gt-feed">
            {rawLines.map((line, index) => {
              const split = line.indexOf("  ");
              const stamp = split > 0 ? line.slice(0, split) : "";
              const text = split > 0 ? line.slice(split + 2) : line;
              return (
                <div key={index}>
                  <span className="gt-feed-ts">
                    {stamp ? new Date(stamp).toLocaleTimeString() : ""}
                  </span>{" "}
                  {text}
                </div>
              );
            })}
          </div>
        </details>
      )}
    </div>
  );
}
