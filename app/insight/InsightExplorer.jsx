\"use client";
import React, { useState, useMemo } from "react";

/* ---------- helpers ---------- */
const inr = (n) => {
  if (n == null || isNaN(n)) return "-";
  if (n >= 100000) return "\u20B9" + (n / 100000).toFixed(2) + "\u2009L Cr";
  return "\u20B9" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 }) + "\u2009Cr";
};
const pct = (x) => (x == null || isNaN(x) ? "-" : (x * 100).toFixed(1) + "%");
const shortName = (s) =>
  s.replace(/ (General Insurance|Health Insurance|Insurance|Assurance|Co\.?|Company|Ltd\.?|Limited|of India)\b/gi, "").replace(/\s+/g, " ").trim();
const GROUPS = ["All", "General", "Standalone Health", "Specialised"];
const SERIES = ["#D9C9A3", "#94A7C7", "#A6B89C", "#C2A3B0"];
const GOLD = "#D9C9A3", GREEN = "#9BC4A0", RED = "#D69A9A";

function niceMax(v) {
  if (v <= 0) return 1;
  const step = Math.pow(10, Math.floor(Math.log10(v)));
  const m = v / step;
  const nice = m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10;
  return nice * step;
}
const axisFmt = (n) => (n >= 100000 ? (n / 100000).toFixed(1).replace(/\.0$/, "") + "L" : n >= 1000 ? Math.round(n / 1000) + "k" : Math.round(n));

function Tabs({ value, onChange, items }) {
  return (
    <div className="ix-tabs">
      {items.map(([k, label]) => (
        <button key={k} className="ix-tab" data-active={value === k} onClick={() => onChange(k)}>{label}</button>
      ))}
    </div>
  );
}
function Segmented({ value, onChange, options }) {
  return (
    <div className="ix-seg">
      {options.map((o) => <button key={o} data-active={value === o} onClick={() => onChange(o)}>{o}</button>)}
    </div>
  );
}

export default function InsightExplorer({ months }) {
  const [period, setPeriod] = useState(months[0].period);
  const month = months.find((m) => m.period === period) || months[0];
  const seg = month.bySheet["Segmentwise Report"];
  const [tab, setTab] = useState("leaderboard");
  const [group, setGroup] = useState("All");
  const rows = useMemo(() => seg.records.filter((r) => group === "All" || r.group === group), [seg, group]);

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", justifyContent: "space-between", marginBottom: 30 }}>
        <Segmented value={group} onChange={setGroup} options={GROUPS} />
        {months.length > 1 && (
          <select className="ix-select" value={period} onChange={(e) => setPeriod(e.target.value)}>
            {months.map((m) => <option key={m.period} value={m.period}>{m.label}</option>)}
          </select>
        )}
      </div>

      <Tabs value={tab} onChange={setTab} items={[
        ["leaderboard", "Leaderboard"], ["compare", "Compare"], ["segments", "Segments"], ["micro", "Micro analysis"],
      ]} />

      <div style={{ marginTop: 32 }}>
        {tab === "leaderboard" && <Leaderboard rows={rows} />}
        {tab === "compare" && <Compare rows={rows} allRows={seg.records} />}
        {tab === "segments" && <Segments rows={rows} segments={seg.segments} />}
        {tab === "micro" && <Micro month={month} group={group} />}
      </div>
    </div>
  );
}

function LedgerRow({ rank, name, figure, value, max, color = GOLD, sub, signed }) {
  const w = max > 0 ? Math.max(1.5, (Math.abs(value) / max) * 100) : 0;
  return (
    <div className="ix-row" style={{ display: "grid", gridTemplateColumns: "30px 1fr", gap: 16, padding: "13px 10px", alignItems: "center" }}>
      <span className="ix-num" style={{ fontSize: 17, color: "var(--muted2)", textAlign: "right" }}>{rank}</span>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 7 }}>
          <span style={{ color: "var(--ivory)", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
          <span className="ix-num" style={{ fontSize: 15, color: signed ? (value >= 0 ? GREEN : RED) : "var(--ivory)", whiteSpace: "nowrap" }}>{figure}</span>
        </div>
        <div style={{ height: 5, borderRadius: 99, background: "rgba(255,255,255,.045)", overflow: "hidden" }}>
          <div className="ix-bar-fill" style={{ width: w + "%", height: "100%", borderRadius: 99, background: "linear-gradient(90deg, " + color + ", " + color + "aa)" }} />
        </div>
        {sub && <div style={{ color: "var(--muted2)", fontSize: 11.5, marginTop: 6, letterSpacing: ".01em" }}>{sub}</div>}
      </div>
    </div>
  );
}

function Leaderboard({ rows }) {
  const [sortKey, setSortKey] = useState("Grand Total");
  const sorted = [...rows].sort((a, b) => (b.current[sortKey] ?? -1e9) - (a.current[sortKey] ?? -1e9));
  const max = Math.max(...sorted.map((r) => Math.abs(r.current[sortKey] || 0)), 1);
  const isPct = sortKey !== "Grand Total";
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, marginBottom: 22 }}>
        <span style={{ fontSize: 11, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--muted2)" }}>ranked by</span>
        <Segmented value={sortKey} onChange={setSortKey} options={["Grand Total", "Growth %", "Market %"]} />
      </div>
      {sorted.map((r, i) => {
        const v = r.current[sortKey] || 0;
        return <LedgerRow key={r.insurer} rank={i + 1} name={r.insurer}
          figure={isPct ? pct(v) : inr(v)} value={v} max={max} signed={isPct}
          color={isPct ? (v >= 0 ? GREEN : RED) : GOLD}
          sub={isPct ? null : pct(r.current["Growth %"]) + " growth   \u00B7   " + pct(r.current["Market %"]) + " market share"} />;
      })}
    </div>
  );
}

const COMPARE_SEGS = [
  ["Grand Total", "Total"], ["Fire", "Fire"], ["Motor Total", "Motor"], ["Health", "Health"],
  ["Marine Total", "Marine"], ["Engineering", "Eng."], ["Liability", "Liab."],
];
function Compare({ rows, allRows }) {
  const [picked, setPicked] = useState(() => rows.slice(0, 3).map((r) => r.insurer));
  const [hover, setHover] = useState(null);
  const toggle = (name) =>
    setPicked((p) => (p.includes(name) ? p.filter((x) => x !== name) : p.length < 4 ? [...p, name] : p));
  const chosen = picked.map((n) => allRows.find((r) => r.insurer === n)).filter(Boolean);

  const W = 820, H = 380, padL = 46, padR = 14, padT = 18, padB = 40;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const segs = COMPARE_SEGS;
  const maxVal = Math.max(...segs.flatMap(([k]) => chosen.map((c) => c.current[k] || 0)), 1);
  const top = niceMax(maxVal);
  const bandW = plotW / segs.length;
  const nSeries = Math.max(chosen.length, 1);
  const groupPad = bandW * 0.22;
  const barW = Math.min(34, (bandW - groupPad) / nSeries);
  const gridlines = 4;

  return (
    <div>
      <p style={{ color: "var(--muted)", fontSize: 13.5, marginTop: 0, marginBottom: 18, letterSpacing: ".01em" }}>
        Select up to four insurers. Bars are grouped by line of business so you can read each insurer against the others.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginBottom: 26 }}>
        {rows.map((r) => {
          const on = picked.includes(r.insurer);
          const idx = picked.indexOf(r.insurer);
          return (
            <button key={r.insurer} className="ix-chip" data-on={on} onClick={() => toggle(r.insurer)}>
              <span className="ix-dot" style={{ background: on ? SERIES[idx % 4] : undefined }} />
              {shortName(r.insurer)}
            </button>
          );
        })}
      </div>

      {chosen.length === 0 ? (
        <p style={{ color: "var(--muted2)", fontSize: 13.5 }}>Choose at least one insurer above to draw the chart.</p>
      ) : (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 18, marginBottom: 14 }}>
            {chosen.map((c, i) => (
              <span key={c.insurer} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "var(--ivory)" }}>
                <span style={{ width: 11, height: 11, borderRadius: 2, background: SERIES[i % 4] }} />{shortName(c.insurer)}
              </span>
            ))}
          </div>

          <div style={{ position: "relative" }}>
            <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", height: "auto", overflow: "visible" }} role="img"
              aria-label="Grouped bar chart comparing selected insurers by line of business">
              <defs>
                {SERIES.map((c, i) => (
                  <linearGradient key={i} id={"ixg" + i} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={c} stopOpacity="0.95" />
                    <stop offset="100%" stopColor={c} stopOpacity="0.62" />
                  </linearGradient>
                ))}
              </defs>

              {Array.from({ length: gridlines + 1 }).map((_, i) => {
                const val = (top / gridlines) * i;
                const y = padT + plotH - (val / top) * plotH;
                return (
                  <g key={i}>
                    <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="rgba(255,255,255,.06)" strokeWidth="1" />
                    <text x={padL - 9} y={y + 3.5} textAnchor="end" fontSize="10.5" fill="#56534C" fontFamily="'Hanken Grotesk',sans-serif" style={{ fontVariantNumeric: "tabular-nums" }}>{axisFmt(val)}</text>
                  </g>
                );
              })}

              {segs.map(([key, label], si) => {
                const bx = padL + si * bandW;
                const groupInner = barW * nSeries;
                const startX = bx + (bandW - groupInner) / 2;
                return (
                  <g key={key}>
                    {chosen.map((c, ci) => {
                      const v = c.current[key] || 0;
                      const h = (v / top) * plotH;
                      const x = startX + ci * barW;
                      const y = padT + plotH - h;
                      const isHover = hover && hover.si === si && hover.ci === ci;
                      return (
                        <rect key={ci} className="ix-bar-fill" x={x + 2} y={y} width={Math.max(barW - 4, 3)} height={Math.max(h, 0)}
                          rx="2.5" fill={"url(#ixg" + (ci % 4) + ")"} opacity={hover && !isHover ? 0.55 : 1}
                          onMouseEnter={() => setHover({ si, ci, v, name: c.insurer })} onMouseLeave={() => setHover(null)}
                          style={{ cursor: "pointer", transition: "opacity .25s" }}>
                          <title>{shortName(c.insurer) + " \u00B7 " + label + ": " + inr(v)}</title>
                        </rect>
                      );
                    })}
                    <text x={bx + bandW / 2} y={H - padB + 22} textAnchor="middle" fontSize="11.5" fill="#928E84" fontFamily="'Hanken Grotesk',sans-serif" letterSpacing=".02em">{label}</text>
                  </g>
                );
              })}

              <line x1={padL} y1={padT + plotH} x2={W - padR} y2={padT + plotH} stroke="rgba(255,255,255,.16)" strokeWidth="1" />
            </svg>

            <div style={{ position: "absolute", top: 0, right: 0, textAlign: "right", minHeight: 34, pointerEvents: "none" }}>
              {hover && (
                <div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{shortName(hover.name)}</div>
                  <div className="ix-num" style={{ fontSize: 18, color: "var(--ivory)" }}>{inr(hover.v)}</div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const MAIN_SEGS = ["Fire", "Marine Total", "Engineering", "Motor Total", "Motor OD", "Motor TP", "Health", "Aviation", "Liability", "P.A."];
function Segments({ rows, segments }) {
  const avail = MAIN_SEGS.filter((s) => segments.includes(s));
  const [sname, setSname] = useState(avail[0] || "Motor Total");
  const ranked = [...rows].filter((r) => (r.current[sname] || 0) > 0).sort((a, b) => (b.current[sname] || 0) - (a.current[sname] || 0));
  const total = ranked.reduce((a, r) => a + (r.current[sname] || 0), 0);
  const max = Math.max(...ranked.map((r) => r.current[sname] || 0), 1);
  return (
    <div>
      <p style={{ color: "var(--muted)", fontSize: 13.5, marginTop: 0, marginBottom: 18 }}>Choose a line of business to see who writes the most premium in it.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
        <div className="ix-seg" style={{ flexWrap: "wrap" }}>
          {avail.map((s) => <button key={s} data-active={sname === s} onClick={() => setSname(s)}>{s}</button>)}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 22, paddingBottom: 18, borderBottom: "1px solid var(--line)" }}>
        <span className="ix-num" style={{ fontSize: 28, color: "var(--gold)" }}>{inr(total)}</span>
        <span style={{ fontSize: 12.5, color: "var(--muted)", letterSpacing: ".02em" }}>total {sname} premium \u00B7 {ranked.length} insurers</span>
      </div>
      {ranked.map((r, i) => (
        <LedgerRow key={r.insurer} rank={i + 1} name={r.insurer} figure={inr(r.current[sname])}
          value={r.current[sname] || 0} max={max} color={GOLD}
          sub={((r.current[sname] / total) * 100).toFixed(1) + "% of shown total"} />
      ))}
    </div>
  );
}

const MICRO = [
  { id: "motor", title: "Motor \u2014 Own Damage vs Third Party", tab: "Motor", sheet: "Segmentwise Report", parts: [["Motor OD", "Own Damage"], ["Motor TP", "Third Party"]] },
  { id: "marine", title: "Marine \u2014 Cargo vs Hull", tab: "Marine", sheet: "Segmentwise Report", parts: [["Marine Cargo", "Cargo"], ["Marine Hull", "Hull"]] },
  { id: "health", title: "Health \u2014 Retail vs Group vs Government", tab: "Health", sheet: "Health Portfolio", parts: [["Health-Retail", "Retail"], ["Health-Group", "Group"], ["Health-Government schemes", "Government"]] },
  { id: "liab", title: "Liability \u2014 by cover type", tab: "Liability", sheet: "Liability Portfolio", parts: [["Workmen's compensation/Employers' liability", "Workmen's comp."], ["Public Liability (Act)", "Public (Act)"], ["Product Liability", "Product"], ["Other liability covers", "Other"]] },
];
function Micro({ month, group }) {
  const [mid, setMid] = useState("motor");
  const cfg = MICRO.find((m) => m.id === mid);
  const sheet = month.bySheet[cfg.sheet];
  const keys = cfg.parts.map((p) => p[0]);
  const rows = (sheet ? sheet.records : []).filter((r) => group === "All" || r.group === group);
  const withTotal = rows.map((r) => ({ ...r, _t: keys.reduce((a, k) => a + (r.current[k] || 0), 0) }))
    .filter((r) => r._t > 0).sort((a, b) => b._t - a._t).slice(0, 12);
  return (
    <div>
      <p style={{ color: "var(--muted)", fontSize: 13.5, marginTop: 0, marginBottom: 18 }}>Drill into sub-segments. Each row shows how an insurer's book splits within the chosen line.</p>
      <div className="ix-seg" style={{ flexWrap: "wrap", marginBottom: 26 }}>
        {MICRO.map((m) => <button key={m.id} data-active={mid === m.id} onClick={() => setMid(m.id)}>{m.tab}</button>)}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <span className="fl-serif" style={{ fontSize: 19, color: "var(--ivory)", fontWeight: 350 }}>{cfg.title}</span>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {cfg.parts.map((p, i) => (
            <span key={p[0]} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--muted)" }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: SERIES[i % 4] }} />{p[1]}
            </span>
          ))}
        </div>
      </div>
      {withTotal.map((r) => (
        <div key={r.insurer} className="ix-row" style={{ padding: "11px 10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
            <span style={{ color: "var(--ivory)", fontSize: 13.5 }}>{r.insurer}</span>
            <span className="ix-num" style={{ fontSize: 14, color: "var(--muted)" }}>{inr(r._t)}</span>
          </div>
          <div style={{ display: "flex", height: 9, borderRadius: 99, overflow: "hidden", background: "rgba(255,255,255,.045)" }}>
            {cfg.parts.map((p, i) => {
              const w = r._t > 0 ? ((r.current[p[0]] || 0) / r._t) * 100 : 0;
              return <div key={p[0]} title={p[1] + ": " + inr(r.current[p[0]])} style={{ width: w + "%", background: SERIES[i % 4] }} />;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
