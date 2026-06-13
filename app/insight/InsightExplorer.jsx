"use client";
import React, { useState, useMemo, useRef } from "react";

/* ---------- formatting ---------- */
const clean = (s) => (s == null ? "" : String(s).replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim());
const inr = (n) => {
  if (n == null || isNaN(n)) return "-";
  if (Math.abs(n) >= 100000) return "\u20B9" + (n / 100000).toFixed(2) + "\u2009L Cr";
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
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const GROUPS = ["All", "General", "Standalone Health", "Specialised"];
const SERIES = ["#D9C9A3", "#94A7C7", "#A6B89C", "#C2A3B0"];
const SERIES6 = ["#D9C9A3", "#94A7C7", "#A6B89C", "#C2A3B0", "#C9B07A", "#8FB8C4"];
const GOLD = "#D9C9A3", GREEN = "#9BC4A0", RED = "#D69A9A";
const IXL = { fontSize: 10, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--muted2)", marginBottom: 9 };

/* de-cumulate YTD into per-month premium (resets each April / financial year) */
function monthlySeries(monthsAsc, name, key) {
  const pts = []; let prevYtd = null, prevFY = null;
  for (const m of monthsAsc) {
    const recs = m.bySheet["Segmentwise Report"].records;
    const rec = recs.find((r) => clean(r.insurer) === name);
    const ytd = rec ? (rec.current[key] == null ? null : rec.current[key]) : null;
    const cm = +m.period.slice(5, 7);
    const fy = cm >= 4 ? +m.period.slice(0, 4) : +m.period.slice(0, 4) - 1;
    let val;
    if (ytd == null) val = null;
    else if (cm === 4) val = ytd;                         // financial-year start
    else if (prevYtd != null && prevFY === fy) val = ytd - prevYtd;
    else val = ytd;
    pts.push({ period: m.period, label: m.label, value: val });
    prevYtd = ytd; prevFY = fy;
  }
  return pts;
}

/* weighted moving average of the last up-to-3 values (recent weighted most) */
function wma(vals) {
  const v = vals.slice(-3);
  if (!v.length) return null;
  const w = v.map((_, i) => i + 1);
  const sw = w.reduce((a, b) => a + b, 0);
  return v.reduce((a, x, i) => a + x * w[i], 0) / sw;
}
function nextMonthLabel(period) {
  let y = +period.slice(0, 4), m = +period.slice(5, 7) + 1;
  if (m > 12) { m = 1; y++; }
  return MON[m - 1] + " " + y;
}
function monthLabelP(period) { return MON[(+period.slice(5, 7)) - 1] + " " + period.slice(0, 4); }

/* forward projection + backward accuracy for one insurer (Grand Total, monthly) */
function computeIntel(monthsAsc, name) {
  const pts = monthlySeries(monthsAsc, name, "Grand Total").filter((p) => p.value != null);
  const vals = pts.map((p) => p.value);
  if (vals.length < 4) return null;
  const lastActual = vals[vals.length - 1];
  const projNext = wma(vals);
  const mom = [];
  for (let i = Math.max(1, vals.length - 3); i < vals.length; i++) mom.push(vals[i] / vals[i - 1] - 1);
  const mw = mom.map((_, i) => i + 1);
  const wmom = mom.length ? mom.reduce((a, x, i) => a + x * mw[i], 0) / mw.reduce((a, b) => a + b, 0) : 0;
  let bt = pts.length - 1;
  if (+pts[bt].period.slice(5, 7) === 4 && bt > 0) bt--; // skip financial-year reset month
  let predicted = null, actual = null, variance = null, btLabel = null;
  if (bt >= 3) {
    predicted = wma(vals.slice(bt - 3, bt));
    actual = vals[bt];
    variance = (actual - predicted) / predicted;
    btLabel = monthLabelP(pts[bt].period);
  }
  return { lastActual, projNext, wmom, predicted, actual, variance, btLabel };
}

function Stat({ label, value, sub, delta }) {
  const up = delta != null && delta >= 0;
  return (
    <div style={{ background: "#0B0B0E", border: "1px solid var(--line)", borderRadius: 5, padding: "12px 14px" }}>
      <div style={{ fontSize: 9.5, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted2)" }}>{label}</div>
      <div className="ix-num" style={{ fontSize: 18, color: "var(--ivory)", marginTop: 6 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>{sub}</div>}
      {delta != null && <div style={{ fontSize: 12, color: up ? GREEN : RED, marginTop: 5 }}>{(up ? "\u25B2 +" : "\u25BC ") + (delta * 100).toFixed(1) + "%"}</div>}
    </div>
  );
}
function Intelligence({ rows, monthsAsc }) {
  if (monthsAsc.length < 4) return <p style={{ color: "var(--muted2)", fontSize: 13.5 }}>Add at least four months of data to generate projections.</p>;
  const top = [...rows].sort((a, b) => (b.current["Grand Total"] || 0) - (a.current["Grand Total"] || 0)).slice(0, 12);
  const nextLabel = nextMonthLabel(monthsAsc[monthsAsc.length - 1].period);
  return (
    <div>
      <p className="ix-charth" style={{ marginBottom: 8 }}>Weighted projection and last-month accuracy</p>
      <p style={{ color: "var(--muted2)", fontSize: 11.5, marginBottom: 24, lineHeight: 1.5 }}>Estimates use a weighted moving average on monthly premium, with recent months counting more. Directional only.</p>
      {top.map((r) => {
        const I = computeIntel(monthsAsc, clean(r.insurer));
        if (!I) return null;
        return (
          <div key={r.insurer} style={{ padding: "16px 12px", borderTop: "1px solid var(--line)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12, gap: 12 }}>
              <span style={{ color: "var(--ivory)", fontSize: 14 }}>{r.insurer}</span>
              <span className="ix-num" style={{ fontSize: 14, color: "var(--muted)" }}>{inr(I.lastActual)}<span style={{ fontSize: 10.5, color: "var(--muted2)" }}> last month</span></span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
              <Stat label={"Projected " + nextLabel} value={inr(Math.round(I.projNext))} delta={I.wmom} />
              <Stat label={I.btLabel ? I.btLabel + " \u00B7 predicted vs actual" : "predicted vs actual"} value={I.predicted != null ? inr(Math.round(I.actual)) : "-"} sub={I.predicted != null ? "model expected " + inr(Math.round(I.predicted)) : ""} delta={I.variance} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Kpi({ label, value, sub, name }) {
  return (
    <div style={{ background: "#0B0B0E", padding: "17px 20px" }}>
      <div style={{ fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--muted2)" }}>{label}</div>
      <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontVariantNumeric: "tabular-nums lining-nums", fontSize: name ? 16 : 24, color: "var(--ivory)", marginTop: 8, letterSpacing: "-.01em", lineHeight: name ? 1.25 : 1.08 }}>{value}</div>
      <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</div>
    </div>
  );
}
function Segmented({ value, onChange, options }) {
  return (
    <div className="ix-seg">
      {options.map((o) => <button key={o.v ?? o} data-active={value === (o.v ?? o)} onClick={() => onChange(o.v ?? o)}>{o.l ?? o}</button>)}
    </div>
  );
}

/* ---------- horizontal bar chart ---------- */
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
        const v = vmin + (span / ticks) * i; const x = xOf(v);
        return (
          <g key={i}>
            <line x1={x} y1={axisTop - 6} x2={x} y2={H - 4} stroke="rgba(255,255,255,.05)" strokeWidth="1" />
            <text x={x} y={axisTop - 11} textAnchor="middle" fontSize="9.5" fill="#56534C" fontFamily="'Hanken Grotesk',sans-serif" style={{ fontVariantNumeric: "tabular-nums" }}>{tickFmt(v)}</text>
          </g>
        );
      })}
      {signed && <line x1={zeroX} y1={axisTop - 6} x2={zeroX} y2={H - 4} stroke="rgba(255,255,255,.18)" strokeWidth="1" />}
      {items.map((d, i) => {
        const v = d.value || 0; const y = axisTop + i * rowH; const cy = y + rowH / 2;
        const x = xOf(v); const bx = Math.min(zeroX, x), bw = Math.max(2, Math.abs(x - zeroX));
        const col = colorFn(v, d);
        return (
          <g key={d.key || d.label}>
            <text x={labelW - 12} y={cy + 4} textAnchor="end" fontSize="12.5" fill="#F4F1EA" fontFamily="'Hanken Grotesk',sans-serif">{trunc(d.label, 24)}</text>
            <rect x={bx} y={cy - barH / 2} width={bw} height={barH} rx="2" fill={col}><title>{d.title}</title></rect>
            <text x={W} y={cy + 4} textAnchor="end" fontSize="12.5" fill={signed ? col : "#F4F1EA"} fontFamily="'Fraunces',Georgia,serif" style={{ fontVariantNumeric: "tabular-nums" }}>{valueFmt(v)}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- multi-series line chart (over time) with hover readout ---------- */
function MultiLineChart({ series, axisMonths }) {
  const W = 820, H = 388, padL = 54, padR = 18, padT = 16, padB = 50;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const n = axisMonths.length;
  const xOf = (i) => (n <= 1 ? padL + plotW / 2 : padL + (i / (n - 1)) * plotW);
  const allVals = series.flatMap((s) => s.points.map((p) => p.value).filter((v) => v != null));
  const vmax = niceMax(Math.max(1, ...allVals));
  let vmin = Math.min(0, ...allVals); vmin = vmin < 0 ? -niceMax(-vmin) : 0;
  const span = vmax - vmin || 1;
  const yOf = (v) => padT + plotH - ((v - vmin) / span) * plotH;
  const ticks = 4;
  const [hi, setHi] = useState(null);
  const boxRef = useRef(null);

  const onMove = (e) => {
    const r = boxRef.current.getBoundingClientRect();
    const vbx = ((e.clientX - r.left) / r.width) * W;
    let i = Math.round(((vbx - padL) / plotW) * (n - 1));
    i = Math.max(0, Math.min(n - 1, i));
    setHi(i);
  };

  return (
    <div ref={boxRef} style={{ position: "relative" }} onMouseMove={onMove} onMouseLeave={() => setHi(null)}>
      <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", height: "auto", overflow: "visible" }} role="img" aria-label="Line chart over time">
        {Array.from({ length: ticks + 1 }).map((_, i) => {
          const v = vmin + (span / ticks) * i; const y = yOf(v);
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="rgba(255,255,255,.055)" strokeWidth="1" />
              <text x={padL - 10} y={y + 3.5} textAnchor="end" fontSize="10" fill="#56534C" fontFamily="'Hanken Grotesk',sans-serif" style={{ fontVariantNumeric: "tabular-nums" }}>{axisFmt(v)}</text>
            </g>
          );
        })}
        {axisMonths.map((m, i) => {
          const cm = +m.period.slice(5, 7); const x = xOf(i);
          const showYear = cm === 4 || i === 0;
          return (
            <g key={m.period}>
              <text x={x} y={H - padB + 19} textAnchor="middle" fontSize="9.5" fill={hi === i ? "#F4F1EA" : "#928E84"} fontFamily="'Hanken Grotesk',sans-serif">{MON[cm - 1]}</text>
              {showYear && <text x={x} y={H - padB + 32} textAnchor="middle" fontSize="9" fill="#56534C" fontFamily="'Hanken Grotesk',sans-serif">{"\u2019" + m.period.slice(2, 4)}</text>}
            </g>
          );
        })}
        <line x1={padL} y1={padT + plotH} x2={W - padR} y2={padT + plotH} stroke="rgba(255,255,255,.16)" strokeWidth="1" />
        {hi != null && <line x1={xOf(hi)} y1={padT} x2={xOf(hi)} y2={padT + plotH} stroke="rgba(217,201,163,.35)" strokeWidth="1" strokeDasharray="3 3" />}
        {series.map((s) => {
          let d = ""; let started = false;
          s.points.forEach((p, i) => {
            if (p.value == null) { started = false; return; }
            d += (started ? " L " : " M ") + xOf(i).toFixed(1) + " " + yOf(p.value).toFixed(1);
            started = true;
          });
          return (
            <g key={s.name}>
              <path d={d} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" opacity={hi != null ? 0.9 : 1} />
              {s.points.map((p, i) => p.value == null ? null : (
                <circle key={i} cx={xOf(i)} cy={yOf(p.value)} r={hi === i ? 4.5 : 3} fill="#0B0B0E" stroke={s.color} strokeWidth={hi === i ? 2.2 : 1.6} />
              ))}
            </g>
          );
        })}
      </svg>

      {/* hover readout */}
      {hi != null && (
        <div style={{ position: "absolute", top: 0, right: 0, background: "rgba(13,13,17,.9)", border: "1px solid var(--line)", borderRadius: 8, padding: "10px 13px", pointerEvents: "none", backdropFilter: "blur(10px)", minWidth: 150 }}>
          <div style={{ fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted2)", marginBottom: 8 }}>
            {MON[(+axisMonths[hi].period.slice(5, 7)) - 1] + " " + axisMonths[hi].period.slice(0, 4)}
          </div>
          {[...series].sort((a, b) => (b.points[hi]?.value || 0) - (a.points[hi]?.value || 0)).map((s) => (
            <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: s.color, flex: "none" }} />
              <span style={{ fontSize: 12, color: "var(--ivory)", flex: 1, whiteSpace: "nowrap" }}>{s.name}</span>
              <span className="ix-num" style={{ fontSize: 12.5, color: "var(--ivory)" }}>{inr(s.points[hi]?.value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChartTypeToggle({ value, onChange }) {
  return <Segmented value={value} onChange={onChange} options={[{ v: "bar", l: "Bar Graph" }, { v: "line", l: "Line Graph" }]} />;
}
function LineCaption() {
  return <p style={{ color: "var(--muted2)", fontSize: 11.5, marginTop: 14, lineHeight: 1.5 }}>Line shows monthly premium derived from the year-to-date figures, so each point is the premium written in that month. The financial year resets every April.</p>;
}

/* ---------- root ---------- */
export default function InsightExplorer({ months }) {
  const monthsAsc = useMemo(() => [...months].sort((a, b) => (a.period < b.period ? -1 : 1)), [months]);
  const [period, setPeriod] = useState(months[0].period);
  const month = months.find((m) => m.period === period) || months[0];
  const seg = month.bySheet["Segmentwise Report"];
  const [tab, setTab] = useState("leaderboard");
  const [group, setGroup] = useState("All");
  const [chartType, setChartType] = useState("bar");
  const rows = useMemo(() => seg.records.filter((r) => group === "All" || r.group === group), [seg, group]);

  const kpi = useMemo(() => {
    const total = rows.reduce((a, r) => a + (r.current["Grand Total"] || 0), 0);
    const ranked = [...rows].sort((a, b) => (b.current["Grand Total"] || 0) - (a.current["Grand Total"] || 0));
    const grower = [...rows].filter((r) => r.current["Growth %"] != null && (r.current["Grand Total"] || 0) >= 200)
      .sort((a, b) => b.current["Growth %"] - a.current["Growth %"])[0];
    return { total, count: rows.length, leader: ranked[0], grower };
  }, [rows]);

  const canLine = monthsAsc.length > 1;
  const shared = { chartType: canLine ? chartType : "bar", monthsAsc, group };

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

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(168px,1fr))", gap: 1, background: "var(--line)", border: "1px solid var(--line)", borderRadius: 6, overflow: "hidden", marginBottom: 36 }}>
        <Kpi label={group === "All" ? "Industry GDPI" : "Segment GDPI"} value={inr(Math.round(kpi.total))} sub={"financial year to date \u00B7 " + month.label} />
        <Kpi label="Insurers" value={String(kpi.count)} sub={group === "All" ? "writing premium" : group.toLowerCase()} />
        <Kpi label="Market leader" name value={kpi.leader ? trunc(shortName(kpi.leader.insurer), 18) : "-"} sub={kpi.leader ? inr(kpi.leader.current["Grand Total"]) + " \u00B7 " + pct(kpi.leader.current["Market %"]) : ""} />
        <Kpi label="Fastest grower" name value={kpi.grower ? trunc(shortName(kpi.grower.insurer), 18) : "-"} sub={kpi.grower ? pct(kpi.grower.current["Growth %"]) + " YoY" : ""} />
      </div>

      {/* tabs + chart-type toggle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "1px solid var(--line)", flexWrap: "wrap", gap: 12 }}>
        <div className="ix-tabs" style={{ borderBottom: "none" }}>
          {[["leaderboard", "Leaderboard"], ["compare", "Compare"], ["segments", "Segments"], ["micro", "Micro analysis"], ["intelligence", "Intelligence"]].map(([k, l]) => (
            <button key={k} className="ix-tab" data-active={tab === k} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
        {canLine && tab !== "micro" && tab !== "intelligence" && <div style={{ paddingBottom: 10 }}><ChartTypeToggle value={chartType} onChange={setChartType} /></div>}
      </div>

      <div style={{ marginTop: 34 }}>
        {tab === "leaderboard" && <Leaderboard rows={rows} {...shared} />}
        {tab === "compare" && <Compare rows={rows} allRows={seg.records} {...shared} />}
        {tab === "segments" && <Segments rows={rows} segments={seg.segments} {...shared} />}
        {tab === "micro" && <Micro month={month} group={group} />}
        {tab === "intelligence" && <Intelligence rows={rows} monthsAsc={monthsAsc} />}
      </div>
    </div>
  );
}

/* ---------- 1. Leaderboard ---------- */
function Leaderboard({ rows, chartType, monthsAsc }) {
  const [sortKey, setSortKey] = useState("Grand Total");
  const [all, setAll] = useState(false);
  const sorted = [...rows].sort((a, b) => (b.current[sortKey] ?? -1e9) - (a.current[sortKey] ?? -1e9));

  if (chartType === "line") {
    const top = [...rows].sort((a, b) => (b.current["Grand Total"] || 0) - (a.current["Grand Total"] || 0)).slice(0, 6);
    const series = top.map((r, i) => ({ name: shortName(r.insurer), color: SERIES6[i % 6], points: monthlySeries(monthsAsc, clean(r.insurer), "Grand Total") }));
    return (
      <div>
        <p className="ix-charth">Monthly premium over time \u00B7 top six insurers</p>
        <div className="ix-legend">{series.map((s) => <span key={s.name}><span style={{ width: 11, height: 11, borderRadius: 2, background: s.color }} />{s.name}</span>)}</div>
        <MultiLineChart series={series} axisMonths={monthsAsc} />
        <LineCaption />
      </div>
    );
  }

  const shown = all ? sorted : sorted.slice(0, 15);
  const isPct = sortKey !== "Grand Total";
  const items = shown.map((r) => {
    const v = r.current[sortKey] || 0;
    return { key: r.insurer, label: r.insurer, value: v,
      title: shortName(r.insurer) + " \u00B7 " + (isPct ? pct(v) : inr(v)) + " \u00B7 " + pct(r.current["Growth %"]) + " growth \u00B7 " + pct(r.current["Market %"]) + " share" };
  });
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 22 }}>
        <p className="ix-charth" style={{ margin: 0 }}>Ranked by {sortKey === "Grand Total" ? "premium" : sortKey === "Growth %" ? "growth" : "market share"}</p>
        <Segmented value={sortKey} onChange={setSortKey} options={[{ v: "Grand Total", l: "Premium" }, { v: "Growth %", l: "Growth" }, { v: "Market %", l: "Market share" }]} />
      </div>
      <HBarChart items={items} valueFmt={(v) => (isPct ? pct(v) : inr(v))} tickFmt={(v) => (isPct ? (v * 100).toFixed(0) + "%" : axisFmt(v))} colorFn={(v) => (isPct ? (v >= 0 ? GREEN : RED) : GOLD)} signed={isPct} />
      {sorted.length > 15 && <button className="ix-toggle" onClick={() => setAll((a) => !a)}>{all ? "Show top 15" : "Show all " + sorted.length}</button>}
    </div>
  );
}

/* ---------- 2. Compare ---------- */
const COMPARE_SEGS = [["Grand Total", "Total"], ["Fire", "Fire"], ["Motor Total", "Motor"], ["Health", "Health"], ["Marine Total", "Marine"], ["Engineering", "Eng."], ["Liability", "Liab."]];
function Compare({ rows, allRows, chartType, monthsAsc }) {
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

  const chips = (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginBottom: 24 }}>
      {rows.map((r) => {
        const on = picked.includes(r.insurer); const idx = picked.indexOf(r.insurer);
        return (
          <button key={r.insurer} className="ix-chip" data-on={on} onClick={() => toggle(r.insurer)}>
            <span className="ix-dot" style={{ background: on ? SERIES[idx % 4] : undefined }} />{shortName(r.insurer)}
          </button>
        );
      })}
    </div>
  );

  if (chartType === "line") {
    const series = chosen.map((c, i) => ({ name: shortName(c.insurer), color: SERIES[i % 4], points: monthlySeries(monthsAsc, clean(c.insurer), "Grand Total") }));
    return (
      <div>
        <p className="ix-charth">Monthly premium over time \u00B7 selected insurers</p>
        {chips}
        {chosen.length === 0 ? <p style={{ color: "var(--muted2)", fontSize: 13.5 }}>Choose at least one insurer above to draw the chart.</p> : (
          <>
            <div className="ix-legend">{series.map((s) => <span key={s.name}><span style={{ width: 11, height: 11, borderRadius: 2, background: s.color }} />{s.name}</span>)}</div>
            <MultiLineChart series={series} axisMonths={monthsAsc} />
            <LineCaption />
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      <p className="ix-charth">Premium by line of business \u00B7 grouped by insurer</p>
      {chips}
      {chosen.length === 0 ? <p style={{ color: "var(--muted2)", fontSize: 13.5 }}>Choose at least one insurer above to draw the chart.</p> : (
        <>
          <div className="ix-legend">{chosen.map((c, i) => <span key={c.insurer}><span style={{ width: 11, height: 11, borderRadius: 2, background: SERIES[i % 4] }} />{shortName(c.insurer)}</span>)}</div>
          <div style={{ position: "relative" }}>
            <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", height: "auto", overflow: "visible" }} role="img" aria-label="Grouped bar chart">
              <defs>
                {SERIES.map((c, i) => (
                  <linearGradient key={i} id={"ixg" + i} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={c} stopOpacity="0.95" /><stop offset="100%" stopColor={c} stopOpacity="0.6" />
                  </linearGradient>
                ))}
              </defs>
              {Array.from({ length: 5 }).map((_, i) => {
                const val = (top / 4) * i; const y = padT + plotH - (val / top) * plotH;
                return (
                  <g key={i}>
                    <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="rgba(255,255,255,.055)" strokeWidth="1" />
                    <text x={padL - 9} y={y + 3.5} textAnchor="end" fontSize="10" fill="#56534C" fontFamily="'Hanken Grotesk',sans-serif" style={{ fontVariantNumeric: "tabular-nums" }}>{axisFmt(val)}</text>
                  </g>
                );
              })}
              {segs.map(([key, label], si) => {
                const bx = padL + si * bandW; const startX = bx + (bandW - barW * nSeries) / 2;
                return (
                  <g key={key}>
                    {chosen.map((c, ci) => {
                      const v = c.current[key] || 0; const h = (v / top) * plotH;
                      const x = startX + ci * barW; const y = padT + plotH - h;
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
              {hover && (<div><div style={{ fontSize: 12, color: "var(--muted)" }}>{shortName(hover.name)}</div><div className="ix-num" style={{ fontSize: 18, color: "var(--ivory)" }}>{inr(hover.v)}</div></div>)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- 3. Segments ---------- */
const MAIN_SEGS = ["Fire", "Marine Total", "Engineering", "Motor Total", "Motor OD", "Motor TP", "Health", "Aviation", "Liability", "P.A."];
function Segments({ rows, segments, chartType, monthsAsc }) {
  const avail = MAIN_SEGS.filter((s) => segments.includes(s));
  const [sname, setSname] = useState(avail[0] || "Motor Total");
  const [all, setAll] = useState(false);
  const ranked = [...rows].filter((r) => (r.current[sname] || 0) > 0).sort((a, b) => (b.current[sname] || 0) - (a.current[sname] || 0));
  const total = ranked.reduce((a, r) => a + (r.current[sname] || 0), 0);

  const picker = (
    <div className="ix-seg" style={{ flexWrap: "wrap", marginBottom: 22 }}>
      {avail.map((s) => <button key={s} data-active={sname === s} onClick={() => { setSname(s); setAll(false); }}>{s}</button>)}
    </div>
  );

  if (chartType === "line") {
    const top = ranked.slice(0, 6);
    const series = top.map((r, i) => ({ name: shortName(r.insurer), color: SERIES6[i % 6], points: monthlySeries(monthsAsc, clean(r.insurer), sname) }));
    return (
      <div>
        <p className="ix-charth">Monthly {sname} premium over time \u00B7 top six insurers</p>
        {picker}
        <div className="ix-legend">{series.map((s) => <span key={s.name}><span style={{ width: 11, height: 11, borderRadius: 2, background: s.color }} />{s.name}</span>)}</div>
        <MultiLineChart series={series} axisMonths={monthsAsc} />
        <LineCaption />
      </div>
    );
  }

  const shown = all ? ranked : ranked.slice(0, 15);
  const items = shown.map((r) => ({ key: r.insurer, label: r.insurer, value: r.current[sname] || 0,
    title: shortName(r.insurer) + " \u00B7 " + inr(r.current[sname]) + " \u00B7 " + ((r.current[sname] / total) * 100).toFixed(1) + "% of total" }));
  return (
    <div>
      <p className="ix-charth">Premium by insurer within a line of business</p>
      {picker}
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 22, paddingBottom: 18, borderBottom: "1px solid var(--line)" }}>
        <span className="ix-num" style={{ fontSize: 28, color: "var(--gold)" }}>{inr(total)}</span>
        <span style={{ fontSize: 12.5, color: "var(--muted)" }}>total {sname} premium \u00B7 {ranked.length} insurers</span>
      </div>
      <HBarChart items={items} valueFmt={inr} tickFmt={axisFmt} colorFn={() => GOLD} />
      {ranked.length > 15 && <button className="ix-toggle" onClick={() => setAll((a) => !a)}>{all ? "Show top 15" : "Show all " + ranked.length}</button>}
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
  const withTotal = rows.map((r) => ({ ...r, _t: keys.reduce((a, k) => a + (r.current[k] || 0), 0) })).filter((r) => r._t > 0).sort((a, b) => b._t - a._t).slice(0, 12);
  return (
    <div>
      <p className="ix-charth">Sub-segment split within a line of business</p>
      <div className="ix-seg" style={{ flexWrap: "wrap", marginBottom: 24 }}>
        {MICRO.map((m) => <button key={m.id} data-active={mid === m.id} onClick={() => setMid(m.id)}>{m.tab}</button>)}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <span className="fl-serif" style={{ fontSize: 19, color: "var(--ivory)", fontWeight: 350 }}>{cfg.title}</span>
        <div className="ix-legend" style={{ marginBottom: 0 }}>
          {cfg.parts.map((p, i) => <span key={p[0]} style={{ color: "var(--muted)", fontSize: 11.5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: SERIES[i % 4] }} />{p[1]}</span>)}
        </div>
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
