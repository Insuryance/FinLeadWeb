"use client";
import React, { useState, useMemo } from "react";

/* ---------- helpers ---------- */
const inr = (n) => {
  if (n == null || isNaN(n)) return "-";
  // value is in ₹ crore
  if (n >= 100000) return "₹" + (n / 100000).toFixed(2) + " L Cr";
  return "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 }) + " Cr";
};
const pct = (x) => (x == null || isNaN(x) ? "-" : (x * 100).toFixed(1) + "%");
const GROUPS = ["All", "General", "Standalone Health", "Specialised"];
const GOLD = "#D9C9A3", GREEN = "#6FCF7F", RED = "#FF7E7E", BLUE = "#94A9E6";

function Bar({ value, max, color = GOLD, label, right, sub }) {
  const w = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5, gap: 10 }}>
        <span style={{ color: "var(--ivory)", fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
        <span style={{ color: "var(--muted)", fontSize: 12.5, whiteSpace: "nowrap" }}>{right}</span>
      </div>
      <div style={{ height: 8, borderRadius: 99, background: "rgba(255,255,255,.05)", overflow: "hidden" }}>
        <div style={{ width: w + "%", height: "100%", borderRadius: 99, background: color, transition: "width .6s cubic-bezier(.16,1,.3,1)" }} />
      </div>
      {sub && <div style={{ color: "var(--muted2)", fontSize: 11.5, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: "9px 18px", borderRadius: 999, cursor: "pointer", fontSize: 13.5, fontFamily: "inherit",
      border: "1px solid " + (active ? "rgba(217,201,163,.45)" : "var(--line)"),
      background: active ? "var(--gold-soft)" : "transparent",
      color: active ? "var(--ivory)" : "var(--muted)", transition: "all .25s",
    }}>{children}</button>
  );
}

export default function InsightExplorer({ months }) {
  // months: [{period,label,bySheet:{...}}] newest first
  const [period, setPeriod] = useState(months[0].period);
  const month = months.find((m) => m.period === period) || months[0];
  const seg = month.bySheet["Segmentwise Report"];

  const [tab, setTab] = useState("leaderboard");
  const [group, setGroup] = useState("All");

  const rows = useMemo(
    () => seg.records.filter((r) => group === "All" || r.group === group),
    [seg, group]
  );

  return (
    <div>
      {/* top filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 22 }}>
        {months.length > 1 && (
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="fl-input" style={{ padding: "9px 14px", fontSize: 13.5 }}>
            {months.map((m) => <option key={m.period} value={m.period}>{m.label}</option>)}
          </select>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {GROUPS.map((g) => <TabBtn key={g} active={group === g} onClick={() => setGroup(g)}>{g}</TabBtn>)}
        </div>
      </div>

      {/* view tabs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 26 }}>
        <TabBtn active={tab === "leaderboard"} onClick={() => setTab("leaderboard")}>Leaderboard</TabBtn>
        <TabBtn active={tab === "compare"} onClick={() => setTab("compare")}>Compare insurers</TabBtn>
        <TabBtn active={tab === "segments"} onClick={() => setTab("segments")}>Segment view</TabBtn>
        <TabBtn active={tab === "micro"} onClick={() => setTab("micro")}>Micro analysis</TabBtn>
      </div>

      {tab === "leaderboard" && <Leaderboard rows={rows} />}
      {tab === "compare" && <Compare rows={rows} allRows={seg.records} />}
      {tab === "segments" && <Segments rows={rows} segments={seg.segments} />}
      {tab === "micro" && <Micro month={month} group={group} />}
    </div>
  );
}

/* ---------- 1. Leaderboard ---------- */
function Leaderboard({ rows }) {
  const [sortKey, setSortKey] = useState("Grand Total");
  const SORTS = [["Grand Total", "Premium"], ["Growth %", "Growth"], ["Market %", "Market share"]];
  const sorted = [...rows].sort((a, b) => (b.current[sortKey] || -1e9) - (a.current[sortKey] || -1e9));
  const max = Math.max(...sorted.map((r) => Math.abs(r.current[sortKey] || 0)), 1);
  const isPct = sortKey !== "Grand Total";
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {SORTS.map(([k, lbl]) => <TabBtn key={k} active={sortKey === k} onClick={() => setSortKey(k)}>{lbl}</TabBtn>)}
      </div>
      {sorted.map((r) => {
        const v = r.current[sortKey] || 0;
        const color = isPct ? (v >= 0 ? GREEN : RED) : GOLD;
        return <Bar key={r.insurer} value={Math.abs(v)} max={max} color={color}
          label={r.insurer} right={isPct ? pct(v) : inr(v)}
          sub={isPct ? null : `${pct(r.current["Growth %"])} growth · ${pct(r.current["Market %"])} share`} />;
      })}
    </div>
  );
}

/* ---------- 2. Compare insurers ---------- */
const COMPARE_SEGS = ["Grand Total", "Fire", "Motor Total", "Health", "Marine Total", "Engineering", "Liability"];
function Compare({ rows, allRows }) {
  const [picked, setPicked] = useState(() => rows.slice(0, 3).map((r) => r.insurer));
  const toggle = (name) =>
    setPicked((p) => (p.includes(name) ? p.filter((x) => x !== name) : p.length < 4 ? [...p, name] : p));
  const chosen = allRows.filter((r) => picked.includes(r.insurer));
  const colors = [GOLD, BLUE, GREEN, "#E0A4C8"];
  return (
    <div>
      <p style={{ color: "var(--muted)", fontSize: 13.5, marginTop: 0 }}>Pick up to 4 insurers to compare (tap to add or remove).</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
        {rows.map((r) => {
          const on = picked.includes(r.insurer);
          return <button key={r.insurer} onClick={() => toggle(r.insurer)} className="fl-chip"
            style={{ borderColor: on ? "var(--gold-deep)" : "var(--line)", color: on ? "var(--ivory)" : "var(--muted)", background: on ? "var(--gold-soft)" : "transparent" }}>
            {r.insurer.replace(/ (General Insurance|Insurance|Co|Ltd|Limited|Company)\.?/g, "").trim()}
          </button>;
        })}
      </div>
      {chosen.length === 0 ? <p style={{ color: "var(--muted2)" }}>Select at least one insurer above.</p> :
        COMPARE_SEGS.map((sname) => {
          const max = Math.max(...chosen.map((c) => c.current[sname] || 0), 1);
          return (
            <div key={sname} style={{ marginBottom: 26 }}>
              <div style={{ color: "var(--gold)", fontSize: 13, letterSpacing: ".05em", textTransform: "uppercase", marginBottom: 10 }}>{sname}</div>
              {chosen.map((c, i) => <Bar key={c.insurer} value={c.current[sname] || 0} max={max} color={colors[i % 4]}
                label={c.insurer.replace(/ (General Insurance|Insurance|Co|Ltd|Limited|Company)\.?/g, "").trim()} right={inr(c.current[sname])} />)}
            </div>
          );
        })}
    </div>
  );
}

/* ---------- 3. Segment view ---------- */
const MAIN_SEGS = ["Fire", "Marine Total", "Engineering", "Motor Total", "Motor OD", "Motor TP", "Health", "Aviation", "Liability", "P.A."];
function Segments({ rows, segments }) {
  const avail = MAIN_SEGS.filter((s) => segments.includes(s));
  const [sname, setSname] = useState(avail[0] || "Motor Total");
  const ranked = [...rows].filter((r) => (r.current[sname] || 0) > 0).sort((a, b) => (b.current[sname] || 0) - (a.current[sname] || 0));
  const total = ranked.reduce((a, r) => a + (r.current[sname] || 0), 0);
  const max = Math.max(...ranked.map((r) => r.current[sname] || 0), 1);
  return (
    <div>
      <p style={{ color: "var(--muted)", fontSize: 13.5, marginTop: 0 }}>Choose a segment to see who writes the most premium in it.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 22 }}>
        {avail.map((s) => <TabBtn key={s} active={sname === s} onClick={() => setSname(s)}>{s}</TabBtn>)}
      </div>
      <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 16 }}>Total {sname} premium (shown insurers): <b style={{ color: "var(--ivory)" }}>{inr(total)}</b></div>
      {ranked.map((r) => <Bar key={r.insurer} value={r.current[sname] || 0} max={max} color={GOLD}
        label={r.insurer} right={inr(r.current[sname])}
        sub={`${((r.current[sname] / total) * 100).toFixed(1)}% of shown total`} />)}
    </div>
  );
}

/* ---------- 4. Micro analysis ---------- */
const MICRO = [
  { id: "motor", title: "Motor: Own Damage vs Third Party", sheet: "Segmentwise Report", parts: ["Motor OD", "Motor TP"], colors: [GOLD, BLUE] },
  { id: "marine", title: "Marine: Cargo vs Hull", sheet: "Segmentwise Report", parts: ["Marine Cargo", "Marine Hull"], colors: [GOLD, BLUE] },
  { id: "health", title: "Health: Retail vs Group vs Government", sheet: "Health Portfolio", parts: ["Health-Retail", "Health-Group", "Health-Government schemes"], colors: [GOLD, BLUE, GREEN] },
  { id: "liab", title: "Liability: by cover type", sheet: "Liability Portfolio", parts: ["Workmen's compensation/Employers' liability", "Public Liability (Act)", "Product Liability", "Other liability covers"], colors: [GOLD, BLUE, GREEN, "#E0A4C8"] },
];
function Micro({ month, group }) {
  const [mid, setMid] = useState("motor");
  const cfg = MICRO.find((m) => m.id === mid);
  const sheet = month.bySheet[cfg.sheet];
  const rows = sheet.records.filter((r) => (group === "All" || r.group === group));
  // rank insurers by the first part, show split
  const withTotal = rows.map((r) => ({ ...r, _t: cfg.parts.reduce((a, p) => a + (r.current[p] || 0), 0) }))
    .filter((r) => r._t > 0).sort((a, b) => b._t - a._t).slice(0, 12);
  return (
    <div>
      <p style={{ color: "var(--muted)", fontSize: 13.5, marginTop: 0 }}>Drill into sub-segments. Bars show each insurer's split within the chosen line.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
        {MICRO.map((m) => <TabBtn key={m.id} active={mid === m.id} onClick={() => setMid(m.id)}>{m.title.split(":")[0]}</TabBtn>)}
      </div>
      <div style={{ color: "var(--gold)", fontSize: 13, letterSpacing: ".04em", textTransform: "uppercase", marginBottom: 6 }}>{cfg.title}</div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20, fontSize: 12 }}>
        {cfg.parts.map((p, i) => <span key={p} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--muted)" }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: cfg.colors[i] }} />{p}</span>)}
      </div>
      {withTotal.map((r) => (
        <div key={r.insurer} style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ color: "var(--ivory)", fontSize: 13.5 }}>{r.insurer}</span>
            <span style={{ color: "var(--muted)", fontSize: 12.5 }}>{inr(r._t)}</span>
          </div>
          <div style={{ display: "flex", height: 10, borderRadius: 99, overflow: "hidden", background: "rgba(255,255,255,.05)" }}>
            {cfg.parts.map((p, i) => {
              const w = r._t > 0 ? ((r.current[p] || 0) / r._t) * 100 : 0;
              return <div key={p} title={`${p}: ${inr(r.current[p])}`} style={{ width: w + "%", background: cfg.colors[i] }} />;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
