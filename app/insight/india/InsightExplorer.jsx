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
const pctTick = (x) => (x * 100).toFixed(0) + "%";
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
const monShort = (p) => MON[(+p.slice(5, 7)) - 1] + " " + p.slice(0, 4);
const nextPeriod = (p) => { let y = +p.slice(0, 4), m = +p.slice(5, 7) + 1; if (m > 12) { m = 1; y++; } return y + "-" + String(m).padStart(2, "0"); };
const GROUPS = ["All", "General", "Standalone Health", "Specialised"];
const SERIES = ["#D9C9A3", "#94A7C7", "#A6B89C", "#C2A3B0"];
const SERIES6 = ["#D9C9A3", "#94A7C7", "#A6B89C", "#C2A3B0", "#C9B07A", "#8FB8C4"];
const GOLD = "#D9C9A3", GREEN = "#9BC4A0", RED = "#D69A9A";
const IXL = { fontSize: 10, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--muted2)", marginBottom: 9 };

/* de-cumulate YTD into per-month premium over the FULL timeline (resets each April) */
function monthlySeries(monthsAsc, name, key) {
  const pts = []; let prevYtd = null, prevFY = null;
  for (const m of monthsAsc) {
    const rec = m.bySheet["Segmentwise Report"].records.find((r) => clean(r.insurer) === name);
    const ytd = rec ? (rec.current[key] == null ? null : rec.current[key]) : null;
    const cm = +m.period.slice(5, 7);
    const fy = cm >= 4 ? +m.period.slice(0, 4) : +m.period.slice(0, 4) - 1;
    let val;
    if (ytd == null) val = null;
    else if (cm === 4) val = ytd;
    else if (prevYtd != null && prevFY === fy) val = ytd - prevYtd;
    else val = ytd;
    pts.push({ period: m.period, label: m.label, value: val });
    prevYtd = ytd; prevFY = fy;
  }
  return pts;
}
/* raw reported value per month (for Growth % / Market %), not de-cumulated */
function rawSeries(monthsAsc, name, key) {
  return monthsAsc.map((m) => {
    const rec = m.bySheet["Segmentwise Report"].records.find((r) => clean(r.insurer) === name);
    return { period: m.period, label: m.label, value: rec ? (rec.current[key] == null ? null : rec.current[key]) : null };
  });
}
const wma = (vals) => {
  const v = vals.slice(-3);
  if (!v.length) return null;
  const w = v.map((_, i) => i + 1);
  return v.reduce((a, x, i) => a + x * w[i], 0) / w.reduce((a, b) => a + b, 0);
};
/* forward projection for the month AFTER the window, validated against actual when it exists */
function computeIntel(monthsAsc, winSet, name) {
  const full = monthlySeries(monthsAsc, name, "Grand Total");
  const win = full.filter((p) => winSet.has(p.period) && p.value != null);
  if (win.length < 3) return null;
  const vals = win.map((p) => p.value);
  const lastActual = vals[vals.length - 1];
  const predicted = wma(vals);
  const projGrowth = lastActual ? (predicted - lastActual) / lastActual : null;
  const lastPeriod = win[win.length - 1].period;
  const targetPeriod = nextPeriod(lastPeriod);
  const ap = full.find((p) => p.period === targetPeriod);
  const actualNext = ap ? ap.value : null;
  const variance = actualNext != null ? (actualNext - predicted) / predicted : null;
  return { lastActual, lastLabel: monShort(lastPeriod), predicted, projGrowth, targetLabel: monShort(targetPeriod), actualNext, variance };
}


/* ---------- Track Org & Custom Compare helpers (additive) ---------- */
/* YoY growth on a year-to-date basis, from each month's current vs previous-year columns */
function yoySeries(monthsAsc, name, key) {
  const nm = clean(name);
  return monthsAsc.map((m) => {
    const rec = m.bySheet["Segmentwise Report"].records.find((r) => clean(r.insurer) === nm);
    let v = null;
    if (rec) {
      const c = rec.current ? rec.current[key] : null;
      const p = rec.previous ? rec.previous[key] : null;
      if (c != null && p != null && p !== 0) v = (c - p) / p;
    }
    return { period: m.period, label: m.label, value: v };
  });
}
/* Month-on-month growth of de-cumulated monthly premium */
function momSeries(monthsAsc, name, key) {
  const mo = monthlySeries(monthsAsc, clean(name), key);
  return mo.map((p, i) => {
    const prev = i > 0 ? mo[i - 1].value : null;
    return { period: p.period, label: p.label, value: p.value != null && prev != null && prev !== 0 ? (p.value - prev) / prev : null };
  });
}
/* Aggregate de-cumulated monthly premium across a set of insurers */
function groupAggSeries(monthsAsc, names, key) {
  const per = names.map((n) => monthlySeries(monthsAsc, clean(n), key));
  return monthsAsc.map((m, i) => {
    let sum = 0, any = false;
    per.forEach((s) => { const v = s[i] ? s[i].value : null; if (v != null) { sum += v; any = true; } });
    return { period: m.period, label: m.label, value: any ? sum : null };
  });
}
/* Premium-weighted YoY growth for an aggregated peer group (sum current vs sum previous) */
function groupYoySeries(monthsAsc, names, key) {
  const set = new Set(names.map(clean));
  return monthsAsc.map((m) => {
    let c = 0, p = 0, anyC = false, anyP = false;
    m.bySheet["Segmentwise Report"].records.forEach((r) => {
      if (!set.has(clean(r.insurer))) return;
      if (r.current && r.current[key] != null) { c += r.current[key]; anyC = true; }
      if (r.previous && r.previous[key] != null) { p += r.previous[key]; anyP = true; }
    });
    return { period: m.period, label: m.label, value: anyC && anyP && p !== 0 ? (c - p) / p : null };
  });
}
/* MoM growth of the aggregated peer group premium */
function groupMomSeries(monthsAsc, names, key) {
  const agg = groupAggSeries(monthsAsc, names, key);
  return agg.map((pnt, i) => {
    const prev = i > 0 ? agg[i - 1].value : null;
    return { period: pnt.period, label: pnt.label, value: pnt.value != null && prev != null && prev !== 0 ? (pnt.value - prev) / prev : null };
  });
}
/* Trailing 3-month average of a series' latest values inside a window */
function trailingAvg(points, winSet, k) {
  const vals = points.filter((p) => winSet.has(p.period) && p.value != null).map((p) => p.value);
  const v = vals.slice(-k);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
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

/* info "i" icon with a popover explaining the feature */
function InfoButton({ info }) {
  const [open, setOpen] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-block", marginLeft: 9, verticalAlign: "middle" }}>
      <button onClick={() => setOpen((o) => !o)} aria-label="About this view"
        style={{ width: 18, height: 18, borderRadius: "50%", border: "1px solid var(--gold-deep)", background: open ? "var(--gold-deep)" : "transparent", color: open ? "#0B0B0E" : "var(--gold)", fontSize: 11, fontStyle: "italic", fontFamily: "Georgia,serif", cursor: "pointer", lineHeight: 1, padding: 0 }}>i</button>
      {open && (
        <div style={{ position: "absolute", top: 26, left: 0, zIndex: 30, width: 300, background: "rgba(13,13,17,.97)", border: "1px solid var(--line)", borderRadius: 10, padding: "16px 18px", boxShadow: "0 20px 60px rgba(0,0,0,.6)", backdropFilter: "blur(12px)", cursor: "default" }}>
          <div style={{ fontSize: 13.5, color: "var(--ivory)", fontWeight: 500, marginBottom: 8 }}>{info.title}</div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.55, marginBottom: 10 }}>{info.what}</div>
          <div style={{ fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted2)", marginBottom: 5 }}>How to use</div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.55 }}>{info.how}</div>
          <button onClick={() => setOpen(false)} style={{ marginTop: 12, fontSize: 11, color: "var(--gold)", background: "none", border: "none", cursor: "pointer", padding: 0, letterSpacing: ".08em" }}>Close</button>
        </div>
      )}
    </span>
  );
}
const INFO = {
  leaderboard: { title: "Leaderboard", what: "Ranks insurers by premium, year-on-year growth, or market share for the period you choose.", how: "Use the metric buttons to switch between Premium, Growth and Market share. Toggle Bar Graph or Line Graph at the top right. In Line, you see how the top insurers moved over time." },
  compare: { title: "Compare", what: "Puts up to four insurers side by side across the main lines of business.", how: "Tap an insurer chip to add or remove it. Switch Bar Graph for a snapshot, or Line Graph to track them over time." },
  segments: { title: "Segments", what: "Shows which insurers write the most in a single line of business, such as Motor or Health.", how: "Pick a segment from the row of buttons. Bar Graph ranks insurers; Line Graph shows the trend over time." },
  micro: { title: "Micro analysis", what: "Breaks one line of business into its sub-parts, for example Motor into Own Damage versus Third Party, and shows each insurer's split as a stacked bar.", how: "Pick a group (Motor, Marine, Health, Liability). Each bar shows one insurer; the coloured segments are the share of each sub-part for the selected month." },
  trackorg: { title: "Track Org", what: "A single-insurer deep dive: premium trend, year-on-year and month-on-month growth, and segment-level growth for one insurer, so you can tell broad-based growth from a one-off spike.", how: "Pick the insurer, then switch YoY (year-to-date basis) or MoM (monthly premium basis). The growth trend shows momentum over time; the segment bars show where growth is concentrated for the selected month." },
  customcompare: { title: "Custom Compare", what: "Benchmarks one insurer against a peer group you define yourself, or a preset such as the top 10 by premium. The peer line is premium-weighted, built from the aggregated premium of the group.", how: "Choose the subject insurer, tap peers to add or remove them (or use Top 10 by premium), then switch metric: Premium compares against the peer average per insurer; YoY and MoM compare growth against the aggregated group." },
  intelligence: { title: "Intelligence", what: "A weighted projection of the next month's premium for each insurer, and how the last estimate compared with what actually happened. It is a directional model, not advice.", how: "Set a Range to choose the window the model learns from. The projection is for the month right after your window. If that month's actual figure exists in the data, you see predicted versus actual; if it is still in the future, you see the projected change instead." },
};

/* ---------- horizontal bar chart ---------- */
function HBarChart({ items, valueFmt, tickFmt, colorFn, signed }) {
  const W = 760, labelW = 188, rightGut = 92;
  const plotL = labelW, plotR = W - rightGut, plotW = plotR - plotL;
  const axisTop = 26, rowH = 33, barH = 15;
  const H = axisTop + items.length * rowH + 6;
  const vals = items.map((d) => d.value || 0);
  let vmin = Math.min(0, ...vals), vmax = Math.max(0, ...vals);
  vmax = niceMax(vmax || 1); vmin = vmin < 0 ? -niceMax(-vmin) : 0;
  const span = vmax - vmin || 1;
  const xOf = (v) => plotL + ((v - vmin) / span) * plotW;
  const zeroX = xOf(0);
  return (
    <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", height: "auto", overflow: "visible" }} role="img" aria-label="Bar chart">
      {Array.from({ length: 5 }).map((_, i) => {
        const v = vmin + (span / 4) * i; const x = xOf(v);
        return (<g key={i}><line x1={x} y1={axisTop - 6} x2={x} y2={H - 4} stroke="rgba(255,255,255,.05)" /><text x={x} y={axisTop - 11} textAnchor="middle" fontSize="9.5" fill="#56534C" fontFamily="'Hanken Grotesk',sans-serif" style={{ fontVariantNumeric: "tabular-nums" }}>{tickFmt(v)}</text></g>);
      })}
      {signed && <line x1={zeroX} y1={axisTop - 6} x2={zeroX} y2={H - 4} stroke="rgba(255,255,255,.18)" />}
      {items.map((d, i) => {
        const v = d.value || 0; const cy = axisTop + i * rowH + rowH / 2;
        const x = xOf(v); const bx = Math.min(zeroX, x), bw = Math.max(2, Math.abs(x - zeroX));
        const col = colorFn(v, d);
        return (<g key={d.key || d.label}>
          <text x={labelW - 12} y={cy + 4} textAnchor="end" fontSize="12.5" fill="#F4F1EA" fontFamily="'Hanken Grotesk',sans-serif">{trunc(d.label, 24)}</text>
          <rect x={bx} y={cy - barH / 2} width={bw} height={barH} rx="2" fill={col}><title>{d.title}</title></rect>
          <text x={W} y={cy + 4} textAnchor="end" fontSize="12.5" fill={signed ? col : "#F4F1EA"} fontFamily="'Fraunces',Georgia,serif" style={{ fontVariantNumeric: "tabular-nums" }}>{valueFmt(v)}</text>
        </g>);
      })}
    </svg>
  );
}

/* ---------- multi-line chart with hover ---------- */
function MultiLineChart({ series, axisMonths, valueFmt = inr, tickFmt = axisFmt }) {
  const W = 820, H = 388, padL = 54, padR = 18, padT = 16, padB = 50;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const n = axisMonths.length;
  const xOf = (i) => (n <= 1 ? padL + plotW / 2 : padL + (i / (n - 1)) * plotW);
  const allVals = series.flatMap((s) => s.points.map((p) => p.value).filter((v) => v != null));
  const vmax = niceMax(Math.max(1e-9, ...allVals));
  let vmin = Math.min(0, ...allVals); vmin = vmin < 0 ? -niceMax(-vmin) : 0;
  const span = vmax - vmin || 1;
  const yOf = (v) => padT + plotH - ((v - vmin) / span) * plotH;
  const [hi, setHi] = useState(null);
  const boxRef = useRef(null);
  const onMove = (e) => {
    const r = boxRef.current.getBoundingClientRect();
    const vbx = ((e.clientX - r.left) / r.width) * W;
    let i = Math.round(((vbx - padL) / plotW) * (n - 1));
    setHi(Math.max(0, Math.min(n - 1, i)));
  };
  const everyN = n > 18 ? Math.ceil(n / 12) : 1;
  return (
    <div ref={boxRef} style={{ position: "relative" }} onMouseMove={onMove} onMouseLeave={() => setHi(null)}>
      <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", height: "auto", overflow: "visible" }} role="img" aria-label="Line chart over time">
        {Array.from({ length: 5 }).map((_, i) => {
          const v = vmin + (span / 4) * i; const y = yOf(v);
          return (<g key={i}><line x1={padL} y1={y} x2={W - padR} y2={y} stroke="rgba(255,255,255,.055)" /><text x={padL - 10} y={y + 3.5} textAnchor="end" fontSize="10" fill="#56534C" fontFamily="'Hanken Grotesk',sans-serif" style={{ fontVariantNumeric: "tabular-nums" }}>{tickFmt(v)}</text></g>);
        })}
        {axisMonths.map((m, i) => {
          const cm = +m.period.slice(5, 7); const x = xOf(i);
          const show = i % everyN === 0 || i === n - 1;
          const showYear = cm === 4 || i === 0;
          return show ? (<g key={m.period}>
            <text x={x} y={H - padB + 19} textAnchor="middle" fontSize="9.5" fill={hi === i ? "#F4F1EA" : "#928E84"} fontFamily="'Hanken Grotesk',sans-serif">{MON[cm - 1]}</text>
            {showYear && <text x={x} y={H - padB + 32} textAnchor="middle" fontSize="9" fill="#56534C" fontFamily="'Hanken Grotesk',sans-serif">{"\u2019" + m.period.slice(2, 4)}</text>}
          </g>) : null;
        })}
        <line x1={padL} y1={padT + plotH} x2={W - padR} y2={padT + plotH} stroke="rgba(255,255,255,.16)" />
        {hi != null && <line x1={xOf(hi)} y1={padT} x2={xOf(hi)} y2={padT + plotH} stroke="rgba(217,201,163,.35)" strokeDasharray="3 3" />}
        {series.map((s) => {
          let d = "", started = false;
          s.points.forEach((p, i) => { if (p.value == null) { started = false; return; } d += (started ? " L " : " M ") + xOf(i).toFixed(1) + " " + yOf(p.value).toFixed(1); started = true; });
          return (<g key={s.name}>
            <path d={d} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" opacity={hi != null ? 0.9 : 1} />
            {s.points.map((p, i) => p.value == null ? null : <circle key={i} cx={xOf(i)} cy={yOf(p.value)} r={hi === i ? 4.5 : (n > 18 ? 2 : 3)} fill="#0B0B0E" stroke={s.color} strokeWidth={hi === i ? 2.2 : 1.5} />)}
          </g>);
        })}
      </svg>
      {hi != null && (
        <div style={{ position: "absolute", top: 0, right: 0, background: "rgba(13,13,17,.92)", border: "1px solid var(--line)", borderRadius: 8, padding: "10px 13px", pointerEvents: "none", backdropFilter: "blur(10px)", minWidth: 160 }}>
          <div style={{ fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted2)", marginBottom: 8 }}>{monShort(axisMonths[hi].period)}</div>
          {[...series].sort((a, b) => (b.points[hi]?.value || 0) - (a.points[hi]?.value || 0)).map((s) => (
            <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: s.color, flex: "none" }} />
              <span style={{ fontSize: 12, color: "var(--ivory)", flex: 1, whiteSpace: "nowrap" }}>{s.name}</span>
              <span style={{ fontFamily: "'Fraunces',Georgia,serif", fontVariantNumeric: "tabular-nums", fontSize: 12.5, color: "var(--ivory)" }}>{valueFmt(s.points[hi]?.value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function Legend({ series }) {
  return <div className="ix-legend">{series.map((s) => <span key={s.name}><span style={{ width: 11, height: 11, borderRadius: 2, background: s.color }} />{s.name}</span>)}</div>;
}
/* build line series for any metric: premium = de-cumulated monthly; growth/market = reported per month */
function seriesForMetric(ctx, names, metric) {
  const useMonthly = metric === "Grand Total";
  return names.map((nm, i) => ({
    name: shortName(nm),
    color: (names.length > 4 ? SERIES6 : SERIES)[i % (names.length > 4 ? 6 : 4)],
    points: (useMonthly ? monthlySeries(ctx.monthsAsc, clean(nm), "Grand Total") : rawSeries(ctx.monthsAsc, clean(nm), metric)).filter((p) => ctx.winSet.has(p.period)),
  }));
}

/* ---------- root ---------- */
export default function InsightExplorer({ months }) {
  const monthsAsc = useMemo(() => [...months].sort((a, b) => (a.period < b.period ? -1 : 1)), [months]);
  const N = monthsAsc.length;
  const [mode, setMode] = useState("single");
  const [period, setPeriod] = useState(months[0].period);
  const [rangeFrom, setRangeFrom] = useState(monthsAsc[Math.max(0, N - 7)].period);
  const [rangeTo, setRangeTo] = useState(monthsAsc[N - 1].period);
  const [group, setGroup] = useState("All");
  const [chartType, setChartType] = useState("bar");
  const [tab, setTab] = useState("leaderboard");

  const isRange = mode === "range";
  // guards: From can never be after To
  const onFrom = (v) => { setRangeFrom(v); if (v > rangeTo) setRangeTo(v); };
  const onTo = (v) => { setRangeTo(v); if (v < rangeFrom) setRangeFrom(v); };
  const lo = rangeFrom, hi = rangeTo;

  const lineMonths = isRange ? monthsAsc.filter((m) => m.period >= lo && m.period <= hi) : monthsAsc;
  const winSet = useMemo(() => new Set(lineMonths.map((m) => m.period)), [lineMonths]);
  const baseMonth = isRange ? (lineMonths[lineMonths.length - 1] || monthsAsc[N - 1]) : (months.find((m) => m.period === period) || months[0]);
  const baseRecs = useMemo(() => {
    const map = {}; baseMonth.bySheet["Segmentwise Report"].records.forEach((r) => { map[clean(r.insurer)] = r; }); return map;
  }, [baseMonth]);
  const rows = useMemo(() => baseMonth.bySheet["Segmentwise Report"].records.filter((r) => group === "All" || r.group === group), [baseMonth, group]);

  const getValue = useMemo(() => {
    if (!isRange) return (name, key) => (baseRecs[name] ? baseRecs[name].current[key] : null);
    return (name, key) => monthlySeries(monthsAsc, name, key).reduce((a, p) => a + (winSet.has(p.period) && p.value != null ? p.value : 0), 0);
  }, [isRange, baseRecs, monthsAsc, winSet]);

  const ctx = { isRange, chartType, group, lineMonths, winSet, monthsAsc, getValue };

  const kpi = useMemo(() => {
    const ranked = [...rows].map((r) => ({ r, v: getValue(clean(r.insurer), "Grand Total") || 0 })).sort((a, b) => b.v - a.v);
    const grower = isRange ? null : [...rows].filter((r) => r.current["Growth %"] != null && (r.current["Grand Total"] || 0) >= 200).sort((a, b) => b.current["Growth %"] - a.current["Growth %"])[0];
    return { total: ranked.reduce((a, x) => a + x.v, 0), count: rows.length, leader: ranked[0], grower };
  }, [rows, getValue, isRange]);

  return (
    <div>
      {/* filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 26, alignItems: "flex-end", justifyContent: "space-between", marginBottom: 30 }}>
        <div>
          <div style={IXL}>Insurer group</div>
          <Segmented value={group} onChange={setGroup} options={GROUPS} />
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
          {N > 1 && (
            <div>
              <div style={IXL}>Period</div>
              <Segmented value={mode} onChange={(v) => { setMode(v); if (v === "range") setChartType("line"); }} options={[{ v: "single", l: "Single month" }, { v: "range", l: "Range" }]} />
            </div>
          )}
          {!isRange ? (
            <div>
              <div style={IXL}>Month</div>
              <select className="ix-select" value={period} onChange={(e) => setPeriod(e.target.value)}>
                {months.map((m) => <option key={m.period} value={m.period}>{m.label}</option>)}
              </select>
            </div>
          ) : (
            <>
              <div><div style={IXL}>From</div>
                <select className="ix-select" value={rangeFrom} onChange={(e) => onFrom(e.target.value)}>
                  {monthsAsc.filter((m) => m.period <= rangeTo).map((m) => <option key={m.period} value={m.period}>{m.label}</option>)}
                </select></div>
              <div><div style={IXL}>To</div>
                <select className="ix-select" value={rangeTo} onChange={(e) => onTo(e.target.value)}>
                  {monthsAsc.filter((m) => m.period >= rangeFrom).map((m) => <option key={m.period} value={m.period}>{m.label}</option>)}
                </select></div>
            </>
          )}
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(168px,1fr))", gap: 1, background: "var(--line)", border: "1px solid var(--line)", borderRadius: 6, overflow: "hidden", marginBottom: 36 }}>
        <Kpi label={isRange ? "Premium written" : (group === "All" ? "Industry GDPI" : "Segment GDPI")} value={inr(Math.round(kpi.total))} sub={isRange ? monShort(lo) + " to " + monShort(hi) : "financial year to date \u00B7 " + baseMonth.label} />
        <Kpi label="Insurers" value={String(kpi.count)} sub={group === "All" ? "writing premium" : group.toLowerCase()} />
        <Kpi label={isRange ? "Top by volume" : "Market leader"} name value={kpi.leader ? trunc(shortName(kpi.leader.r.insurer), 18) : "-"} sub={kpi.leader ? inr(Math.round(kpi.leader.v)) : ""} />
        {isRange
          ? <Kpi label="Window" value={String(lineMonths.length)} sub={lineMonths.length === 1 ? "month" : "months"} />
          : <Kpi label="Fastest grower" name value={kpi.grower ? trunc(shortName(kpi.grower.insurer), 18) : "-"} sub={kpi.grower ? pct(kpi.grower.current["Growth %"]) + " YoY" : ""} />}
      </div>

      {/* tabs + chart toggle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "1px solid var(--line)", flexWrap: "wrap", gap: 12 }}>
        <div className="ix-tabs" style={{ borderBottom: "none" }}>
          {[["leaderboard", "Leaderboard"], ["trackorg", "Track Org"], ["compare", "Compare"], ["customcompare", "Custom Compare"], ["segments", "Segments"], ["micro", "Micro analysis"], ["intelligence", "Intelligence"]].map(([k, l]) => (
            <button key={k} className="ix-tab" data-active={tab === k} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
        {tab !== "micro" && tab !== "intelligence" && tab !== "trackorg" && tab !== "customcompare" && <div style={{ paddingBottom: 10 }}><Segmented value={chartType} onChange={setChartType} options={[{ v: "bar", l: "Bar Graph" }, { v: "line", l: "Line Graph" }]} /></div>}
      </div>

      <div style={{ marginTop: 34 }}>
        {tab === "leaderboard" && <Leaderboard rows={rows} ctx={ctx} />}
        {tab === "trackorg" && <TrackOrg rows={rows} ctx={ctx} baseMonth={baseMonth} />}
        {tab === "compare" && <Compare rows={rows} ctx={ctx} />}
        {tab === "customcompare" && <CustomCompare rows={rows} ctx={ctx} />}
        {tab === "segments" && <Segments rows={rows} segments={baseMonth.bySheet["Segmentwise Report"].segments} ctx={ctx} />}
        {tab === "micro" && <Micro month={baseMonth} group={group} />}
        {tab === "intelligence" && <Intelligence rows={rows} ctx={ctx} />}
      </div>
    </div>
  );
}

/* ---------- 1. Leaderboard ---------- */
function Leaderboard({ rows, ctx }) {
  const [sortKey, setSortKey] = useState("Grand Total");
  const [all, setAll] = useState(false);
  // metric control shows whenever Line, or whenever not a range (snapshot supports all three)
  const showMetric = ctx.chartType === "line" || !ctx.isRange;
  const eff = (ctx.isRange && ctx.chartType === "bar") ? "Grand Total" : (showMetric ? sortKey : "Grand Total");
  const isPctM = eff !== "Grand Total";

  const head = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 22 }}>
      <p className="ix-charth" style={{ margin: 0 }}>
        {ctx.chartType === "line"
          ? (eff === "Grand Total" ? "Monthly premium over time" : eff === "Growth %" ? "Year-on-year growth over time" : "Market share over time") + " \u00B7 top six insurers"
          : (ctx.isRange ? "Premium written in window" : "Ranked by " + (eff === "Grand Total" ? "premium" : eff === "Growth %" ? "growth" : "market share"))}
        <InfoButton info={INFO.leaderboard} />
      </p>
      {showMetric && <Segmented value={sortKey} onChange={setSortKey} options={[{ v: "Grand Total", l: "Premium" }, { v: "Growth %", l: "Growth" }, { v: "Market %", l: "Market share" }]} />}
    </div>
  );

  if (ctx.chartType === "line") {
    const top = [...rows].sort((a, b) => (ctx.getValue(clean(b.insurer), "Grand Total") || 0) - (ctx.getValue(clean(a.insurer), "Grand Total") || 0)).slice(0, 6);
    const series = seriesForMetric(ctx, top.map((r) => r.insurer), eff);
    return (<div>
      {head}
      <Legend series={series} />
      <MultiLineChart series={series} axisMonths={ctx.lineMonths} valueFmt={isPctM ? pct : inr} tickFmt={isPctM ? pctTick : axisFmt} />
      <p style={{ color: "var(--muted2)", fontSize: 11.5, marginTop: 14, lineHeight: 1.5 }}>
        {eff === "Grand Total" ? "Monthly premium derived from year-to-date figures; the financial year resets every April." : eff === "Growth %" ? "Year-on-year growth as reported each month (year-to-date basis)." : "Market share as reported each month (year-to-date basis)."}
      </p>
    </div>);
  }

  const valOf = (r) => (eff === "Grand Total" ? (ctx.getValue(clean(r.insurer), "Grand Total") || 0) : (r.current[eff] || 0));
  const sorted = [...rows].sort((a, b) => valOf(b) - valOf(a));
  const shown = all ? sorted : sorted.slice(0, 15);
  const items = shown.map((r) => { const v = valOf(r); return { key: r.insurer, label: r.insurer, value: v, title: shortName(r.insurer) + " \u00B7 " + (isPctM ? pct(v) : inr(v)) }; });
  return (<div>
    {head}
    <HBarChart items={items} valueFmt={(v) => (isPctM ? pct(v) : inr(v))} tickFmt={(v) => (isPctM ? pctTick(v) : axisFmt(v))} colorFn={(v) => (isPctM ? (v >= 0 ? GREEN : RED) : GOLD)} signed={isPctM} />
    {sorted.length > 15 && <button className="ix-toggle" onClick={() => setAll((a) => !a)}>{all ? "Show top 15" : "Show all " + sorted.length}</button>}
  </div>);
}

/* ---------- 2. Compare ---------- */
const COMPARE_SEGS = [["Grand Total", "Total"], ["Fire", "Fire"], ["Motor Total", "Motor"], ["Health", "Health"], ["Marine Total", "Marine"], ["Engineering", "Eng."], ["Liability", "Liab."]];
function Compare({ rows, ctx }) {
  const [picked, setPicked] = useState(() => rows.slice(0, 3).map((r) => r.insurer));
  const [hover, setHover] = useState(null);
  const toggle = (name) => setPicked((p) => (p.includes(name) ? p.filter((x) => x !== name) : p.length < 4 ? [...p, name] : p));
  const chosen = picked.filter((n) => rows.some((r) => r.insurer === n));

  const chips = (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginBottom: 24 }}>
      {rows.map((r) => {
        const on = picked.includes(r.insurer); const idx = picked.indexOf(r.insurer);
        return <button key={r.insurer} className="ix-chip" data-on={on} onClick={() => toggle(r.insurer)}><span className="ix-dot" style={{ background: on ? SERIES[idx % 4] : undefined }} />{shortName(r.insurer)}</button>;
      })}
    </div>
  );
  const heading = (txt) => <p className="ix-charth">{txt}<InfoButton info={INFO.compare} /></p>;

  if (ctx.chartType === "line") {
    const series = seriesForMetric(ctx, chosen, "Grand Total");
    return (<div>
      {heading("Monthly premium over time \u00B7 selected insurers")}
      {chips}
      {chosen.length === 0 ? <p style={{ color: "var(--muted2)", fontSize: 13.5 }}>Choose at least one insurer above.</p> : (<>
        <Legend series={series} />
        <MultiLineChart series={series} axisMonths={ctx.lineMonths} />
        <p style={{ color: "var(--muted2)", fontSize: 11.5, marginTop: 14, lineHeight: 1.5 }}>Monthly premium derived from year-to-date figures; the financial year resets every April.</p>
      </>)}
    </div>);
  }

  const W = 820, H = 392, padL = 48, padR = 14, padT = 16, padB = 40;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const valAt = (name, key) => ctx.getValue(clean(name), key) || 0;
  const maxVal = Math.max(...COMPARE_SEGS.flatMap(([k]) => chosen.map((c) => valAt(c, k))), 1);
  const top = niceMax(maxVal);
  const bandW = plotW / COMPARE_SEGS.length;
  const nSeries = Math.max(chosen.length, 1);
  const barW = Math.min(34, (bandW - bandW * 0.22) / nSeries);
  return (<div>
    {heading(ctx.isRange ? "Premium written by line of business \u00B7 selected window" : "Premium by line of business \u00B7 grouped by insurer")}
    {chips}
    {chosen.length === 0 ? <p style={{ color: "var(--muted2)", fontSize: 13.5 }}>Choose at least one insurer above.</p> : (<>
      <Legend series={chosen.map((c, i) => ({ name: shortName(c), color: SERIES[i % 4] }))} />
      <div style={{ position: "relative" }}>
        <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", height: "auto", overflow: "visible" }} role="img" aria-label="Grouped bar chart">
          <defs>{SERIES.map((c, i) => <linearGradient key={i} id={"ixg" + i} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c} stopOpacity="0.95" /><stop offset="100%" stopColor={c} stopOpacity="0.6" /></linearGradient>)}</defs>
          {Array.from({ length: 5 }).map((_, i) => { const val = (top / 4) * i; const y = padT + plotH - (val / top) * plotH; return (<g key={i}><line x1={padL} y1={y} x2={W - padR} y2={y} stroke="rgba(255,255,255,.055)" /><text x={padL - 9} y={y + 3.5} textAnchor="end" fontSize="10" fill="#56534C" fontFamily="'Hanken Grotesk',sans-serif" style={{ fontVariantNumeric: "tabular-nums" }}>{axisFmt(val)}</text></g>); })}
          {COMPARE_SEGS.map(([key, label], si) => {
            const bx = padL + si * bandW; const startX = bx + (bandW - barW * nSeries) / 2;
            return (<g key={key}>
              {chosen.map((c, ci) => {
                const v = valAt(c, key); const h = (v / top) * plotH; const x = startX + ci * barW; const y = padT + plotH - h;
                const isH = hover && hover.si === si && hover.ci === ci;
                return <rect key={ci} x={x + 2} y={y} width={Math.max(barW - 4, 3)} height={Math.max(h, 0)} rx="2.5" fill={"url(#ixg" + (ci % 4) + ")"} opacity={hover && !isH ? 0.5 : 1} style={{ cursor: "pointer", transition: "opacity .2s" }} onMouseEnter={() => setHover({ si, ci, v, name: c })} onMouseLeave={() => setHover(null)}><title>{shortName(c) + " \u00B7 " + label + ": " + inr(v)}</title></rect>;
              })}
              <text x={bx + bandW / 2} y={H - padB + 22} textAnchor="middle" fontSize="11.5" fill="#928E84" fontFamily="'Hanken Grotesk',sans-serif">{label}</text>
            </g>);
          })}
          <line x1={padL} y1={padT + plotH} x2={W - padR} y2={padT + plotH} stroke="rgba(255,255,255,.16)" />
        </svg>
        <div style={{ position: "absolute", top: 0, right: 0, textAlign: "right", minHeight: 32, pointerEvents: "none" }}>{hover && (<div><div style={{ fontSize: 12, color: "var(--muted)" }}>{shortName(hover.name)}</div><div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 18, color: "var(--ivory)" }}>{inr(hover.v)}</div></div>)}</div>
      </div>
    </>)}
  </div>);
}

/* ---------- 3. Segments ---------- */
const MAIN_SEGS = ["Fire", "Marine Total", "Engineering", "Motor Total", "Motor OD", "Motor TP", "Health", "Aviation", "Liability", "P.A."];
function Segments({ rows, segments, ctx }) {
  const avail = MAIN_SEGS.filter((s) => segments.includes(s));
  const [sname, setSname] = useState(avail[0] || "Motor Total");
  const [all, setAll] = useState(false);
  const valOf = (r) => ctx.getValue(clean(r.insurer), sname) || 0;
  const ranked = [...rows].filter((r) => valOf(r) > 0).sort((a, b) => valOf(b) - valOf(a));
  const total = ranked.reduce((a, r) => a + valOf(r), 0);
  const picker = <div className="ix-seg" style={{ flexWrap: "wrap", marginBottom: 22 }}>{avail.map((s) => <button key={s} data-active={sname === s} onClick={() => { setSname(s); setAll(false); }}>{s}</button>)}</div>;

  if (ctx.chartType === "line") {
    const top = ranked.slice(0, 6);
    const series = seriesForMetric(ctx, top.map((r) => r.insurer), sname);
    return (<div>
      <p className="ix-charth">Monthly {sname} premium over time \u00B7 top six insurers<InfoButton info={INFO.segments} /></p>
      {picker}
      <Legend series={series} />
      <MultiLineChart series={series} axisMonths={ctx.lineMonths} />
      <p style={{ color: "var(--muted2)", fontSize: 11.5, marginTop: 14, lineHeight: 1.5 }}>Monthly premium derived from year-to-date figures; the financial year resets every April.</p>
    </div>);
  }
  const shown = all ? ranked : ranked.slice(0, 15);
  const items = shown.map((r) => ({ key: r.insurer, label: r.insurer, value: valOf(r), title: shortName(r.insurer) + " \u00B7 " + inr(valOf(r)) + " \u00B7 " + ((valOf(r) / total) * 100).toFixed(1) + "% of total" }));
  return (<div>
    <p className="ix-charth">Premium by insurer within a line of business<InfoButton info={INFO.segments} /></p>
    {picker}
    <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 22, paddingBottom: 18, borderBottom: "1px solid var(--line)" }}>
      <span style={{ fontFamily: "'Fraunces',Georgia,serif", fontVariantNumeric: "tabular-nums", fontSize: 28, color: "var(--gold)" }}>{inr(total)}</span>
      <span style={{ fontSize: 12.5, color: "var(--muted)" }}>total {sname} premium \u00B7 {ranked.length} insurers</span>
    </div>
    <HBarChart items={items} valueFmt={inr} tickFmt={axisFmt} colorFn={() => GOLD} />
    {ranked.length > 15 && <button className="ix-toggle" onClick={() => setAll((a) => !a)}>{all ? "Show top 15" : "Show all " + ranked.length}</button>}
  </div>);
}

/* ---------- 4. Micro ---------- */
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
  return (<div>
    <p className="ix-charth">Sub-segment split within a line of business \u00B7 {month.label}<InfoButton info={INFO.micro} /></p>
    <div className="ix-seg" style={{ flexWrap: "wrap", marginBottom: 24 }}>{MICRO.map((m) => <button key={m.id} data-active={mid === m.id} onClick={() => setMid(m.id)}>{m.tab}</button>)}</div>
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
      <span className="fl-serif" style={{ fontSize: 19, color: "var(--ivory)", fontWeight: 350 }}>{cfg.title}</span>
      <div className="ix-legend" style={{ marginBottom: 0 }}>{cfg.parts.map((p, i) => <span key={p[0]} style={{ color: "var(--muted)", fontSize: 11.5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: SERIES[i % 4] }} />{p[1]}</span>)}</div>
    </div>
    {withTotal.length === 0 ? <p style={{ color: "var(--muted2)", fontSize: 13 }}>No data for this segment in {month.label}.</p> : withTotal.map((r) => (
      <div key={r.insurer} className="ix-row" style={{ padding: "11px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}><span style={{ color: "var(--ivory)", fontSize: 13.5 }}>{r.insurer}</span><span style={{ fontFamily: "'Fraunces',Georgia,serif", fontVariantNumeric: "tabular-nums", fontSize: 14, color: "var(--muted)" }}>{inr(r._t)}</span></div>
        <div style={{ display: "flex", height: 11, borderRadius: 3, overflow: "hidden", background: "rgba(255,255,255,.045)" }}>{cfg.parts.map((p, i) => { const w = r._t > 0 ? ((r.current[p[0]] || 0) / r._t) * 100 : 0; return <div key={p[0]} title={p[1] + ": " + inr(r.current[p[0]]) + " (" + w.toFixed(0) + "%)"} style={{ width: w + "%", background: SERIES[i % 4] }} />; })}</div>
      </div>
    ))}
  </div>);
}

/* ---------- 5. Intelligence ---------- */
function Stat({ label, value, sub, delta }) {
  const up = delta != null && delta >= 0;
  return (<div style={{ background: "#0B0B0E", border: "1px solid var(--line)", borderRadius: 5, padding: "12px 14px" }}>
    <div style={{ fontSize: 9.5, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted2)" }}>{label}</div>
    <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontVariantNumeric: "tabular-nums", fontSize: 18, color: "var(--ivory)", marginTop: 6 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>{sub}</div>}
    {delta != null && <div style={{ fontSize: 12, color: up ? GREEN : RED, marginTop: 5 }}>{(up ? "\u25B2 +" : "\u25BC ") + (delta * 100).toFixed(1) + "%"}</div>}
  </div>);
}
function Intelligence({ rows, ctx }) {
  if (ctx.lineMonths.length < 3) return <p style={{ color: "var(--muted2)", fontSize: 13.5 }}>Select at least three months (use Range) to generate projections.<InfoButton info={INFO.intelligence} /></p>;
  const top = [...rows].map((r) => ({ r, v: ctx.getValue(clean(r.insurer), "Grand Total") || 0 })).sort((a, b) => b.v - a.v).slice(0, 12);
  return (<div>
    <p className="ix-charth" style={{ marginBottom: 8 }}>Weighted projection and prediction accuracy{ctx.isRange ? " \u00B7 selected window" : ""}<InfoButton info={INFO.intelligence} /></p>
    <p style={{ color: "var(--muted2)", fontSize: 11.5, marginBottom: 24, lineHeight: 1.5 }}>The projection is for the month after your selected window, using a weighted moving average of monthly premium. Where that month's actual exists, it is compared. Directional only.</p>
    {top.map(({ r }) => {
      const I = computeIntel(ctx.monthsAsc, ctx.winSet, clean(r.insurer));
      if (!I) return null;
      return (<div key={r.insurer} style={{ padding: "16px 12px", borderTop: "1px solid var(--line)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12, gap: 12 }}>
          <span style={{ color: "var(--ivory)", fontSize: 14 }}>{r.insurer}</span>
          <span style={{ fontFamily: "'Fraunces',Georgia,serif", fontVariantNumeric: "tabular-nums", fontSize: 14, color: "var(--muted)" }}>{inr(I.lastActual)}<span style={{ fontSize: 10.5, color: "var(--muted2)" }}> {I.lastLabel}</span></span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
          <Stat label={"Projected " + I.targetLabel} value={inr(Math.round(I.predicted))} delta={I.projGrowth} />
          {I.actualNext != null
            ? <Stat label={I.targetLabel + " \u00B7 predicted vs actual"} value={inr(Math.round(I.actualNext))} sub={"model expected " + inr(Math.round(I.predicted))} delta={I.variance} />
            : <Stat label={I.targetLabel + " \u00B7 outlook"} value="Future month" sub={"projected " + inr(Math.round(I.predicted)) + ", no actuals yet"} />}
        </div>
      </div>);
    })}
  </div>);
}

/* ---------- 6. Track Org (single insurer deep-dive) ---------- */
const TRACK_SEGS = [["Motor Total", "Motor"], ["Health", "Health"], ["Fire", "Fire"], ["Marine Total", "Marine"], ["Engineering", "Engineering"], ["Liability", "Liability"], ["P.A.", "P.A."], ["Aviation", "Aviation"], ["All Other Misc (Crop Insurance + Credit Guarantee+All other misc)", "Other Misc"]];
function TrackOrg({ rows, ctx, baseMonth }) {
  const names = useMemo(
    () => [...rows].sort((a, b) => (ctx.getValue(clean(b.insurer), "Grand Total") || 0) - (ctx.getValue(clean(a.insurer), "Grand Total") || 0)).map((r) => r.insurer),
    [rows, ctx]
  );
  const [who, setWho] = useState(names[0] || "");
  const subject = names.includes(who) ? who : names[0] || "";
  const [gmode, setGmode] = useState("yoy"); // yoy | mom

  if (!subject) return <p style={{ color: "var(--muted2)", fontSize: 13.5 }}>No insurers in this group.</p>;

  const rec = baseMonth.bySheet["Segmentwise Report"].records.find((r) => clean(r.insurer) === clean(subject));
  const premSeries = monthlySeries(ctx.monthsAsc, clean(subject), "Grand Total").filter((p) => ctx.winSet.has(p.period));
  const growthFull = gmode === "yoy" ? yoySeries(ctx.monthsAsc, subject, "Grand Total") : momSeries(ctx.monthsAsc, subject, "Grand Total");
  const growthPts = growthFull.filter((p) => ctx.winSet.has(p.period));

  /* momentum: trailing 3-month avg MoM vs the 3 months before that */
  const momFull = momSeries(ctx.monthsAsc, subject, "Grand Total");
  const inWin = momFull.filter((p) => ctx.winSet.has(p.period) && p.value != null);
  const recent = inWin.slice(-3).map((p) => p.value);
  const prior = inWin.slice(-6, -3).map((p) => p.value);
  const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
  const rAvg = avg(recent), pAvg = avg(prior);
  const momentum = rAvg != null && pAvg != null ? rAvg - pAvg : null;

  /* segment growth for the base month */
  const segItems = TRACK_SEGS.map(([key, label]) => {
    let v = null;
    if (gmode === "yoy") {
      const c = rec && rec.current ? rec.current[key] : null;
      const p = rec && rec.previous ? rec.previous[key] : null;
      if (c != null && p != null && p !== 0) v = (c - p) / p;
    } else {
      const s = momSeries(ctx.monthsAsc, subject, key);
      const pt = s.find((x) => x.period === baseMonth.period);
      v = pt ? pt.value : null;
    }
    const cur = rec && rec.current ? rec.current[key] : null;
    return { key, label, value: v, cur };
  }).filter((d) => d.value != null && d.cur != null && d.cur > 0);

  /* segment premium trend: top 4 segments by current value */
  const topSegs = TRACK_SEGS
    .map(([key, label]) => ({ key, label, v: rec && rec.current ? rec.current[key] || 0 : 0 }))
    .filter((s) => s.v > 0).sort((a, b) => b.v - a.v).slice(0, 4);
  const segSeries = topSegs.map((s, i) => ({
    name: s.label, color: SERIES[i % 4],
    points: monthlySeries(ctx.monthsAsc, clean(subject), s.key).filter((p) => ctx.winSet.has(p.period)),
  }));

  const latestPrem = [...premSeries].reverse().find((p) => p.value != null);
  const latestGrowth = [...growthPts].reverse().find((p) => p.value != null);
  const gLabel = gmode === "yoy" ? "YoY (YTD basis)" : "MoM (monthly basis)";

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 26 }}>
        <div>
          <div style={IXL}>Insurer</div>
          <select className="ix-select" value={subject} onChange={(e) => setWho(e.target.value)}>
            {names.map((n) => <option key={n} value={n}>{shortName(n)}</option>)}
          </select>
        </div>
        <div>
          <div style={IXL}>Growth basis</div>
          <Segmented value={gmode} onChange={setGmode} options={[{ v: "yoy", l: "YoY" }, { v: "mom", l: "MoM" }]} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(168px,1fr))", gap: 1, background: "var(--line)", border: "1px solid var(--line)", borderRadius: 6, overflow: "hidden", marginBottom: 34 }}>
        <Kpi label="Latest monthly premium" value={latestPrem ? inr(Math.round(latestPrem.value)) : "-"} sub={latestPrem ? monShort(latestPrem.period) : ""} />
        <Kpi label={"Latest " + (gmode === "yoy" ? "YoY growth" : "MoM growth")} value={latestGrowth ? pct(latestGrowth.value) : "-"} sub={latestGrowth ? monShort(latestGrowth.period) + " \u00B7 " + gLabel : ""} />
        <Kpi label="Market share" value={rec && rec.current && rec.current["Market %"] != null ? pct(Math.abs(rec.current["Market %"]) > 1 ? rec.current["Market %"] / 100 : rec.current["Market %"]) : "-"} sub={baseMonth.label + " \u00B7 YTD basis"} />
        <Kpi label="Momentum" value={momentum == null ? "-" : (momentum >= 0 ? "Accelerating" : "Decelerating")} sub={momentum == null ? "needs 6 months of data" : "3-mo avg MoM " + (momentum >= 0 ? "+" : "") + (momentum * 100).toFixed(1) + " pts vs prior 3-mo"} />
      </div>

      <p className="ix-charth">Monthly premium trend · {shortName(subject)}<InfoButton info={INFO.trackorg} /></p>
      <MultiLineChart series={[{ name: shortName(subject), color: GOLD, points: premSeries }]} axisMonths={ctx.lineMonths} />
      <p style={{ color: "var(--muted2)", fontSize: 11.5, margin: "14px 0 34px", lineHeight: 1.5 }}>Monthly premium derived from year-to-date figures; the financial year resets every April.</p>

      <p className="ix-charth">{gmode === "yoy" ? "Year-on-year growth over time (YTD basis)" : "Month-on-month growth over time (monthly basis)"}</p>
      <MultiLineChart series={[{ name: shortName(subject), color: gmode === "yoy" ? GREEN : "#94A7C7", points: growthPts }]} axisMonths={ctx.lineMonths} valueFmt={pct} tickFmt={pctTick} />
      <p style={{ color: "var(--muted2)", fontSize: 11.5, margin: "14px 0 34px", lineHeight: 1.5 }}>
        {gmode === "yoy" ? "YoY compares each month's year-to-date premium with the same point last financial year: a sustained-growth read." : "MoM compares each month's premium with the month before: a momentum read, more volatile by nature."}
      </p>

      <p className="ix-charth">Segment growth · {baseMonth.label} · {gmode === "yoy" ? "YoY" : "MoM"}</p>
      {segItems.length === 0 ? <p style={{ color: "var(--muted2)", fontSize: 13 }}>Not enough segment history for this basis in {baseMonth.label}.</p> : (
        <HBarChart
          items={segItems.map((d) => ({ key: d.key, label: d.label, value: d.value, title: d.label + " \u00B7 " + pct(d.value) + " \u00B7 " + inr(d.cur) + " YTD" }))}
          valueFmt={pct} tickFmt={pctTick} colorFn={(v) => (v >= 0 ? GREEN : RED)} signed
        />
      )}
      <p style={{ color: "var(--muted2)", fontSize: 11.5, margin: "14px 0 34px", lineHeight: 1.5 }}>Broad green across segments means growth is broad-based; one tall bar means it is concentrated in a single line of business.</p>

      {segSeries.length > 0 && (<>
        <p className="ix-charth">Segment premium trend · top {segSeries.length} segments</p>
        <Legend series={segSeries} />
        <MultiLineChart series={segSeries} axisMonths={ctx.lineMonths} />
      </>)}
    </div>
  );
}

/* ---------- 7. Custom Compare (insurer vs custom peer group) ---------- */
function CustomCompare({ rows, ctx }) {
  const ranked = useMemo(
    () => [...rows].sort((a, b) => (ctx.getValue(clean(b.insurer), "Grand Total") || 0) - (ctx.getValue(clean(a.insurer), "Grand Total") || 0)),
    [rows, ctx]
  );
  const names = ranked.map((r) => r.insurer);
  const [who, setWho] = useState(names[0] || "");
  const subject = names.includes(who) ? who : names[0] || "";
  const [peers, setPeers] = useState([]);
  const [metric, setMetric] = useState("prem"); // prem | yoy | mom

  if (!subject) return <p style={{ color: "var(--muted2)", fontSize: 13.5 }}>No insurers in this group.</p>;

  const validPeers = peers.filter((p) => names.includes(p) && clean(p) !== clean(subject));
  const togglePeer = (n) => setPeers((p) => (p.includes(n) ? p.filter((x) => x !== n) : [...p, n]));
  const presetTop10 = () => setPeers(names.filter((n) => clean(n) !== clean(subject)).slice(0, 10));
  const clearPeers = () => setPeers([]);

  const subjSeries =
    metric === "prem" ? monthlySeries(ctx.monthsAsc, clean(subject), "Grand Total")
    : metric === "yoy" ? yoySeries(ctx.monthsAsc, subject, "Grand Total")
    : momSeries(ctx.monthsAsc, subject, "Grand Total");
  const groupSeries =
    validPeers.length === 0 ? null
    : metric === "prem" ? groupAggSeries(ctx.monthsAsc, validPeers, "Grand Total").map((p) => ({ ...p, value: p.value == null ? null : p.value / validPeers.length }))
    : metric === "yoy" ? groupYoySeries(ctx.monthsAsc, validPeers, "Grand Total")
    : groupMomSeries(ctx.monthsAsc, validPeers, "Grand Total");

  const isPctM = metric !== "prem";
  const series = [
    { name: shortName(subject), color: GOLD, points: subjSeries.filter((p) => ctx.winSet.has(p.period)) },
    ...(groupSeries ? [{ name: "Peer group (" + validPeers.length + ")" + (metric === "prem" ? " \u00B7 avg" : ""), color: "#94A7C7", points: groupSeries.filter((p) => ctx.winSet.has(p.period)) }] : []),
  ];

  const last = (pts) => { const a = pts.filter((p) => p.value != null); return a.length ? a[a.length - 1] : null; };
  const sLast = last(series[0].points), gLast = series[1] ? last(series[1].points) : null;
  const spread = sLast && gLast && sLast.period === gLast.period ? sLast.value - gLast.value : null;
  const fmt = isPctM ? pct : (v) => inr(Math.round(v));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 22 }}>
        <div>
          <div style={IXL}>Subject insurer</div>
          <select className="ix-select" value={subject} onChange={(e) => { setWho(e.target.value); setPeers((p) => p.filter((x) => clean(x) !== clean(e.target.value))); }}>
            {names.map((n) => <option key={n} value={n}>{shortName(n)}</option>)}
          </select>
        </div>
        <div>
          <div style={IXL}>Metric</div>
          <Segmented value={metric} onChange={setMetric} options={[{ v: "prem", l: "Premium" }, { v: "yoy", l: "YoY" }, { v: "mom", l: "MoM" }]} />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <div style={{ ...IXL, marginBottom: 0 }}>Peer group</div>
        <button className="ix-toggle" style={{ marginTop: 0 }} onClick={presetTop10}>Top 10 by premium</button>
        {validPeers.length > 0 && <button className="ix-toggle" style={{ marginTop: 0 }} onClick={clearPeers}>Clear</button>}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginBottom: 26 }}>
        {names.filter((n) => clean(n) !== clean(subject)).map((n) => {
          const on = validPeers.includes(n);
          return <button key={n} className="ix-chip" data-on={on} onClick={() => togglePeer(n)}><span className="ix-dot" style={{ background: on ? "#94A7C7" : undefined }} />{shortName(n)}</button>;
        })}
      </div>

      {validPeers.length === 0 ? (
        <p style={{ color: "var(--muted2)", fontSize: 13.5 }}>Pick at least one peer above, or use Top 10 by premium.<InfoButton info={INFO.customcompare} /></p>
      ) : (<>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(168px,1fr))", gap: 1, background: "var(--line)", border: "1px solid var(--line)", borderRadius: 6, overflow: "hidden", marginBottom: 30 }}>
          <Kpi label={shortName(subject)} name value={sLast ? fmt(sLast.value) : "-"} sub={sLast ? monShort(sLast.period) : ""} />
          <Kpi label={"Peer group" + (metric === "prem" ? " (avg / insurer)" : "")} name value={gLast ? fmt(gLast.value) : "-"} sub={gLast ? monShort(gLast.period) + " \u00B7 " + validPeers.length + " insurers" : ""} />
          <Kpi label="Gap vs peers" name value={spread == null ? "-" : (spread >= 0 ? "+" : "") + (isPctM ? (spread * 100).toFixed(1) + " pts" : inr(Math.round(spread)))} sub={spread == null ? "latest common month unavailable" : spread >= 0 ? "ahead of the group" : "behind the group"} />
        </div>
        <p className="ix-charth">
          {metric === "prem" ? "Monthly premium \u00B7 subject vs peer average" : metric === "yoy" ? "YoY growth (YTD basis) \u00B7 subject vs aggregated peers" : "MoM growth \u00B7 subject vs aggregated peers"}
          <InfoButton info={INFO.customcompare} />
        </p>
        <Legend series={series} />
        <MultiLineChart series={series} axisMonths={ctx.lineMonths} valueFmt={isPctM ? pct : inr} tickFmt={isPctM ? pctTick : axisFmt} />
        <p style={{ color: "var(--muted2)", fontSize: 11.5, marginTop: 14, lineHeight: 1.5 }}>
          {metric === "prem"
            ? "Peer line is the group's aggregated monthly premium divided by the number of peers, so scales stay comparable."
            : "Peer growth is premium-weighted: computed on the aggregated premium of the whole group, so large peers count for more."}
        </p>
      </>)}
    </div>
  );
}
