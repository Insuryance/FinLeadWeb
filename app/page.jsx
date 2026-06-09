"use client";
import React, { useState, useRef, useEffect } from "react";
import { ArrowUpRight, Send, Sparkles, Check, Landmark, Users, ShieldCheck } from "lucide-react";

/* ---------- Logo mark ---------- */
function Logo() {
  return <img src="/FinLeadAILogo.png" alt="FinLead AI" style={{ height: 70, width: "auto", display: "block" }} />;
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

/* ---------- Decode text effect (new style) ---------- */
function DecodeText({ text, className, style, delay = 200, speed = 0.5 }) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*<>/_";
  const scramble = (t) => t.split("").map((c) => (c === " " ? " " : chars[Math.floor(Math.random() * chars.length)])).join("");
  const [out, setOut] = useState(() => scramble(text));
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
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
        if (iteration >= text.length) { clearInterval(id); setOut(text); done.current = true; }
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
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 600);
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
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
            <span style={{ color: "var(--ivory)" }}>{isMobile ? r.name.split(" · ")[0].replace(/ (General|Health) Insurance/, m => m.includes("Health") ? " Health" : " Gen Ins") : r.name}</span>
            <span className="fl-muted">{inr(r.expected)}</span>
            <span style={{ color: r.reconciled == null ? "var(--muted2)" : "var(--ivory)" }}>{r.reconciled == null ? "-" : inr(r.reconciled)}</span>
            <span style={{ position: "relative", overflow: "visible" }} onMouseEnter={() => setHover(r.id)} onMouseLeave={() => setHover(null)} onClick={() => setHover(hover === r.id ? null : r.id)}>
              <span className="fl-pill" style={{ ...pillStyle(r.status), cursor: "pointer" }}>
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
/* ---------- Second live demo: Agent Onboarding feed ---------- */
const ONB_NAMES = ["Agent 1", "Agent 2", "Agent 3", "Agent 4", "Agent 5", "Agent 6", "Agent 7", "Agent 8", "Agent 9", "Agent 10"];
const ONB_STAGES = [
  "KYC: PAN & Aadhaar",
  "IRDAI licence check",
  "PoSP exam status",
  "Agreement e-sign",
  "Activation",
];
const mkOnb = () => {
  const flagged = Math.random() < 0.18;
  return {
    name: ONB_NAMES[rnd(0, ONB_NAMES.length - 1)],
    stage: ONB_STAGES[0],
    stageIdx: 0,
    status: flagged ? "flagged" : "verifying",
    flash: true,
    id: Math.random(),
  };
};

function OnboardConsole() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 600);
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  const [rows, setRows] = useState([
    { name: "Agent 1", stage: "Activation", stageIdx: 4, status: "activated", reason: "All checks passed. Producer activated and ready to transact.", id: 1 },
    { name: "Agent 2", stage: "IRDAI licence check", stageIdx: 1, status: "flagged", reason: "Licence number could not be verified against the IRDAI registry. Held for manual review.", id: 2 },
    { name: "Agent 3", stage: "PoSP exam status", stageIdx: 2, status: "verifying", reason: "Agent is confirming PoSP certification and exam completion.", id: 3 },
    { name: "Agent 4", stage: "Agreement e-sign", stageIdx: 3, status: "cleared", reason: "Stage cleared. Awaiting the next step in onboarding.", id: 4 },
  ]);
  const [hover, setHover] = useState(null);
  useEffect(() => {
    const t = setInterval(() => {
      setRows((prev) => {
        const i = rnd(0, prev.length - 1);
        const r = prev[i];
        let updated;
        if (r.status === "activated" || r.status === "flagged") {
          updated = { ...mkOnb(), reason: "Agent is confirming PAN & Aadhaar against KYC records." };
        } else if (r.stageIdx >= ONB_STAGES.length - 1) {
          updated = { ...r, status: "activated", reason: "All checks passed. Producer activated and ready to transact.", flash: true };
        } else {
          const next = r.stageIdx + 1;
          const flagged = Math.random() < 0.15;
          updated = {
            ...r,
            stageIdx: next,
            stage: ONB_STAGES[next],
            status: flagged ? "flagged" : next === ONB_STAGES.length - 1 ? "cleared" : "verifying",
            reason: flagged
              ? `Verification failed at "${ONB_STAGES[next]}". Held for manual review.`
              : `Agent is processing "${ONB_STAGES[next]}".`,
            flash: true,
          };
        }
        return prev.map((x, idx) => (idx === i ? updated : { ...x, flash: false }));
      });
    }, 2400);
    return () => clearInterval(t);
  }, []);

  const pillStyle = (s) => ({
    background: s === "activated" ? "rgba(80,190,110,.14)" : s === "flagged" ? "rgba(230,80,80,.16)" : s === "cleared" ? "rgba(80,190,110,.10)" : "rgba(125,150,210,.16)",
    color: s === "activated" ? "#6FCF7F" : s === "flagged" ? "#FF7E7E" : s === "cleared" ? "#6FCF7F" : "#94A9E6",
  });

  const counts = rows.reduce((a, r) => { const k = r.status === "cleared" ? "verifying" : r.status; a[k] = (a[k] || 0) + 1; return a; }, {});

  return (
    <div className="fl-rise fl-console fl-glass" style={{ animationDelay: ".6s", padding: 6 }}>
      <div style={{ borderRadius: 14, overflow: "hidden", background: "var(--ink2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderBottom: "1px solid var(--line)" }}>
          {[0, 1, 2].map((i) => <span key={i} style={{ width: 10, height: 10, borderRadius: 99, background: "#3a3a40" }} />)}
          <span className="fl-muted" style={{ marginLeft: 12, fontSize: 12 }}>FinLead Console: Agent Onboarding</span>
          <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, color: "#6FCF7F" }}>
            <span className="fl-dot" style={{ background: "#6FCF7F" }} /> Agent active
          </span>
        </div>
        <div className="fl-row fl-muted" style={{ borderTop: "none", textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11 }}>
          <span>Producer</span><span>Stage</span><span>Step</span><span>Status</span>
        </div>
        {rows.map((r) => (
          <div className={`fl-row${r.flash ? " fl-rowflash" : ""}`} key={r.id}>
           <span style={{ color: "var(--ivory)" }}>{r.name}</span>
            <span className="fl-muted">{r.stage}</span>
            <span style={{ color: "var(--muted2)" }}>{r.stageIdx + 1}/5</span>
            <span style={{ position: "relative", overflow: "visible" }} onMouseEnter={() => setHover(r.id)} onMouseLeave={() => setHover(null)} onClick={() => setHover(hover === r.id ? null : r.id)}>
              <span className="fl-pill" style={{ ...pillStyle(r.status), cursor: "pointer" }}>{(r.status === "activated" || r.status === "cleared") && <Check size={11} style={{ display: "inline", marginRight: 3 }} />}{r.status}</span>
              {hover === r.id && r.reason && (
                <span style={{ position: "absolute", bottom: "138%", right: 0, width: 220, whiteSpace: "normal", textAlign: "left", background: "#16161b", border: "1px solid var(--line)", color: "var(--ivory)", fontSize: 12, lineHeight: 1.45, padding: "9px 11px", borderRadius: 9, boxShadow: "0 14px 36px rgba(0,0,0,.55)", zIndex: 9 }}>
                  {r.reason}
                </span>
              )}
            </span>
          </div>
        ))}
        <div className="fl-muted" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", borderTop: "1px solid var(--line)", fontSize: 12, flexWrap: "wrap" }}>
          <span style={{ color: "#6FCF7F" }}>{counts.activated || 0} activated</span><span>·</span>
          <span style={{ color: "#FF7E7E" }}>{counts.flagged || 0} flagged</span><span>·</span>
          <span style={{ color: "#94A9E6" }}>{counts.verifying || 0} verifying</span>
          <span style={{ marginLeft: "auto" }}>FinLead agent · onboarding producers in real time</span>
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
  "What are the three agent suites?",
  "How does the Intelligence suite cut leakage?",
  "How is this different from ChatGPT or Claude?",
  "Can I customise my AI Agents?",
  "Can I Integrate these AI Agents with my existing software?",
  "Are your Agents compliant?",
  "How does pricing work?",
  "How do FinLead's agents reconcile commissions across carriers?",
  "Is my data stored or taken by these AI Agents?",
  "How do I get started?",
];
const TYPING_QUESTIONS = [
  "What does FinLead AI do?",
  "How do FinLead's agents reconcile commissions across carriers?",
  "Who is FinLead AI built for?",
  "How does the Intelligence suite cut leakage?",
];

const FOUNDER_EMAIL = "surya@finleadai.com";
const FALLBACK = `That's a great question — and honestly, the founders can answer it far better than I can. Drop them a line at ${FOUNDER_EMAIL} and they'll get right back to you.`;

const QA = [
  { q: "What does FinLead AI do?", keys: ["what", "do", "does", "build", "product"],
    a: "FinLead AI deploys autonomous AI agents that run insurance back-office operations end to end: commission reconciliation, payout calculation, statement, policy extraction, producer management, and profitability intelligence. We don't sell software seats; our agents own the outcome, with the economics of a BPO and the margins of software." },
  { q: "Who is FinLead AI built for?", keys: ["who", "for", "customer", "client", "serve", "built"],
    a: "Insurers, Brokers, Agencies, MGAs and other distributors: anyone running high-volume insurance operations who would rather hand the repetitive back-office work to agents than staff a BPO floor for it. Our AI Agents have been hard tested and have been proven to be the golden standard in this space." },
  { q: "How do FinLead's agents reconcile commissions across carriers?", keys: ["reconcile", "commission", "carrier", "statement", "finance"],
    a: "The Finance Ops agents ingest statements from every carrier, normalise the formats, match each line against the expected payout, and flag any mismatch automatically: reconciling to the last rupee with a full audit trail, and no analyst touching a spreadsheet. Our AI Agents already have the intelligence to own the process end to end." },
  { q: "How does the Intelligence suite cut leakage?", keys: ["leak", "leakage", "intelligence", "margin", "profit", "reduce"],
    a: "The Intelligence suite measures every commission, payout and claim against profitability, not vanity metrics. It detects leakage before it compounds, flags the root cause and recommends concrete corrective changes to recover and protect margin. Brokers love it." },
  { q: "What are the three agent suites?", keys: ["suite", "three", "agent", "layer"],
    a: "Three suites: Finance Ops (commission reconciliation, statement and policy extraction, payout calculation), PoSP & Distribution (producer onboarding, analysis and intelligence), and Intelligence (leakage analysis, profitability guardrails and corrective insight)." },
  { q: "How does pricing work?", keys: ["price", "pricing", "cost", "much", "fee"],
    a: "Pricing is tied to the work the agents displace rather than per-seat licences, so it scales with the value delivered. The exact numbers depend on your volumes and which suites you deploy, which the founders can walk you through in a quick demo." },
{ q: "How does your agents are different from ChatGPT or Claude?", keys: ["different", "claude", "gpt", "chatgpt"],
    a: "Our AI Agents have been doing these tasks since sometime now - with more than 100000+ line items tested, matched and analysed our AI Agents have developed a memory for these workflows with the ability to handle any nuances around it." },
{ q: "Can I customise my AI Agents?", keys: ["customise", "customize"],
    a: "Although FinLead's AI Agents understand all the nuances around these processes - but if you still feel to customise them - yes you can! You can create a specific SoP for your AI Agents and test the customisation yourself as well!" },
{ q: "Can I Integrate these AI Agents with my existing software?", keys: ["integration", "existing", "software", "integrate"],
    a: "Yes! You can - its easy - our AI Agents get integrated to any software with just a simple backend integration. Any software whether it be external or internally built is nothing but a deployment playground for our AI Agents." },
{ q: "Is my data is stored or taken by these AI Agents?", keys: ["store", "data", "privacy", "theft"],
    a: "No. As our AI Agents have already been stress tested for data compliance and security aspect - they see no value to your data points. In general - they're data blind." },
{ q: "Are your Agents compliant?", keys: ["compliance", "compliant", "dpdp", "privacy"],
    a: "Yes. Our Agents follow DPDP rigorously and are compliant ." },
  { q: "How do I get started?", keys: ["start", "started", "demo", "begin", "pilot", "contact"],
    a: `The fastest way is to book a demo or email the founders directly at surya@finleadai.com. They'll scope a pilot around your highest-volume workflow.` },
  {
  q: "Is FinLead AI a standalone platform or API-based?",
  keys: [
    "api",
    "api based",
    "standalone",
    "platform",
    "replace software",
    "new software",
    "dashboard",
    "crm",
    "system",
    "workflow"
  ],
  a: "FinLead AI works alongside your existing systems rather than replacing them. Our AI Agents connect through APIs and backend integrations and execute work directly within your current workflows. Think of us as an intelligent operational layer that runs insurance operations end-to-end across your existing software stack."
},
  {
  q: "How do you calculate commissions?",
  keys: [
    "calculate",
    "calculation",
    "commission",
    "commissions",
    "payout",
    "broker payout",
    "carrier payout",
    "earning"
  ],
  a: "Our Finance Ops agents calculate commissions by combining carrier statements, policy data, producer hierarchies, payout structures and commission schedules. Every line item is matched against the expected payout and automatically reconciled, creating a complete audit trail with no manual spreadsheet work."
},
  {
  q: "How long does implementation take?",
  keys: [
    "implementation",
    "deploy",
    "deployment",
    "setup",
    "onboard",
    "onboarding",
    "go live",
    "timeline",
    "install"
  ],
  a: "Most customers start with a focused pilot around a high-volume workflow. Depending on integration complexity and data availability, deployment can take anywhere from a few days to a few weeks. The goal is to get measurable outcomes quickly rather than spending months implementing software."
},
  {
  q: "How do you identify revenue leakage?",
  keys: [
    "leakage",
    "leak",
    "revenue",
    "profitability",
    "margin",
    "loss",
    "commission leakage",
    "recover"
  ],
  a: "The Intelligence suite continuously analyses commissions, payouts, claims and distribution performance to identify profitability leaks. It highlights anomalies, uncovers root causes and recommends corrective actions before small losses become significant margin erosion."
},
  {
  q: "How secure are FinLead AI Agents?",
  keys: [
    "security",
    "secure",
    "data security",
    "confidential",
    "protection",
    "sensitive data",
    "risk"
  ],
  a: "Security is foundational to FinLead AI. Our agents are designed with strict access controls, auditability and enterprise-grade security practices. We follow DPDP requirements and ensure customer information remains protected throughout every workflow."
},
];

function matchAnswer(text) {
  const t = text.toLowerCase();
  for (const item of QA) if (item.q.toLowerCase() === t) return item.a;
  let best = null, bestScore = 0;
  for (const item of QA) {
    let score = 0;
    for (const k of item.keys) if (t.includes(k)) score++;
    if (score > bestScore) { bestScore = score; best = item; }
  }
  return best && bestScore >= 2 ? best.a : FALLBACK;
}

function renderText(content) {
  if (!content.includes(FOUNDER_EMAIL)) return content;
  const parts = content.split(FOUNDER_EMAIL);
  return <>{parts[0]}<a href={"mailto:" + FOUNDER_EMAIL} style={{ color: "var(--gold)" }}>{FOUNDER_EMAIL}</a>{parts[1]}</>;
}
function DemoModal({ open, onClose }) {
  const [status, setStatus] = useState("idle");
  const [form, setForm] = useState({ org: "", name: "", designation: "", email: "", usecases: "" });
  if (!open) return null;
  const upd = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = async () => {
    if (!form.email || !form.name) { setStatus("need"); return; }
    setStatus("sending");
    try {
      const res = await fetch("https://formspree.io/f/xkoelqyb", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ organisation: form.org, name: form.name, designation: form.designation, email: form.email, use_cases: form.usecases }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch (e) { setStatus("error"); }
  };
  const FIELDS = [["Organisation", "org", "text"], ["Your name", "name", "text"], ["Designation", "designation", "text"], ["Work email", "email", "email"]];
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,.62)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} className="fl-glass" style={{ width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <h3 className="fl-serif" style={{ fontSize: 26, fontWeight: 400, margin: 0 }}>Book a <span className="fl-gold-grad">demo.</span></h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 24, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        {status === "done" ? (
          <p className="fl-muted" style={{ fontSize: 15, lineHeight: 1.6, marginTop: 14 }}>
            Thanks — your request is in. Clooker, our AI agent, is already reviewing your use-cases (and quietly hoping for one our agents can't solve). The founders will be in touch shortly.
          </p>
        ) : (
          <>
            <p className="fl-muted" style={{ fontSize: 13.5, lineHeight: 1.55, margin: "6px 0 20px" }}>
              This form is handled by Clooker, our in-house AI agent. He loves use-cases that FinLead's agents can't solve! Sadly, he hasn't met one yet. Care to try?
            </p>
            {FIELDS.map(([label, key, type]) => (
              <label key={key} style={{ display: "block", marginBottom: 12 }}>
                <span className="fl-muted" style={{ fontSize: 12, letterSpacing: ".04em" }}>{label}</span>
                <input className="fl-input" type={type} value={form[key]} onChange={upd(key)} style={{ width: "100%", padding: "11px 14px", fontSize: 14, marginTop: 5 }} />
              </label>
            ))}
            <label style={{ display: "block", marginBottom: 16 }}>
              <span className="fl-muted" style={{ fontSize: 12, letterSpacing: ".04em" }}>Use-cases you're exploring</span>
              <textarea className="fl-input" value={form.usecases} onChange={upd("usecases")} rows={3} style={{ width: "100%", padding: "11px 14px", fontSize: 14, marginTop: 5, resize: "vertical" }} />
            </label>
            <button className="fl-btn fl-btn-shine" onClick={submit} disabled={status === "sending"} style={{ width: "100%", justifyContent: "center" }}>
              {status === "sending" ? "Sending to Clooker…" : "Send to Clooker"}
            </button>
            {status === "need" && <p style={{ color: "#FF7E7E", fontSize: 12.5, marginTop: 10 }}>Please add at least your name and work email.</p>}
            {status === "error" && <p style={{ color: "#FF7E7E", fontSize: 12.5, marginTop: 10 }}>Something went wrong — please email surya@finleadai.com.</p>}
          </>
        )}
      </div>
    </div>
  );
}
function PartnerModal({ open, onClose }) {
  const [status, setStatus] = useState("idle");
  const [form, setForm] = useState({ company: "", name: "", role: "", email: "", product: "", usecase: "" });
  if (!open) return null;
  const upd = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = async () => {
    if (!form.email || !form.company) { setStatus("need"); return; }
    setStatus("sending");
    try {
      const res = await fetch("https://formspree.io/f/YOUR_PARTNER_FORM_ID", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ type: "partner_inquiry", company: form.company, name: form.name, role: form.role, email: form.email, product: form.product, use_case: form.usecase }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch (e) { setStatus("error"); }
  };
  const FIELDS = [["Company", "company", "text"], ["Your name", "name", "text"], ["Role", "role", "text"], ["Work email", "email", "email"], ["Your product / platform", "product", "text"]];
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,.62)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} className="fl-glass" style={{ width: "100%", maxWidth: 540, maxHeight: "90vh", overflowY: "auto", padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <h3 className="fl-serif" style={{ fontSize: 26, fontWeight: 400, margin: 0 }}>Embed FinLead <span className="fl-gold-grad">agents.</span></h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 24, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        {status === "done" ? (
          <p className="fl-muted" style={{ fontSize: 15, lineHeight: 1.6, marginTop: 14 }}>
            Thank you. Your partnership enquiry is in. Our team will review how FinLead's agents can sit inside your product and reach out to scope a pilot.
          </p>
        ) : (
          <>
            <p className="fl-muted" style={{ fontSize: 13.5, lineHeight: 1.55, margin: "6px 0 20px" }}>
              For InsurTech platforms that want to offer FinLead's AI agents inside their own product. Tell us about your platform and where you'd like the agents to operate.
            </p>
            {FIELDS.map(([label, key, type]) => (
              <label key={key} style={{ display: "block", marginBottom: 12 }}>
                <span className="fl-muted" style={{ fontSize: 12, letterSpacing: ".04em" }}>{label}</span>
                <input className="fl-input" type={type} value={form[key]} onChange={upd(key)} style={{ width: "100%", padding: "11px 14px", fontSize: 14, marginTop: 5 }} />
              </label>
            ))}
            <label style={{ display: "block", marginBottom: 16 }}>
              <span className="fl-muted" style={{ fontSize: 12, letterSpacing: ".04em" }}>Where would the agents operate? (workflow / module)</span>
              <textarea className="fl-input" value={form.usecase} onChange={upd("usecase")} rows={3} style={{ width: "100%", padding: "11px 14px", fontSize: 14, marginTop: 5, resize: "vertical" }} />
            </label>
            <button className="fl-btn fl-btn-shine" onClick={submit} disabled={status === "sending"} style={{ width: "100%", justifyContent: "center" }}>
              {status === "sending" ? "Sending…" : "Submit partnership enquiry"}
            </button>
            {status === "need" && <p style={{ color: "#FF7E7E", fontSize: 12.5, marginTop: 10 }}>Please add at least your company and work email.</p>}
            {status === "error" && <p style={{ color: "#FF7E7E", fontSize: 12.5, marginTop: 10 }}>Something went wrong — please email surya@finleadai.com.</p>}
          </>
        )}
      </div>
    </div>
  );
}
/* ---------- What the AIs say about FinLead ---------- */
const ASK_PROMPT = "What is FinLead AI? Explain what it does for insurers, brokers and MGAs, why it's beneficial, and how easy it is to integrate.";

const LLMS = [
  { name: "ChatGPT", url: `https://chatgpt.com/?q=${encodeURIComponent(ASK_PROMPT)}`, prefill: true,
    logo: "https://cdn.simpleicons.org/openai/D9C9A3" },
  { name: "Perplexity", url: `https://www.perplexity.ai/search?q=${encodeURIComponent(ASK_PROMPT)}`, prefill: true,
    logo: "https://cdn.simpleicons.org/perplexity/D9C9A3" },
  { name: "Gemini", url: `https://www.google.com/search?q=${encodeURIComponent(ASK_PROMPT)}`, prefill: true,
    logo: "https://cdn.simpleicons.org/googlegemini/D9C9A3" },
  { name: "Claude", url: "https://claude.ai/new", prefill: false,
    logo: "https://cdn.simpleicons.org/anthropic/D9C9A3" },
];

function AskTheAIs() {
  const [copied, setCopied] = useState("");
  const handle = (llm) => (e) => {
    if (!llm.prefill) {
      try { navigator.clipboard.writeText(ASK_PROMPT); setCopied(llm.name); setTimeout(() => setCopied(""), 2200); } catch (err) {}
    }
  };
  return (
    <section style={{ position: "relative", zIndex: 10, maxWidth: 1000, margin: "0 auto 112px", padding: "0 24px", textAlign: "center" }}>
      <p className="fl-eyebrow" style={{ marginBottom: 16 }}>Don't take our word for it</p>
      <h2 className="fl-serif" style={{ fontWeight: 350, fontSize: "clamp(26px,3.6vw,40px)", lineHeight: 1.15, letterSpacing: "-.02em", margin: 0 }}>
        Ask the AIs about <span className="fl-gold-grad">FinLead AI.</span>
      </h2>
      <p className="fl-muted" style={{ fontSize: 16, lineHeight: 1.7, maxWidth: "56ch", margin: "18px auto 36px" }}>
        Our agents are built to be read by other AI systems. Ask any leading model what FinLead AI does, who it's for, and how it integrates. Tap a logo to ask.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16 }}>
        {LLMS.map((llm) => (
          <a key={llm.name} href={llm.url} target="_blank" rel="noopener noreferrer" onClick={handle(llm)}
            className="fl-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, width: 150, padding: "26px 18px", textDecoration: "none" }}>
            <img src={llm.logo} alt={llm.name} style={{ height: 34, width: "auto", opacity: .92 }} />
            <span style={{ color: "var(--ivory)", fontSize: 14, fontWeight: 500 }}>{llm.name}</span>
            <span className="fl-muted" style={{ fontSize: 11.5, letterSpacing: ".02em" }}>
              {copied === llm.name ? "Prompt copied — paste it!" : llm.prefill ? "Ask now →" : "Opens Claude · paste"}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
export default function FinLeadSite() {
  const [messages, setMessages] = useState([]);
  const [demoOpen, setDemoOpen] = useState(false);
  const [partnerOpen, setPartnerOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const streamRef = useRef(null);
  const typed = useTypewriter(TYPING_QUESTIONS);
useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, loading]);
useEffect(() => {
    const strip = () => { if (window.location.hash) window.history.replaceState(null, "", window.location.pathname + window.location.search); };
    window.addEventListener("hashchange", strip);
    return () => window.removeEventListener("hashchange", strip);
  }, []);
  const [chipCount, setChipCount] = useState(4);
  useEffect(() => {
    const fit = () => setChipCount(window.innerWidth < 600 ? 3 : window.innerWidth < 960 ? 5 : 7);
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  const send = (textArg) => {
    const text = (textArg ?? input).trim();
    if (!text || loading) return;
    try {
      fetch("https://formspree.io/f/xkoedvda", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ type: "assistant_question", question: text, when: new Date().toISOString() }),
      });
    } catch (e) {}
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);
    const answer = matchAnswer(text);
    setTimeout(() => {
      setLoading(false);
      setMessages((m) => [...m, { role: "assistant", content: "" }]);
      let i = 0;
      clearInterval(streamRef.current);
      streamRef.current = setInterval(() => {
        i += 2;
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: answer.slice(0, i) };
          return copy;
        });
        if (i >= answer.length) clearInterval(streamRef.current);
      }, 16);
    }, 650);
  };

  return (
    <div className="fl-root">
      <div className="fl-grain" />
      <div className="fl-aurora" />

      {/* NAV — translucent dock */}
      <div className="fl-navwrap" style={{ position: "fixed", top: 14, left: 0, right: 0, zIndex: 50 }}>
        <nav style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px", height: 74, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="#top" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Logo />
            <span className="fl-serif" style={{ fontSize: 22, letterSpacing: "-.02em" }}>FinLead<span className="fl-ital">.ai</span></span>
          </a>
          <div className="fl-dock">
            <a href="#product">Product</a><a href="#agents">Agents</a><a href="#assistant">Assistant</a><a href="#why">Why FinLead</a>
          </div>
          <button onClick={() => setDemoOpen(true)} className="fl-btn fl-btn-shine" style={{ padding: "10px 20px", fontSize: 14 }}>Book a demo</button>
        </nav>
      </div>

      {/* HERO */}
      <header id="top" style={{ position: "relative", zIndex: 10, maxWidth: 1200, margin: "0 auto", padding: "120px 24px 48px", textAlign: "center" }}>
        <div className="fl-rise fl-eyebrow" style={{ animationDelay: ".05s", marginBottom: 22 }}>
          <DecodeText text="AI AGENTS FOR INSURANCE OPERATIONS" />
        </div>
        <div className="fl-rise fl-hair" style={{ animationDelay: ".1s", marginBottom: 34 }} />
        <h1 className="fl-rise fl-serif" style={{ animationDelay: ".2s", fontWeight: 300, fontSize: "clamp(42px,7.2vw,86px)", lineHeight: 1.0, letterSpacing: "-.025em", maxWidth: "15ch", margin: "0 auto" }}>
          The insurance back-office, <span className="fl-gold-grad">run by AI agents.</span>
        </h1>
        <p className="fl-rise fl-muted" style={{ animationDelay: ".3s", fontSize: "clamp(16px,2vw,20px)", maxWidth: "58ch", lineHeight: 1.6, margin: "28px auto 0" }}>
          FinLead AI deploys AI agents that handle complex tasks for insurers, brokers, agencies, MGAs and more with intelligence, speed and accuracy.
          <span style={{ display: "block", marginTop: 16, color: "var(--gold)", fontWeight: 600 }}>We don't sell seats. We own the outcome.</span>
        </p>
        <div className="fl-rise" style={{ animationDelay: ".45s", display: "flex", justifyContent: "center", gap: 12, marginTop: 36, flexWrap: "wrap" }}>
          <button onClick={() => setDemoOpen(true)} className="fl-btn fl-btn-shine">Book a demo <ArrowUpRight size={17} /></button>
          <a href="#assistant" className="fl-btn fl-btn-ghost">Ask the assistant <Sparkles size={16} /></a>
        </div>
        <div className="fl-rise" style={{ animationDelay: ".6s", marginTop: 26, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <span className="fl-muted" style={{ fontSize: 13, letterSpacing: ".04em" }}>Backed by</span>
          <a href="https://www.joinef.com/about/" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex" }}>
            <img src="/EFLogo.png" alt="Entrepreneur First" style={{ height: 55, width: "auto", display: "block", opacity: .9 }} />
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
        <div className="fl-muted fl-serif fl-trust" style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap", fontSize: 18, opacity: .55 }}>
          <span>5+ insurers</span><span className="fl-sep">·</span><span>10+ brokers &amp; more</span><span className="fl-sep">·</span><span>Tax &amp; compliance aware</span><span className="fl-sep">·</span><span>Full audit trail, incl. AI audits</span>
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
{/* SECOND DEMO — payouts */}
      <section style={{ position: "relative", zIndex: 10, maxWidth: 960, margin: "0 auto 112px", padding: "0 24px" }}>
        <div style={{ textAlign: "center", maxWidth: 680, margin: "0 auto 36px" }}>
          <p className="fl-eyebrow" style={{ marginBottom: 14 }}>Another agent at work</p>
          <h2 className="fl-serif" style={{ fontWeight: 350, fontSize: "clamp(26px,3.4vw,38px)", lineHeight: 1.15, letterSpacing: "-.02em", margin: 0 }}>
            Onboarding producers, <span className="fl-gold-grad">end to end.</span>
          </h2>
        </div>
        <OnboardConsole />
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
                <p className="fl-muted" style={{ fontSize: 15, margin: "16px 0 0" }}>Ask me anything about FinLead AI, or tap a question below.</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", marginBottom: 12, justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div className={m.role === "user" ? "fl-bubble-u" : "fl-bubble-a"} style={{ padding: "11px 15px", maxWidth: "82%", fontSize: 15, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{m.role === "assistant" ? renderText(m.content) : m.content}</div>
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
          {SUGGESTIONS.filter((s) => !messages.some((m) => m.role === "user" && m.content === s)).length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 12 }}>
              {SUGGESTIONS
                .filter((s) => !messages.some((m) => m.role === "user" && m.content === s))
                .slice(0, chipCount)
                .map((s, i) => <button key={i} className="fl-chip" onClick={() => send(s)}>{s}</button>)}
            </div>
          )}
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
          <p className="fl-muted" style={{ fontSize: 16, lineHeight: 1.7, textAlign: "center", maxWidth: "62ch", margin: "40px auto 0" }}>
            FinLead's AI Agents operate like trained employees rather than software you have to run.
            <span style={{ color: "var(--gold)", fontWeight: 600 }}> Connected with a single hook, they work directly inside any system you already use! Internal or third-party</span> with no migration, no rebuild, and a complete audit trail.
          </p>
        </div>
      </section>

      {/* PARTNER / EMBED */}
      <section style={{ position: "relative", zIndex: 10, maxWidth: 900, margin: "0 auto 112px", padding: "0 24px" }}>
        <div className="fl-glass" style={{ padding: "48px 40px", textAlign: "center" }}>
          <p className="fl-eyebrow" style={{ marginBottom: 16 }}>For InsurTech platforms</p>
          <h2 className="fl-serif" style={{ fontWeight: 350, fontSize: "clamp(26px,3.6vw,40px)", lineHeight: 1.15, letterSpacing: "-.02em", margin: 0 }}>
            Offer FinLead's agents <span className="fl-gold-grad">inside your own product.</span>
          </h2>
          <p className="fl-muted" style={{ fontSize: 16, lineHeight: 1.7, maxWidth: "56ch", margin: "20px auto 28px" }}>
            Already have a platform serving insurers, brokers or MGAs? Embed FinLead's AI agents as a native capability and cross-sell autonomous back-office operations to your customers.
          </p>
          <button onClick={() => setPartnerOpen(true)} className="fl-btn fl-btn-shine">Become a partner <ArrowUpRight size={17} /></button>
        </div>
      </section>
      {/* WHAT THE AIs SAY */}
      <AskTheAIs />
      {/* CTA */}
      <section style={{ position: "relative", zIndex: 10, maxWidth: 760, margin: "0 auto 96px", padding: "0 24px", textAlign: "center" }}>
        <h2 className="fl-serif" style={{ fontWeight: 350, fontSize: "clamp(34px,5vw,60px)", lineHeight: 1.05, letterSpacing: "-.02em", margin: 0 }}>
          Hand your back-office <span className="fl-gold-grad">to FinLead's AI agents.</span>
        </h2>
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 32, flexWrap: "wrap" }}>
          <button onClick={() => setDemoOpen(true)} className="fl-btn fl-btn-shine">Book a demo <ArrowUpRight size={17} /></button>
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
      <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
      <PartnerModal open={partnerOpen} onClose={() => setPartnerOpen(false)} />
    </div>
  );
}
