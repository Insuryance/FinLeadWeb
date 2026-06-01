"use client";
import React, { useState, useRef, useEffect } from "react";
import { ArrowUpRight, Send, Sparkles, Check, Landmark, Users, ShieldCheck } from "lucide-react";

/* ---------- Logo mark ---------- */
function Logo() {
  return <img src="/FinLeadAILogo.png" alt="FinLead AI" style={{ height: 30, width: "auto", display: "block" }} />;
}

function useTypewriter(items, { typing = 55, pausing = 1600, deleting = 28 } = {}) {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState("typing");
  useEffect(() => {
    const full = items[idx % items.length];
    let to;
    if (phase === "typing") {
      if (text.length < full.length) to = setTimeout(() => setText(full.slice(0, text.length + 1)), typing);
      else to = setTimeout(() => setPhase("deleting"), pausing);
    } else {
      if (text.length > 0) to = setTimeout(() => setText(full.slice(0, text.length - 1)), deleting);
      else { setPhase("typing"); setIdx((i) => i + 1); }
    }
    return () => clearTimeout(to);
  }, [text, phase, idx, items, typing, pausing, deleting]);
  return text;
}

/* ---------- Decode text effect (parallel.ai style) ---------- */
function DecodeText({ text, className, style, delay = 200, speed = 0.5 }) {
  const [out, setOut] = useState(text);
  useEffect(() => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*<>/_";
    let iteration = 0;
    let id;
    const t = setTimeout(() => {
      id = setInterval(() => {
        setOut(text.split("").map((c, i) => {
          if (c === " ") return " ";
          if (i < iteration) return text[i];
          return chars[Math.floor(Math.random() * chars.length)];
        }).join(""));
        iteration += speed;
        if (iteration >= text.length) { clearInterval(id); setOut(text); }
      }, 40);
    }, delay);
    return () => { clearTimeout(t); clearInterval(id); };
  }, [text, delay, speed]);
  return <span className={className} style={style}>{out}</span>;
}

/* ---------- Indian-format currency ---------- */
function inr(n) {
  const s = String(n);
  const last3 = s.slice(-3);
  let rest = s.slice(0, -3);
  if (rest) rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return "₹" + (rest ? rest + "," : "") + last3;
}

/* ---------- Live, self-updating console ---------- */
const POOL = ["ABC Life", "XYZ General Insurance", "EFG Health Insurance", "PQR General Insurance", "LMN Life", "RST General Insurance", "UVW Health Insurance"];
const MONTHS = ["Mar'26", "Apr'26", "May'26", "Jun'26"];
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const mkAmt = () => rnd(40, 150) * 10000 + rnd(0, 99) * 100;
const REASONS = {
  matched: "Reconciled against the carrier statement. No variance found.",
  processing: "Agent is extracting and matching the carrier statement…",
};
const mkRow = () => ({ name: `${POOL[rnd(0, POOL.length - 1)]} · ${MONTHS[rnd(0, MONTHS.length - 1)]}`, expected: mkAmt(), reconciled: null, status: "processing", reason: REASONS.processing, flash: true, id: Math.random() });

function LiveConsole() {
  const [rows, setRows] = useState([
    { name: "ABC Life · Apr'26", expected: 1240500, reconciled: 1240500, status: "matched", reason: REASONS.matched, id: 1 },
    { name: "XYZ General Insurance · Apr'26", expected: 815200, reconciled: 802900, status: "flagged", reason: "Variance of ₹12,300 detected — suspected TDS/rate mismatch on slab 2. Held for review.", id: 2 },
    { name: "EFG Health Insurance · Apr'26", expected: 490000, reconciled: 490000, status: "matched", reason: REASONS.matched, id: 3 },
    { name: "PQR General Insurance · Apr'26", expected: 672300, reconciled: null, status: "processing", reason: REASONS.processing, id: 4 },
  ]);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    const t = setInterval(() => {
      setRows((prev) => {
        const i = rnd(0, prev.length - 1);
        const r = prev[i];
        let updated;
        if (r.status === "processing") {
          const flagged = Math.random() < 0.35;
          const reconciled = flagged ? r.expected - rnd(2, 15) * 1000 : r.expected;
          updated = { ...r, reconciled, status: flagged ? "flagged" : "matched",
            reason: flagged ? `Variance of ${inr(r.expected - reconciled)} detected — suspected TDS/rate mismatch. Held for review.` : REASONS.matched, flash: true };
        } else {
          updated = mkRow();
        }
        return prev.map((x, idx) => (idx === i ? updated : { ...x, flash: false }));
      });
    }, 2300);
    return () => clearInterval(t);
  }, []);

  const pillStyle = (s) => ({
    background: s === "matched" ? "rgba(80,190,110,.14)" : s === "flagged" ? "rgba(230,80,80,.16)" : "rgba(125,150,210,.16)",
    color: s === "matched" ? "#6FCF7F" : s === "flagged" ? "#FF7E7E" : "#94A9E6",
  });

  const counts = rows.reduce((a, r) => { a[r.status] = (a[r.status] || 0) + 1; return a; }, {});

  return (
    <div className="fl-rise fl-console fl-glass" style={{ animationDelay: ".6s", padding: 6 }}>
      <div style={{ borderRadius: 14, overflow: "hidden", background: "var(--ink2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderBottom: "1px solid var(--line)" }}>
          {[0, 1, 2].map((i) => <span key={i} style={{ width: 10, height: 10, borderRadius: 99, background: "#3a3a40" }} />)}
          <span className="fl-muted" style={{ marginLeft: 12, fontSize: 12 }}>FinLead Console: Commission Reconciliation</span>
          <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, color: "#6FCF7F" }}>
            <span className="fl-dot" style={{ background: "#6FCF7F" }} /> Agent active
          </span>
        </div>
        <div className="fl-row fl-muted" style={{ borderTop: "none", textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11 }}>
          <span>Carrier / Statement</span><span>Expected</span><span>Reconciled</span><span>Status</span>
        </div>
        {rows.map((r) => (
          <div className={`fl-row${r.flash ? " fl-rowflash" : ""}`} key={r.id}>
            <span style={{ color: "var(--ivory)" }}>{r.name}</span>
            <span className="fl-muted">{inr(r.expected)}</span>
            <span style={{ color: r.reconciled == null ? "var(--muted2)" : "var(--ivory)" }}>{r.reconciled == null ? "-" : inr(r.reconciled)}</span>
            <span style={{ position: "relative" }} onMouseEnter={() => setHover(r.id)} onMouseLeave={() => setHover(null)}>
              <span className="fl-pill" style={{ ...pillStyle(r.status), cursor: "help" }}>
                {r.status === "matched" && <Check size={11} style={{ display: "inline", marginRight: 3 }} />}{r.status}
              </span>
              {hover === r.id && r.reason && (
                <span style={{ position: "absolute", bottom: "138%", right: 0, width: 220, whiteSpace: "normal", textAlign: "left", background: "#16161b", border: "1px solid var(--line)", color: "var(--ivory)", fontSize: 12, lineHeight: 1.45, padding: "9px 11px", borderRadius: 9, boxShadow: "0 14px 36px rgba(0,0,0,.55)", zIndex: 9 }}>
                  {r.reason}
                </span>
              )}
            </span>
          </div>
        ))}
        <div className="fl-muted" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", borderTop: "1px solid var(--line)", fontSize: 12, flexWrap: "wrap" }}>
          <span style={{ color: "#6FCF7F" }}>{counts.matched || 0} matched</span><span>·</span>
          <span style={{ color: "#FF7E7E" }}>{counts.flagged || 0} flagged</span><span>·</span>
          <span style={{ color: "#94A9E6" }}>{counts.processing || 0} processing</span>
          <span style={{ marginLeft: "auto" }}>FinLead agent · auto-reconciling in real time</span>
        </div>
      </div>
    </div>
  );
}

/* ---------- Agent suites ---------- */
const SUITES = [
  {
    icon: Landmark, name: "Finance Ops", tag: "Agents that close the books.",
    items: [
      ["Commission Reconciliation", "Match statements across carriers, flag tax and rate mismatches, and reconcile to the last rupee - no analyst, no spreadsheet."],
      ["Statement & Policy Extraction", "Turn unstructured carrier PDFs and portals into clean, queryable data: premiums, slabs, clawbacks, effective dates."],
      ["Payout Calculation", "Compute payouts against your rules and cycles, with a defensible, fully auditable trail."],
    ],
  },
  {
    icon: Users, name: "PoSP & Distribution", tag: "Agents that run your producer network.",
    items: [
      ["Agent Onboarding", "Onboard producers end-to-end - verification, licensing checks, and activation with no manual chase."],
      ["Agent Analysis", "Track producer performance, persistency, and productivity across the entire book in real time."],
      ["Agent Intelligence", "Surface who to coach, who to reward, and where the next premium will come from."],
    ],
  },
  {
    icon: ShieldCheck, name: "Intelligence", tag: "Agents that protect profitability.",
    items: [
      ["Leakage Analysis", "Detect leakage across commissions, payouts, and claims before it compounds into lost margin."],
      ["Profitability Guardrails", "Agents that watch margin, not vanity metrics - every payout measured against profit."],
      ["Corrective Insight", "Recommend concrete changes to rates, rules, and controls to recover and protect margin."],
    ],
  },
];

const SUGGESTIONS = [
  "What does FinLead AI do?",
  "Who is FinLead AI built for?",
  "How do the Intelligence agents reduce leakage?",
];

const TYPING_QUESTIONS = [
  "What does FinLead AI do?",
  "How do FinLead's agents reconcile commissions across carriers?",
  "Who is FinLead AI built for?",
  "How does the Intelligence suite cut leakage?",
];

export default function FinLeadSite() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const typed = useTypewriter(TYPING_QUESTIONS);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, loading]);

  const send = async (textArg) => {
    const text = (textArg ?? input).trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user", content: text }];
    setMessages(next); setInput(""); setLoading(true);
    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      const reply = data.reply || data.error || "Sorry! Please try again.";
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages([...next, { role: "assistant", content: "There was a connection error. Please try again in a moment." }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="fl-root">
      <div className="fl-grain" />
      <div className="fl-aurora" />

      {/* NAV — translucent dock */}
      <div className="fl-navwrap">
        <nav style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px", height: 74, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="#top" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Logo />
            <span className="fl-serif" style={{ fontSize: 22, letterSpacing: "-.02em" }}>FinLead<span className="fl-ital">.ai</span></span>
          </a>
          <div className="fl-dock">
            <a href="#product">Product</a><a href="#agents">Agents</a><a href="#assistant">Assistant</a><a href="#why">Why FinLead</a>
          </div>
          <button className="fl-btn fl-btn-shine" style={{ padding: "10px 20px", fontSize: 14 }}>Book a demo</button>
        </nav>
      </div>

      {/* HERO */}
      <header id="top" style={{ position: "relative", zIndex: 10, maxWidth: 1200, margin: "0 auto", padding: "56px 24px 48px", textAlign: "center" }}>
        <div className="fl-rise fl-eyebrow" style={{ animationDelay: ".05s", marginBottom: 22 }}>
          <DecodeText text="AI AGENTS FOR INSURANCE OPERATIONS" />
        </div>
        <div className="fl-rise fl-hair" style={{ animationDelay: ".1s", marginBottom: 34 }} />
        <h1 className="fl-rise fl-serif" style={{ animationDelay: ".2s", fontWeight: 300, fontSize: "clamp(42px,7.2vw,86px)", lineHeight: 1.0, letterSpacing: "-.025em", maxWidth: "15ch", margin: "0 auto" }}>
          The insurance back-office, <span className="fl-gold-grad">run by AI agents.</span>
        </h1>
        <p className="fl-rise fl-muted" style={{ animationDelay: ".3s", fontSize: "clamp(16px,2vw,20px)", maxWidth: "58ch", lineHeight: 1.6, margin: "28px auto 0" }}>
          FinLead AI deploys AI agents that handle complex tasks for insurers, brokers, agencies, MGAs and more with intelligence, speed and accuracy. We don't sell seats. We own the outcome.
        </p>
        <div className="fl-rise" style={{ animationDelay: ".45s", display: "flex", justifyContent: "center", gap: 12, marginTop: 36, flexWrap: "wrap" }}>
          <button className="fl-btn fl-btn-shine">Book a demo <ArrowUpRight size={17} /></button>
          <a href="#assistant" className="fl-btn fl-btn-ghost">Ask the assistant <Sparkles size={16} /></a>
        </div>
        <div className="fl-rise" style={{ animationDelay: ".6s", marginTop: 26, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <span className="fl-muted" style={{ fontSize: 13, letterSpacing: ".04em" }}>Backed by</span>
          <a href="https://www.joinef.com/about/" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex" }}>
            <img src="/EFLogo.png" alt="Entrepreneur First" style={{ height: 22, width: "auto", display: "block", opacity: .9 }} />
          </a>
        </div>
      </header>

      {/* PRODUCT — live console */}
      <section id="product" style={{ position: "relative", zIndex: 10, maxWidth: 960, margin: "32px auto 112px", padding: "0 24px" }}>
        <LiveConsole />
      </section>

      {/* TRUST STRIP */}
      <section style={{ position: "relative", zIndex: 10, maxWidth: 1000, margin: "0 auto 112px", padding: "0 24px", textAlign: "center" }}>
        <p className="fl-eyebrow" style={{ marginBottom: 28 }}>Built for the realities of global insurers: global tech, powered by intelligent AI</p>
        <div className="fl-muted fl-serif" style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap", fontSize: 18, opacity: .55 }}>
          <span>5+ insurers</span><span>·</span><span>10+ brokers &amp; more</span><span>·</span><span>Tax &amp; compliance aware</span><span>·</span><span>Full audit trail, incl. AI audits</span>
        </div>
      </section>

      {/* AGENT SUITES */}
      <section id="agents" style={{ position: "relative", zIndex: 10, maxWidth: 1180, margin: "0 auto 112px", padding: "0 24px" }}>
        <div style={{ maxWidth: 1140, marginBottom: 52 }}>
          <p className="fl-eyebrow" style={{ marginBottom: 16 }}>The agent layer</p>
          <h2 className="fl-serif" style={{ fontWeight: 350, fontSize: "clamp(26px,3.4vw,38px)", lineHeight: 1.15, letterSpacing: "-.02em", margin: 0 }}>
            Three suites of agents, <span className="fl-gold-grad">one autonomous back-office.</span>
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(310px,1fr))", gap: 16 }}>
          {SUITES.map((s, i) => {
            const Icon = s.icon;
            return (
              <div className="fl-card" key={i} style={{ padding: 30 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 46, height: 46, borderRadius: 12, background: "var(--gold-soft)", border: "1px solid rgba(217,201,163,.25)", marginBottom: 20 }}>
                  <Icon size={20} color="var(--gold)" />
                </div>
                <h3 className="fl-serif" style={{ fontSize: 24, fontWeight: 400, margin: "0 0 4px" }}>{s.name}</h3>
                <p className="fl-muted fl-serif fl-ital" style={{ fontSize: 16, margin: "0 0 18px" }}>{s.tag}</p>
                <div>
                  {s.items.map((it, j) => (
                    <div className="fl-subitem" key={j}>
                      <div style={{ color: "var(--ivory)", fontSize: 15, fontWeight: 500, marginBottom: 5 }}>{it[0]}</div>
                      <p className="fl-muted" style={{ fontSize: 14, lineHeight: 1.55, margin: 0 }}>{it[1]}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ASSISTANT */}
      <section id="assistant" style={{ position: "relative", zIndex: 10, maxWidth: 960, margin: "0 auto 112px", padding: "0 24px" }}>
        <div style={{ textAlign: "center", maxWidth: 680, margin: "0 auto 40px" }}>
          <h2 className="fl-serif" style={{ fontWeight: 350, fontSize: "clamp(30px,4.5vw,48px)", lineHeight: 1.1, letterSpacing: "-.02em", margin: 0 }}>
            FinLead AI <span className="fl-gold-grad">Assistant.</span>
          </h2>
          <p className="fl-muted" style={{ fontSize: 16, marginTop: 16 }}>Ask anything about FinLead AI! What we build, who we serve, and how our agents work. It answers questions about FinLead AI, and nothing else.</p>
        </div>

        <div className="fl-glass" style={{ maxWidth: 760, margin: "0 auto", padding: 20 }}>
          <div ref={scrollRef} className="fl-scroll" style={{ height: 360, overflowY: "auto", padding: "8px 6px" }}>
            {messages.length === 0 && (
              <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 24px" }}>
                <Sparkles size={26} color="var(--gold)" />
                <p className="fl-muted" style={{ fontSize: 15, margin: "16px 0 20px" }}>Try one of these to start:</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                  {SUGGESTIONS.map((s, i) => <button key={i} className="fl-chip" onClick={() => send(s)}>{s}</button>)}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", marginBottom: 12, justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div className={m.role === "user" ? "fl-bubble-u" : "fl-bubble-a"} style={{ padding: "11px 15px", maxWidth: "82%", fontSize: 15, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{m.content}</div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
                <div className="fl-bubble-a" style={{ padding: "13px 16px" }}>
                  <span className="fl-dot" /> <span className="fl-dot" /> <span className="fl-dot" />
                </div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <input
              className="fl-input"
              style={{ flex: 1, padding: "13px 16px", fontSize: 15 }}
              placeholder={typed || "Ask about FinLead AI…"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
            />
            <button className="fl-btn fl-btn-primary" style={{ padding: "13px 18px" }} onClick={() => send()} disabled={loading}>
              <Send size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* WHY */}
      <section id="why" style={{ position: "relative", zIndex: 10, maxWidth: 1120, margin: "0 auto 112px", padding: "0 24px" }}>
        <div className="fl-glass" style={{ padding: "56px 40px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 40, textAlign: "center" }}>
            {[["BPO economics", "Priced to the work displaced, not seats sold."], ["SaaS margins", "Agents scale without scaling headcount."], ["We own the outcome", "Reconciled books, not a dashboard to babysit."]].map((m, i) => (
              <div key={i}>
                <div className="fl-serif fl-ital" style={{ fontSize: 30, marginBottom: 12 }}>{m[0]}</div>
                <p className="fl-muted" style={{ fontSize: 15, lineHeight: 1.6, margin: 0 }}>{m[1]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ position: "relative", zIndex: 10, maxWidth: 760, margin: "0 auto 96px", padding: "0 24px", textAlign: "center" }}>
        <h2 className="fl-serif" style={{ fontWeight: 350, fontSize: "clamp(34px,5vw,60px)", lineHeight: 1.05, letterSpacing: "-.02em", margin: 0 }}>
          Hand your back-office <span className="fl-gold-grad">to FinLead's AI agents.</span>
        </h2>
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 32, flexWrap: "wrap" }}>
          <button className="fl-btn fl-btn-shine">Book a demo <ArrowUpRight size={17} /></button>
          <a href="mailto:surya@finleadai.com" className="fl-btn fl-btn-ghost">Talk to founders</a>
        </div>
      </section>

      {/* agent-readable line */}
      <div style={{ position: "relative", zIndex: 10, textAlign: "center", marginBottom: 56 }}>
        <span className="fl-eyebrow" style={{ opacity: .8 }}>
          <DecodeText text="READABLE BY HUMANS AND AI AGENTS ALIKE" delay={600} />
        </span>
      </div>

      {/* FOOTER */}
      <footer style={{ position: "relative", zIndex: 10, borderTop: "1px solid var(--line)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "36px 24px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <a href="#top" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Logo />
            <span className="fl-serif" style={{ fontSize: 20 }}>FinLead<span className="fl-ital">.ai</span></span>
          </a>
          <a href="https://www.joinef.com/about/" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span className="fl-muted" style={{ fontSize: 13 }}>Backed by</span>
            <img src="/EFLogo.png" alt="Entrepreneur First" style={{ height: 18, width: "auto", display: "block", opacity: .85 }} />
          </a>
          <p className="fl-muted" style={{ fontSize: 14, margin: 0 }}>© 2026 FinLead AI</p>
        </div>
      </footer>
    </div>
  );
}
