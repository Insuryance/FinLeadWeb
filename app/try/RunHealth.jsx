// What the run says about the rules it produced, written for someone who does not build extraction
// pipelines.
//
// Every figure comes from data the pipeline produces — the per-rule solver verdicts on rule.ast —
// never from a claim made here. Solver names, chunk indexes and source row numbers stay out; they
// remain in the API response for anyone who needs them.

import { verificationSummary } from "./pivot.mjs";

export default function RunHealth({ rules }) {
  const verification = verificationSummary(rules);
  if (verification.checked === 0) return null;

  // A clean bill of health needs more than "the solver said yes". A rule with no conditions is
  // consistent and useless, and a rule nobody could check is not evidence of anything.
  const clean =
    verification.contradictions === 0 &&
    verification.unconstrained === 0 &&
    verification.unverifiable === 0;

  return (
    <div className="gt-health">
      <p className="gt-health-line">
        <span className={`gt-tone ${clean ? "gt-tone-ok" : "gt-tone-warn"}`}>
          {clean ? "VERIFIED" : "QUALIFIED"}
        </span>{" "}
        <span className="fl-muted">
          {clean ? (
            <>
              All {verification.total.toLocaleString()} rules were checked automatically — none
              contradict themselves, and none are so broad they would match any policy
            </>
          ) : (
            <>
              {verification.checked.toLocaleString()} of {verification.total.toLocaleString()} rules
              checked
              {verification.contradictions > 0 && (
                <>
                  {" · "}
                  <strong>{verification.contradictions}</strong> can never apply, because their
                  conditions rule each other out
                </>
              )}
              {verification.unconstrained > 0 && (
                <>
                  {" · "}
                  <strong>{verification.unconstrained}</strong> carry no conditions, so they would
                  match any policy
                </>
              )}
              {verification.unverifiable > 0 && (
                <> · {verification.unverifiable.toLocaleString()} could not be checked</>
              )}
            </>
          )}
        </span>
      </p>
    </div>
  );
}
