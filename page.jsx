"use client";
import React, { useState, useRef, useEffect } from "react";
import { ArrowUpRight, Send, Sparkles, ShieldCheck, Calculator, FileSearch, Workflow, Check } from "lucide-react";

const SUGGESTIONS = [
  "What is commission reconciliation in insurance?",
  "How does GST RCM apply to broker payouts in India?",
  "Explain incurred claims ratio (ICR).",
];

const USE_CASES = [
  { icon: Calculator, title: "Commission Reconciliation", body: "Agents match statements across 20+ insurers, flag TDS & GST mismatches, and close the loop without a payout analyst touching a spreadsheet." },
  { icon: FileSearch, title: "Statement & Policy Extraction", body: "Unstructured PDFs and carrier portals become clean, queryable data — premiums, slabs, clawbacks, effective dates — in seconds." },
  { icon: Workflow, title: "Payout Calculation & Disbursement", body: "Deterministic engines compute payouts against your rules and cycles, with a full audit trail your finance team can defend." },
  { icon: ShieldCheck, title: "Process Automation", body: "The repetitive back-office work that fills BPO floors — handled by agents that own the outcome, not just suggest it." },
];

export default function FinLeadSite() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

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
      const reply = data.reply || data.error || "Sorry — please try again.";
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages([...next, { role: "assistant", content: "There was a connection error. Please try again in a moment." }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="fl-root">
      <div className="fl-grain" />
      <div className="fl-aurora" />

      <nav style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 1200, margin: "0 auto", padding: "24px 24px" }}>
        <div className="fl-serif" style={{ fontSize: 24, letterSpacing: "-.02em" }}>FinLead<span className="fl-ital">.ai</span></div>
        <div className="fl-muted" style={{ display: "flex", gap: 36, fontSize: 14 }}>
          <a href="#product">Product</a><a href="#agents">Agents</a><a href="#copilot">Copilot</a><a href="#why">Why FinLead</a>
        </div>
        <button className="fl-btn fl-btn-ghost" style={{ padding: "9px 18px", fontSize: 14 }}>Book a demo</button>
      </nav>

      <header style={{ position: "relative", zIndex: 10, maxWidth: 1200, margin: "0 auto", padding: "92px 24px 48px", textAlign: "center" }}>
        <div className="fl-rise fl-eyebrow" style={{ animationDelay: ".05s", marginBottom: 22 }}>AI agents for insurance operations</div>
        <div className="fl-rise fl-hair" style={{ animationDelay: ".1s", marginBottom: 34 }} />
        <h1 className="fl-rise fl-serif" style={{ animationDelay: ".2s", fontWeight: 300, fontSize: "clamp(42px,7.2vw,86px)", lineHeight: 1.0, letterSpacing: "-.025em", maxWidth: "15ch", margin: "0 auto" }}>
          The insurance back-office, <span className="fl-gold-grad">run by agents.</span>
        </h1>
        <p className="fl-rise fl-muted" style={{ animationDelay: ".3s", fontSize: "clamp(16px,2vw,20px)", maxWidth: "56ch", lineHeight: 1.6, margin: "28px auto 0" }}>
          FinLead deploys AI agents that reconcile commissions, calculate payouts, and automate the repetitive work that fills BPO floors — with the economics of a BPO and the margins of software. We don't sell seats. We own the outcome.
        </p>
        <div className="fl-rise" style={{ animationDelay: ".45s", display: "flex", justifyContent: "center", gap: 12, marginTop: 36, flexWrap: "wrap" }}>
          <button className="fl-btn fl-btn-primary">Book a demo <ArrowUpRight size={17} /></button>
          <a href="#copilot" className="fl-btn fl-btn-ghost">Try the copilot <Sparkles size={16} /></a>
        </div>
      </header>

      <section id="product" style={{ position: "relative", zIndex: 10, maxWidth: 960, margin: "32px auto 112px", padding: "0 24px" }}>
        <div className="fl-rise fl-console fl-glass" style={{ animationDelay: ".6s", padding: 6 }}>
          <div style={{ borderRadius: 14, overflow: "hidden", background: "var(--ink2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderBottom: "1px solid var(--line)" }}>
              {[0, 1, 2].map((i) => <span key={i} style={{ width: 10, height: 10, borderRadius: 99, background: "#3a3a40" }} />)}
              <span className="fl-muted" style={{ marginLeft: 12, fontSize: 12 }}>FinLead Console — Commission Reconciliation</span>
              <span className="fl-pill fl-scan" style={{ marginLeft: "auto", background: "var(--gold-soft)", color: "var(--gold)" }}>Agent running</span>
            </div>
            <div className="fl-row fl-muted" style={{ borderTop: "none", textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11 }}>
              <span>Insurer / Statement</span><span>Expected</span><span>Reconciled</span><span>Status</span>
            </div>
            {[
              ["HDFC Life — Apr'26", "₹12,40,500", "₹12,40,500", "matched"],
              ["ICICI Pru — Apr'26", "₹8,15,200", "₹8,02,900", "flagged"],
              ["Star Health — Apr'26", "₹4,90,000", "₹4,90,000", "matched"],
              ["Bajaj Allianz — Apr'26", "₹6,72,300", "—", "processing"],
            ].map((r, i) => (
              <div className="fl-row" key={i}>
                <span style={{ color: "var(--ivory)" }}>{r[0]}</span>
                <span className="fl-muted">{r[1]}</span>
                <span style={{ color: r[2] === "—" ? "var(--muted2)" : "var(--ivory)" }}>{r[2]}</span>
                <span>
                  <span className="fl-pill" style={{
                    background: r[3] === "matched" ? "rgba(120,190,120,.12)" : r[3] === "flagged" ? "rgba(220,140,90,.14)" : "var(--gold-soft)",
                    color: r[3] === "matched" ? "#86c486" : r[3] === "flagged" ? "#e0a06a" : "var(--gold)",
                  }}>{r[3] === "matched" && <Check size={11} style={{ display: "inline", marginRight: 3 }} />}{r[3]}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ position: "relative", zIndex: 10, maxWidth: 960, margin: "0 auto 112px", padding: "0 24px", textAlign: "center" }}>
        <p className="fl-eyebrow" style={{ marginBottom: 28 }}>Built for the realities of Indian &amp; global insurers</p>
        <div className="fl-muted fl-serif" style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap", fontSize: 18, opacity: .55 }}>
          <span>20+ insurers</span><span>·</span><span>TDS &amp; GST RCM aware</span><span>·</span><span>IRDAI context</span><span>·</span><span>Full audit trail</span>
        </div>
      </section>

      <section id="agents" style={{ position: "relative", zIndex: 10, maxWidth: 1120, margin: "0 auto 112px", padding: "0 24px" }}>
        <div style={{ maxWidth: 640, marginBottom: 48 }}>
          <p className="fl-eyebrow" style={{ marginBottom: 16 }}>The agent layer</p>
          <h2 className="fl-serif" style={{ fontWeight: 350, fontSize: "clamp(30px,4.5vw,48px)", lineHeight: 1.1, letterSpacing: "-.02em", margin: 0 }}>
            Four agents that replace a back-office, <span className="fl-ital">not a feature.</span>
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16 }}>
          {USE_CASES.map((u, i) => {
            const Icon = u.icon;
            return (
              <div className="fl-card" key={i} style={{ padding: 28 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 46, height: 46, borderRadius: 12, background: "var(--gold-soft)", border: "1px solid rgba(203,179,130,.25)", marginBottom: 20 }}>
                  <Icon size={20} color="var(--gold)" />
                </div>
                <h3 className="fl-serif" style={{ fontSize: 22, fontWeight: 400, margin: "0 0 10px" }}>{u.title}</h3>
                <p className="fl-muted" style={{ fontSize: 15, lineHeight: 1.6, margin: 0 }}>{u.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="copilot" style={{ position: "relative", zIndex: 10, maxWidth: 960, margin: "0 auto 112px", padding: "0 24px" }}>
        <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 40px" }}>
          <p className="fl-eyebrow" style={{ marginBottom: 16 }}>Live demo</p>
          <h2 className="fl-serif" style={{ fontWeight: 350, fontSize: "clamp(30px,4.5vw,48px)", lineHeight: 1.1, letterSpacing: "-.02em", margin: 0 }}>
            Ask the FinLead <span className="fl-ital">Copilot.</span>
          </h2>
          <p className="fl-muted" style={{ fontSize: 16, marginTop: 16 }}>An insurance-only assistant. Ask anything about insurance operations — it will politely decline everything else.</p>
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
              placeholder="Ask about commissions, claims, ICR, IRDAI…"
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

      <section style={{ position: "relative", zIndex: 10, maxWidth: 760, margin: "0 auto 112px", padding: "0 24px", textAlign: "center" }}>
        <h2 className="fl-serif" style={{ fontWeight: 350, fontSize: "clamp(34px,5vw,60px)", lineHeight: 1.05, letterSpacing: "-.02em", margin: 0 }}>
          Hand your back-office <span className="fl-gold-grad">to the agents.</span>
        </h2>
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 32, flexWrap: "wrap" }}>
          <button className="fl-btn fl-btn-primary">Book a demo <ArrowUpRight size={17} /></button>
          <button className="fl-btn fl-btn-ghost">Talk to founders</button>
        </div>
      </section>

      <footer style={{ position: "relative", zIndex: 10, borderTop: "1px solid var(--line)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div className="fl-serif" style={{ fontSize: 20 }}>FinLead<span className="fl-ital">.ai</span></div>
          <p className="fl-muted" style={{ fontSize: 14, margin: 0 }}>© 2026 FinLead AI · Delaware C-Corp · Bengaluru</p>
        </div>
      </footer>
    </div>
  );
}
