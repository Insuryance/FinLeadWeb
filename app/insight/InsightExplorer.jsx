"use client";
import React, { useState, useMemo } from "react";

/* ---------- formatting ---------- */
const inr = (n) => {
  if (n == null || isNaN(n)) return "-";
  if (n >= 100000) return "\u20B9" + (n / 100000).toFixed(2) + "\u2009L Cr";
  return "\u20B9" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 }) + "\u2009Cr";
};
const pct = (x) => (x == null || isNaN(x) ? "-" : (x * 100).toFixed(1) + "%");
const shortName = (s) =>
  s.replace(/ (General Insurance|Health Insurance|Insurance|Assurance|Co\.?|Company|Ltd\.?|Limited|of India)\b/gi, "")
    .replace(/\s+/g, " ").trim();
const trunc = (s, n) => (s.length > n ? s.slice(0, n - 1).trim() + "\u2026" : s);
const axisFmt = (n) => {
  const a = Math.abs(n);
  if (a >= 100000) return (n / 100000).toFixed(1).replace(/\.0$/, "") + "L";
  if (a >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return Math.round(n);
};
function niceMax(v) {
  if (v <= 0) return 1;
  const step = Math.pow(10, Math.floor(Math.log10(v)));
  const m = v / step;
  const nice = m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10;
  return nice * step;
}
const GROUPS = ["All", "General", "Standalone Health", "Specialised"];
const SERIES = ["#D9C9A3", "#94A7C7", "#A6B89C", "#C2A3B0"];
const GOLD = "#D9C9A3", GREEN = "#9BC4A0", RED = "#D69A9A";
const IXL = { fontSize: 10, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--muted2)", marginBottom: 9 };
function Kpi({ label, value, sub, name }) {
  return (
    <div style={{ background: "#0B0B0E", padding: "17px 20px" }}>
      <div style={{ fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--muted2)" }}>{label}</div>
      <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontVariantNumeric: "tabular-nums lining-nums", fontSize: name ? 16 : 24, color: "var(--ivory)", marginTop: 8, letterSpacing: "-.01em", lineHeight: name ? 1.25 : 1.08 }}>{value}</div>
      <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</div>
    </div>
  );
}

/* ---------- reusable horizontal bar chart (with axis + gridlines) ---------- */
function HBarChart({ items, valueFmt, tickFmt, colorFn, signed }) {
  const W = 760, labelW = 188, rightGut = 92;
  const plotL = labelW, plotR = W - rightGut, plotW = plotR - plotL;
  const axisTop = 26, rowH = 33, barH = 15;
  const n = items.length;
  const H = axisTop + n * rowH + 6;
  const vals = items.map((d) => d.value || 0);
  let vmin = Math.min(0, ...vals), vmax = Math.max(0, ...vals);
  vmax = niceMax(vmax || 1);
  vmin = vmin < 0 ? -niceMax(-vmin) : 0;
  const span = vmax - vmin || 1;
  const xOf = (v) => plotL + ((v - vmin) / span) * plotW;
  const zeroX = xOf(0);
  const ticks = 4;
  return (
    <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", height: "auto", overflow: "visible" }} role="img" aria-label="Bar chart">
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const v = vmin + (span / ticks) * i;
        const x = xOf(v);
        return (
          <g key={i}>
            <line x1={x} y1={axisTop - 6} x2={x} y2={H - 4} stroke="rgba(255,255,255,.05)" strokeWidth="1" />
            <text x={x} y={axisTop - 11} textAnchor="middle" fontSize="9.5" fill="#56534C" fontFamily="'Hanken Grotesk',sans-serif" style={{ fontVariantNumeric: "tabular-nums" }}>{tickFmt(v)}</text>
          </g>
        );
      })}
      {signed && <line x1={zeroX} y1={axisTop - 6} x2={zeroX} y2={H - 4} stroke="rgba(255,255,255,.18)" strokeWidth="1" />}
      {items.map((d, i) => {
        const v = d.value || 0;
        const y = axisTop + i * rowH;
        const cy = y + rowH / 2;
        const x = xOf(v);
        const bx = Math.min(zeroX, x), bw = Math.max(2, Math.abs(x - zeroX));
        const col = colorFn(v, d);
        return (
          <g key={d.key || d.label}>
            <text x={labelW - 12} y={cy + 4} textAnchor="end" fontSize="12.5" fill="#F4F1EA" fontFamily="'Hanken Grotesk',sans-serif">{trunc(d.label, 24)}</text>
            <rect x={bx} y={cy - barH / 2} width={bw} height={barH} rx="2" fill={col}>
              <title>{d.title}</title>
            </rect>
            <text x={W} y={cy + 4} textAnchor="end" fontSize="12.5" fill={signed ? col : "#F4F1EA"} fontFamily="'Fraunces',Georgia,serif" style={{ fontVariantNumeric: "tabular-nums" }}>{valueFmt(v)}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Segmented({ value, onChange, options }) {
  return (
    <div className="ix-seg">
      {options.map((o) => <button key={o.v ?? o} data-active={value === (o.v ?? o)} onClick={() => onChange(o.v ?? o)}>{o.l ?? o}</button>)}
    </div>
  );
}

/* ---------- root ---------- */
export default function InsightExplorer({ months }) {
  const [period, setPeriod] = useState(months[0].period);
  const month = months.find((m) => m.period === period) || months[0];
  const seg = month.bySheet["Segmentwise Report"];
  const [tab, setTab] = useState("leaderboard");
  const [group, setGroup] = useState("All");
  const rows = useMemo(() => seg.records.filter((r) => group === "All" || r.group === group), [seg, group]);

  // KPI computations
  const kpi = useMemo(() => {
    const total = rows.reduce((a, r) => a + (r.current["Grand Total"] || 0), 0);
    const ranked = [...rows].sort((a, b) => (b.current["Grand Total"] || 0) - (a.current["Grand Total"] || 0));
    const leader = ranked[0];
    const grower = [...rows].filter((r) => r.current["Growth %"] != null && (r.current["Grand Total"] || 0) >= 200)
      .sort((a, b) => b.current["Growth %"] - a.current["Growth %"])[0];
    return { total, count: rows.length, leader, grower };
  }, [rows]);

  return (
    <div>
      {/* filter bar */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 26, alignItems: "flex-end", justifyContent: "space-between", marginBottom: 30 }}>
        <div>
          <div style={IXL}>Insurer group</div>
          <Segmented value={group} onChange={setGroup} options={GROUPS} />
        </div>
        <div>
          <div style={IXL}>Period</div>
          {months.length > 1 ? (
            <select className="ix-select" value={period} onChange={(e) => setPeriod(e.target.value)}>
              {months.map((m) => <option key={m.period} value={m.period}>{m.label}</option>)}
            </select>
          ) : (
            <div style={{ color: "var(--ivory)", fontSize: 14, padding: "9px 2px" }}>{month.label}</div>
          )}
        </div>
      </div>

      {/* KPI strip (styling baked in, cannot collapse) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(168px,1fr))", gap: 1, background: "var(--line)", border: "1px solid var(--line)", borderRadius: 6, overflow: "hidden", marginBottom: 36 }}>
        <Kpi label={group === "All" ? "Industry GDPI" : "Segment GDPI"} value={inr(Math.round(kpi.total))} sub="gross direct premium" />
        <Kpi label="Insurers" value={String(kpi.count)} sub={group === "All" ? "writing premium" : group.toLowerCase()} />
        <Kpi label="Market leader" name value={kpi.leader ? trunc(shortName(kpi.leader.insurer), 18) : "-"} sub={kpi.leader ? inr(kpi.leader.current["Grand Total"]) + " \u00B7 " + pct(kpi.leader.current["Market %"]) : ""} />
        <Kpi label="Fastest grower" name value={kpi.grower ? trunc(shortName(kpi.grower.insurer), 18) : "-"} sub={kpi.grower ? pct(kpi.grower.current["Growth %"]) + " YoY" : ""} />
      </div>

      {/* view tabs */}
      <div className="ix-tabs">
        {[["leaderboard", "Leaderboard"], ["compare", "Compare"], ["segments", "Segments"], ["micro", "Micro analysis"]].map(([k, l]) => (
          <button key={k} className="ix-tab" data-active={tab === k} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      <div style={{ marginTop: 34 }}>
        {tab === "leaderboard" && <Leaderboard rows={rows} />}
        {tab === "compare" && <Compare rows={rows} allRows={seg.records} />}
        {tab === "segments" && <Segments rows={rows} segments={seg.segments} />}
        {tab === "micro" && <Micro month={month} group={group} />}
      </div>
    </div>
  );
}

/* ---------- 1. Leaderboard ---------- */
function Leaderboard({ rows }) {
  const [sortKey, setSortKey] = useState("Grand Total");
  const [all, setAll] = useState(false);
  const sorted = [...rows].sort((a, b) => (b.current[sortKey] ?? -1e9) - (a.current[sortKey] ?? -1e9));
  const shown = all ? sorted : sorted.slice(0, 15);
  const isPct = sortKey !== "Grand Total";
  const items = shown.map((r) => {
    const v = r.current[sortKey] || 0;
    return {
      key: r.insurer, label: r.insurer, value: v,
      title: shortName(r.insurer) + " \u00B7 " + (isPct ? pct(v) : inr(v)) +
        " \u00B7 " + pct(r.current["Growth %"]) + " growth \u00B7 " + pct(r.current["Market %"]) + " share",
    };
  });
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 22 }}>
        <p className="ix-charth" style={{ margin: 0 }}>Ranked by {sortKey === "Grand Total" ? "premium" : sortKey === "Growth %" ? "growth" : "market share"}</p>
        <Segmented value={sortKey} onChange={setSortKey}
          options={[{ v: "Grand Total", l: "Premium" }, { v: "Growth %", l: "Growth" }, { v: "Market %", l: "Market share" }]} />
      </div>
      <HBarChart items={items}
        valueFmt={(v) => (isPct ? pct(v) : inr(v))}
        tickFmt={(v) => (isPct ? (v * 100).toFixed(0) + "%" : axisFmt(v))}
        colorFn={(v) => (isPct ? (v >= 0 ? GREEN : RED) : GOLD)} signed={isPct} />
      {sorted.length > 15 && (
        <button className="ix-toggle" onClick={() => setAll((a) => !a)}>{all ? "Show top 15" : "Show all " + sorted.length}</button>
      )}
    </div>
  );
}

/* ---------- 2. Compare (grouped vertical bars) ---------- */
const COMPARE_SEGS = [
  ["Grand Total", "Total"], ["Fire", "Fire"], ["Motor Total", "Motor"], ["Health", "Health"],
  ["Marine Total", "Marine"], ["Engineering", "Eng."], ["Liability", "Liab."],
];
function Compare({ rows, allRows }) {
  const [picked, setPicked] = useState(() => rows.slice(0, 3).map((r) => r.insurer));
  const [hover, setHover] = useState(null);
  const toggle = (name) => setPicked((p) => (p.includes(name) ? p.filter((x) => x !== name) : p.length < 4 ? [...p, name] : p));
  const chosen = picked.map((n) => allRows.find((r) => r.insurer === n)).filter(Boolean);

  const W = 820, H = 392, padL = 48, padR = 14, padT = 16, padB = 40;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const segs = COMPARE_SEGS;
  const maxVal = Math.max(...segs.flatMap(([k]) => chosen.map((c) => c.current[k] || 0)), 1);
  const top = niceMax(maxVal);
  const bandW = plotW / segs.length;
  const nSeries = Math.max(chosen.length, 1);
  const barW = Math.min(34, (bandW - bandW * 0.22) / nSeries);
  const gridlines = 4;

  return (
    <div>
      <p className="ix-charth">Premium by line of business \u00B7 grouped by insurer</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginBottom: 24 }}>
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
          <div className="ix-legend">
            {chosen.map((c, i) => (
              <span key={c.insurer}><span style={{ width: 11, height: 11, borderRadius: 2, background: SERIES[i % 4] }} />{shortName(c.insurer)}</span>
            ))}
          </div>
          <div style={{ position: "relative" }}>
            <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", height: "auto", overflow: "visible" }} role="img" aria-label="Grouped bar chart">
              <defs>
                {SERIES.map((c, i) => (
                  <linearGradient key={i} id={"ixg" + i} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={c} stopOpacity="0.95" />
                    <stop offset="100%" stopColor={c} stopOpacity="0.6" />
                  </linearGradient>
                ))}
              </defs>
              {Array.from({ length: gridlines + 1 }).map((_, i) => {
                const val = (top / gridlines) * i;
                const y = padT + plotH - (val / top) * plotH;
                return (
                  <g key={i}>
                    <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="rgba(255,255,255,.055)" strokeWidth="1" />
                    <text x={padL - 9} y={y + 3.5} textAnchor="end" fontSize="10" fill="#56534C" fontFamily="'Hanken Grotesk',sans-serif" style={{ fontVariantNumeric: "tabular-nums" }}>{axisFmt(val)}</text>
                  </g>
                );
              })}
              {segs.map(([key, label], si) => {
                const bx = padL + si * bandW;
                const startX = bx + (bandW - barW * nSeries) / 2;
                return (
                  <g key={key}>
                    {chosen.map((c, ci) => {
                      const v = c.current[key] || 0;
                      const h = (v / top) * plotH;
                      const x = startX + ci * barW;
                      const y = padT + plotH - h;
                      const isH = hover && hover.si === si && hover.ci === ci;
                      return (
                        <rect key={ci} x={x + 2} y={y} width={Math.max(barW - 4, 3)} height={Math.max(h, 0)} rx="2.5"
                          fill={"url(#ixg" + (ci % 4) + ")"} opacity={hover && !isH ? 0.5 : 1} style={{ cursor: "pointer", transition: "opacity .2s" }}
                          onMouseEnter={() => setHover({ si, ci, v, name: c.insurer })} onMouseLeave={() => setHover(null)}>
                          <title>{shortName(c.insurer) + " \u00B7 " + label + ": " + inr(v)}</title>
                        </rect>
                      );
                    })}
                    <text x={bx + bandW / 2} y={H - padB + 22} textAnchor="middle" fontSize="11.5" fill="#928E84" fontFamily="'Hanken Grotesk',sans-serif">{label}</text>
                  </g>
                );
              })}
              <line x1={padL} y1={padT + plotH} x2={W - padR} y2={padT + plotH} stroke="rgba(255,255,255,.16)" strokeWidth="1" />
            </svg>
            <div style={{ position: "absolute", top: 0, right: 0, textAlign: "right", minHeight: 32, pointerEvents: "none" }}>
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

/* ---------- 3. Segments ---------- */
const MAIN_SEGS = ["Fire", "Marine Total", "Engineering", "Motor Total", "Motor OD", "Motor TP", "Health", "Aviation", "Liability", "P.A."];
function Segments({ rows, segments }) {
  const avail = MAIN_SEGS.filter((s) => segments.includes(s));
  const [sname, setSname] = useState(avail[0] || "Motor Total");
  const [all, setAll] = useState(false);
  const ranked = [...rows].filter((r) => (r.current[sname] || 0) > 0).sort((a, b) => (b.current[sname] || 0) - (a.current[sname] || 0));
  const total = ranked.reduce((a, r) => a + (r.current[sname] || 0), 0);
  const shown = all ? ranked : ranked.slice(0, 15);
  const items = shown.map((r) => ({
    key: r.insurer, label: r.insurer, value: r.current[sname] || 0,
    title: shortName(r.insurer) + " \u00B7 " + inr(r.current[sname]) + " \u00B7 " + ((r.current[sname] / total) * 100).toFixed(1) + "% of total",
  }));
  return (
    <div>
      <p className="ix-charth">Premium by insurer within a line of business</p>
      <div className="ix-seg" style={{ flexWrap: "wrap", marginBottom: 22 }}>
        {avail.map((s) => <button key={s} data-active={sname === s} onClick={() => { setSname(s); setAll(false); }}>{s}</button>)}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 22, paddingBottom: 18, borderBottom: "1px solid var(--line)" }}>
        <span className="ix-num" style={{ fontSize: 28, color: "var(--gold)" }}>{inr(total)}</span>
        <span style={{ fontSize: 12.5, color: "var(--muted)" }}>total {sname} premium \u00B7 {ranked.length} insurers</span>
      </div>
      <HBarChart items={items} valueFmt={inr} tickFmt={axisFmt} colorFn={() => GOLD} />
      {ranked.length > 15 && (
        <button className="ix-toggle" onClick={() => setAll((a) => !a)}>{all ? "Show top 15" : "Show all " + ranked.length}</button>
      )}
    </div>
  );
}

/* ---------- 4. Micro analysis ---------- */
const MICRO = [
  { id: "motor", title: "Motor: Own Damage vs Third Party", tab: "Motor", sheet: "Segmentwise Report", parts: [["Motor OD", "Own Damage"], ["Motor TP", "Third Party"]] },
  { id: "marine", title: "Marine: Cargo vs Hull", tab: "Marine", sheet: "Segmentwise Report", parts: [["Marine Cargo", "Cargo"], ["Marine Hull", "Hull"]] },
  { id: "health", title: "Health: Retail vs Group vs Government", tab: "Health", sheet: "Health Portfolio", parts: [["Health-Retail", "Retail"], ["Health-Group", "Group"], ["Health-Government schemes", "Government"]] },
  { id: "liab", title: "Liability by cover type", tab: "Liability", sheet: "Liability Portfolio", parts: [["Workmen's compensation/Employers' liability", "Workmen's comp."], ["Public Liability (Act)", "Public (Act)"], ["Product Liability", "Product"], ["Other liability covers", "Other"]] },
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
      <p className="ix-charth">Sub-segment split within a line of business</p>
      <div className="ix-seg" style={{ flexWrap: "wrap", marginBottom: 24 }}>
        {MICRO.map((m) => <button key={m.id} data-active={mid === m.id} onClick={() => setMid(m.id)}>{m.tab}</button>)}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <span className="fl-serif" style={{ fontSize: 19, color: "var(--ivory)", fontWeight: 350 }}>{cfg.title}</span>
        <div className="ix-legend" style={{ marginBottom: 0 }}>
          {cfg.parts.map((p, i) => (
            <span key={p[0]} style={{ color: "var(--muted)", fontSize: 11.5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: SERIES[i % 4] }} />{p[1]}</span>
          ))}
        </div>
      </div>
      <div style={{ position: "relative", marginBottom: 8 }}>
        <div style={{ position: "absolute", left: "50%", top: 0, bottom: 24, width: 1, background: "rgba(255,255,255,.07)" }} />
      </div>
      {withTotal.map((r) => (
        <div key={r.insurer} className="ix-row" style={{ padding: "11px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
            <span style={{ color: "var(--ivory)", fontSize: 13.5 }}>{r.insurer}</span>
            <span className="ix-num" style={{ fontSize: 14, color: "var(--muted)" }}>{inr(r._t)}</span>
          </div>
          <div style={{ display: "flex", height: 11, borderRadius: 3, overflow: "hidden", background: "rgba(255,255,255,.045)" }}>
            {cfg.parts.map((p, i) => {
              const w = r._t > 0 ? ((r.current[p[0]] || 0) / r._t) * 100 : 0;
              return <div key={p[0]} title={p[1] + ": " + inr(r.current[p[0]]) + " (" + w.toFixed(0) + "%)"} style={{ width: w + "%", background: SERIES[i % 4] }} />;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
