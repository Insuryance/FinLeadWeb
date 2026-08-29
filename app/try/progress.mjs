// Turns the pipeline's own progress log into a stage checklist a non-engineer can read.
//
// The log is written for whoever is debugging the pipeline:
//
//   POI_ONLY · Stage 1.5 classified in 8s — 1 rule grids, 0 reference
//   POI_ONLY · Stage 3: 1/2 chunks · 105 rules so far
//
// Accurate, and the wrong thing to put in front of someone evaluating the product. This maps those
// lines onto five named stages, each carrying the real figure the line reported — so the display is
// friendlier wording over the same evidence, never invented progress. A stage only completes when a
// line says it did; nothing is animated on a timer.
//
// Deliberately omitted: the `coverage` percentage from the Stage 3 line. Its denominator is keyed by
// sheet name inconsistently and reports values above 100%, so showing it would mislead.

const STAGE_DEFINITIONS = [
  {
    key: "read",
    label: "Reading the workbook",
    startsWith: /Stage 1 preprocess/,
    completesWith: /Stage 1 done/,
    timed: true,
    detail: (line) => {
      const match = line.match(/—\s*(\d+)\s*tables?(?:,\s*(\d+)\s*footnote)?/);
      if (!match) return null;
      const tables = `${match[1]} table${match[1] === "1" ? "" : "s"}`;
      return match[2] && match[2] !== "0" ? `${tables}, ${match[2]} footnotes` : tables;
    },
  },
  {
    key: "layout",
    label: "Understanding the layout",
    startsWith: /Stage 1 done/,
    completesWith: /Stage 1\.5 classified/,
    timed: true,
    detail: (line) => {
      const match = line.match(/(\d+)\s*rule grids?,\s*(\d+)\s*reference/);
      if (!match) return null;
      const grids = `${match[1]} rule grid${match[1] === "1" ? "" : "s"}`;
      return match[2] === "0" ? grids : `${grids}, ${match[2]} reference`;
    },
  },
  {
    key: "semantics",
    label: "Working out what each column means",
    startsWith: /Stage 2 resolving/,
    completesWith: /Stage 2 resolved/,
    timed: true,
    detail: (line) => {
      const match = line.match(/resolved\s*(\d+)\s*variables?/);
      return match ? `${match[1]} columns mapped` : null;
    },
  },
  {
    key: "extract",
    label: "Extracting the payout rules",
    startsWith: /Stage 3 extracting/,
    completesWith: /Stage 3 done/,
    timed: true,
    // Only this stage reports intermediate progress, and only because the log does.
    progress: (line) => {
      const match = line.match(/Stage 3:\s*(\d+)\/(\d+)\s*chunks?\s*·\s*(\d+)\s*rules/);
      if (!match) return null;
      const [done, total, rules] = [Number(match[1]), Number(match[2]), Number(match[3])];
      return {
        fraction: done / total,
        detail: `${rules.toLocaleString()} rules from ${done} of ${total} sections`,
        metrics: { chunksDone: done, chunksTotal: total, rules },
      };
    },
    // The section count is announced before any chunk finishes, so the segmented bar can be drawn
    // at its true width from the start rather than growing as results arrive.
    announces: (line) => {
      const match = line.match(/Stage 3:\s*(\d+)\s*chunks across/);
      return match ? { chunksDone: 0, chunksTotal: Number(match[1]), rules: 0 } : null;
    },
    detail: (line) => {
      const match = line.match(/—\s*(\d+)\s*rules/);
      return match ? `${Number(match[1]).toLocaleString()} rules extracted` : null;
    },
    metricsOnDone: (line) => {
      const match = line.match(/—\s*(\d+)\s*rules/);
      return match ? { rules: Number(match[1]) } : null;
    },
  },
  {
    key: "verify",
    label: "Checking every rule can fire",
    startsWith: /Stage 3 done/,
    completesWith: /^Done in|Done in \d/,
  },
];

/** The pipeline's own closing wall-clock, which is a different figure from any single stage. */
function totalDuration(messages) {
  const closing = messages.find((message) => /^Done in\s/.test(message));
  return closing ? parseDuration(closing) : null;
}

/** "660ms", "16s", "1m48s", "38m12s" -> seconds. Used for the per-stage timing badge. */
function parseDuration(line) {
  const match = line.match(/\bin\s+(?:(\d+)m)?(\d+(?:\.\d+)?)(ms|s)\b/);
  if (!match) return null;
  const minutes = match[1] ? Number(match[1]) : 0;
  const value = Number(match[2]);
  return minutes * 60 + (match[3] === "ms" ? value / 1000 : value);
}

/** Compact and honest: sub-second work says so rather than rounding up to a whole second. */
export function formatDuration(seconds) {
  if (seconds == null) return null;
  if (seconds < 1) return `${Math.round(seconds * 1000)}ms`;
  if (seconds < 60) return `${seconds < 10 ? seconds.toFixed(1) : Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m${String(Math.round(seconds - minutes * 60)).padStart(2, "0")}s`;
}

/**
 * @param lines progress log entries, each "<iso timestamp>  <message>"
 * @param rules the extracted rules, used only to describe the verification stage from its verdicts
 * @returns {{stages: Array, fraction: number, complete: boolean}}
 */
export function progressStages(lines = [], rules = []) {
  const messages = lines.map(messageOf);
  const stages = STAGE_DEFINITIONS.map((definition) => resolveStage(definition, messages));
  applyVerificationDetail(stages, rules);

  const activeIndex = stages.findIndex((stage) => stage.status === "active");
  const doneCount = stages.filter((stage) => stage.status === "done").length;
  const partial = activeIndex >= 0 ? stages[activeIndex].fraction ?? 0 : 0;
  const extraction = stages.find((stage) => stage.key === "extract");

  return {
    stages,
    fraction: Math.min(1, (doneCount + partial) / stages.length),
    complete: doneCount === stages.length,
    // Headline figures for the counters, taken straight from the log's own tallies.
    metrics: extraction?.metrics ?? null,
    // Wall-clock for the whole pipeline, from the closing line.
    totalSeconds: totalDuration(messages),
  };
}

/** Strips the leading ISO timestamp and the engine prefix, which carry no meaning for a reader. */
function messageOf(line) {
  const split = String(line).indexOf("  ");
  const message = split > 0 ? String(line).slice(split + 2) : String(line);
  return message.replace(/^[A-Z_]+\s*·\s*/, "");
}

function resolveStage(definition, messages) {
  const stage = {
    key: definition.key,
    label: definition.label,
    status: "pending",
    detail: null,
    seconds: null,
    metrics: null,
  };

  // The announced section count survives into the completed state so the segmented bar keeps its
  // width instead of collapsing when the stage finishes.
  if (definition.announces) {
    for (const message of messages) {
      const announced = definition.announces(message);
      if (announced) {
        stage.metrics = announced;
        break;
      }
    }
  }

  const completion = messages.find((message) => definition.completesWith.test(message));
  if (completion) {
    stage.status = "done";
    stage.detail = definition.detail ? definition.detail(completion) : null;
    // Only when the line states this stage's own duration. The final "Done in 472.1s" is the whole
    // pipeline, and attributing it to the last stage would claim verification took eight minutes.
    stage.seconds = definition.timed ? parseDuration(completion) : null;
    if (definition.metricsOnDone) {
      const done = definition.metricsOnDone(completion);
      if (done) {
        stage.metrics = { ...(stage.metrics ?? {}), ...done };
        if (stage.metrics.chunksTotal) stage.metrics.chunksDone = stage.metrics.chunksTotal;
      }
    }
    return stage;
  }

  const started = messages.some((message) => definition.startsWith.test(message));
  if (!started) return stage;

  stage.status = "active";
  if (definition.progress) {
    // Take the LAST progress line, not the first: the log appends as chunks land.
    for (const message of [...messages].reverse()) {
      const progress = definition.progress(message);
      if (progress) {
        stage.fraction = progress.fraction;
        stage.detail = progress.detail;
        stage.metrics = { ...(stage.metrics ?? {}), ...progress.metrics };
        break;
      }
    }
  }
  return stage;
}

/**
 * Describes verification from the rules' own verdicts rather than from a log line.
 *
 * A verdict of `unavailable` means this environment had no solver, so nothing was checked. Reporting
 * that as "0 of 4705 can fire" would be the worst possible reading of a clean corpus, so the two are
 * kept apart.
 */
function applyVerificationDetail(stages, rules) {
  const stage = stages.find((entry) => entry.key === "verify");
  if (!stage || stage.status !== "done") return;
  const verdicts = rules.map((rule) => rule.ast?.z3Verdict).filter(Boolean);
  if (verdicts.length === 0) {
    stage.detail = null;
    return;
  }
  const checkable = verdicts.filter((verdict) => verdict !== "unavailable");
  if (checkable.length === 0) {
    stage.detail = "solver unavailable here";
    return;
  }
  const satisfiable = checkable.filter((verdict) => verdict === "satisfiable").length;
  const suffix = checkable.length < verdicts.length
    ? ` (${verdicts.length - checkable.length} not checked)`
    : "";
  stage.detail = `${satisfiable} of ${checkable.length} can fire${suffix}`;
}
