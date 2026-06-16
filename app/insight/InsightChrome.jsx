"use client";
import React, { useState, useEffect, useRef } from "react";

/* Reuses an existing FinLead Formspree inbox so it works immediately.
   Swap for a dedicated form id any time. */
const SUGGEST_ENDPOINT = "https://formspree.io/f/xkoedvda";

const TICKER = [
  "A FinLead AI agent just collated a full underwriting dataset for an actuary.",
  "A FinLead AI agent onboarded an offline broker agent in under two minutes.",
  "A FinLead AI agent cleaned datasets from 250 excel files within 3 minutes.",
  "A FinLead AI agent replaced 55 Full Time Employees for an Insurance company.",
  "A FinLead AI agent flagged leakages in commission payouts.",
  "A FinLead AI agent reconciled a broker payout to the nearest rupee, accurately.",
  "A FinLead AI agent published this month's GIC segment data automatically.",
  "A FinLead AI agent matched four thousand commission entries with no human touch.",
  "A FinLead AI agent flagged a payout discrepancy before it went out.",
];
const FIRST_MS = 5000;   // first card appears after 5s
const ROTATE_MS = 20000; // then a new card every 20s
const VISIBLE_MS = 7000; // each card stays 7s

export default function InsightChrome() {
  return (
    <>
      <SuggestFeature />
      <AgentTicker />
    </>
  );
}

function SuggestFeature() {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | done | error

  const send = async () => {
    if (!msg.trim()) return;
    setStatus("sending");
    try {
      const res = await fetch(SUGGEST_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ message: msg, email, topic: "Insight feature suggestion" }),
      });
      if (res.ok) { setStatus("done"); setMsg(""); setEmail(""); }
      else setStatus("error");
    } catch (e) { setStatus("error"); }
  };

  return (
    <div style={{ marginTop: 22 }}>
      <button className="fl-btn fl-btn-ghost" style={{ borderColor: "var(--gold-deep)", color: "var(--gold)" }}
        onClick={() => setOpen((o) => !o)}>
        Suggest a feature for our agents
      </button>

      {open && (
        <div className="fl-glass" style={{ padding: "20px 20px 22px", marginTop: 16, maxWidth: 560 }}>
          {status === "done" ? (
            <div style={{ color: "var(--ivory)", fontSize: 14.5 }}>
              Noted, thank you. The team reviews every suggestion.
              <button className="fl-btn fl-btn-ghost" style={{ marginLeft: 14, padding: "8px 16px", fontSize: 13 }}
                onClick={() => setStatus("idle")}>Add another</button>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--muted2)", marginBottom: 12 }}>
                What should our AI agents do next?
              </div>
              <textarea className="fl-input" value={msg} onChange={(e) => setMsg(e.target.value)} rows={3}
                placeholder="e.g. add a segment-wise loss-ratio view, or export to Excel"
                style={{ width: "100%", padding: "12px 14px", fontSize: 14, resize: "vertical", marginBottom: 12 }} />
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <input className="fl-input" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email (optional, if you want a reply)" type="email"
                  style={{ flex: "1 1 220px", padding: "11px 14px", fontSize: 13.5 }} />
                <button className="fl-btn fl-btn-shine" style={{ padding: "12px 24px" }}
                  onClick={send} disabled={status === "sending"}>
                  {status === "sending" ? "Sending\u2026" : "Send suggestion"}
                </button>
              </div>
              {status === "error" && <div style={{ color: "#D69A9A", fontSize: 12.5, marginTop: 10 }}>Could not send just now. Please try again.</div>}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function AgentTicker() {
  const [idx, setIdx] = useState(0);
  const [show, setShow] = useState(false);
  const iRef = useRef(0);

  useEffect(() => {
    let hideT, intv;
    const cycle = () => {
      setIdx(iRef.current);
      setShow(true);
      hideT = setTimeout(() => setShow(false), VISIBLE_MS);
      iRef.current = (iRef.current + 1) % TICKER.length;
    };
    const firstT = setTimeout(() => { cycle(); intv = setInterval(cycle, ROTATE_MS); }, FIRST_MS);
    return () => { clearTimeout(firstT); clearTimeout(hideT); clearInterval(intv); };
  }, []);

  return (
    <div style={{ position: "fixed", top: 90, right: 14, maxWidth: "min(330px, 86vw)", zIndex: 45, pointerEvents: "none" }}>
      <div style={{
        display: "flex", gap: 11, alignItems: "flex-start", padding: "12px 15px", borderRadius: 13,
        background: "rgba(13,13,17,.82)", border: "1px solid var(--line)",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 18px 50px rgba(0,0,0,.5)",
        opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(-8px)",
        transition: "opacity .5s var(--ease), transform .5s var(--ease)",
      }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--gold)", marginTop: 5, flex: "none", boxShadow: "0 0 10px rgba(217,201,163,.85)" }} />
        <div>
          <div style={{ fontSize: 9.5, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--gold-deep)", marginBottom: 3 }}>Agent activity</div>
          <div style={{ fontSize: 12.5, color: "var(--ivory)", lineHeight: 1.4 }}>{TICKER[idx]}</div>
        </div>
      </div>
    </div>
  );
}
