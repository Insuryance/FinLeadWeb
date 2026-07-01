"use client";
import React, { useState, useMemo, useRef } from "react";

/* ---------- formatting ---------- */
const clean = (s) => (s == null ? "" : String(s).replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim());
const canonicalInsurer = (s) => {
  const value = clean(s);
  if (/^Bajaj (Allianz )?General Insurance/i.test(value)) return "Bajaj Allianz General Insurance Co Ltd";
  return value;
};
const displayInsurer = (s) => {
  const value = canonicalInsurer(s);
  if (value === "Bajaj Allianz General Insurance Co Ltd") return "Bajaj Allianz General Insurance";
  return value;
};
const inr = (n) => {
  if (n == null || isNaN(n)) return "-";
  if (Math.abs(n) >= 100000) return "\u20B9" + (n / 100000).toFixed(2) + "\u2009L Cr";
  return "\u20B9" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 }) + "\u2009Cr";
};
const pct = (x) => (x == null || isNaN(x) ? "-" : (x * 100).toFixed(1) + "%");
const pctTick = (x) => (x * 100).toFixed(0) + "%";
const shortName = (s) =>
  displayInsurer(s).replace(/ (General Insurance|Health Insurance|Insurance|Assurance|Co\.?|Company|Ltd\.?|Limited|of India)\b/gi, "")
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
const pctScaleForMonth = (month) => {
  const rows = month?.bySheet?.["Segmentwise Report"]?.records || [];
  const totalMarket = rows.reduce((sum, row) => sum + (row.current?.["Market %"] || 0), 0);
  return totalMarket > 2 ? 0.01 : 1;
};
const currentMetric = (rec, key, month) => {
  const value = rec?.current?.[key];
  if (value == null || isNaN(value)) return null;
  if (key === "Growth %" || key === "Market %") return value * pctScaleForMonth(month);
  return value;
};

/* de-cumulate YTD into per-month premium over the FULL timeline (resets each April) */
function monthlySeries(monthsAsc, name, key) {
  const pts = []; let prevYtd = null, prevFY = null;
  const targetName = canonicalInsurer(name);
  for (const m of monthsAsc) {
    const rec = m.bySheet["Segmentwise Report"].records.find((r) => canonicalInsurer(r.insurer) === targetName);
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
  const targetName = canonicalInsurer(name);
  return monthsAsc.map((m) => {
    const rec = m.bySheet["Segmentwise Report"].records.find((r) => canonicalInsurer(r.insurer) === targetName);
    return { period: m.period, label: m.label, value: currentMetric(rec, key, m) };
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

/* info trigger that opens a side panel, keeping charts unobstructed */
function InfoButton({ info, onOpen, isOpen }) {
  return (
    <span style={{ display: "inline-block", marginLeft: 9, verticalAlign: "middle" }}>
      <button onClick={() => onOpen(info)} aria-label={"About " + info.title} aria-expanded={isOpen} className="ix-info-btn" data-open={isOpen ? "true" : "false"}>i</button>
    </span>
  );
}
const INFO = {
  leaderboard: { title: "Leaderboard", what: "Ranks insurers by premium, year-on-year growth, or market share for the period you choose.", how: "Use the metric buttons to switch between Premium, Growth and Market share. For Premium, Bar Graph shows cumulative financial-year-to-date premium for the selected month or window, while Line Graph shows monthly premium and is not cumulative. Growth and Market share follow the values reported for each month." },
  compare: { title: "Compare", what: "Puts up to four insurers side by side across the main lines of business.", how: "Tap an insurer chip to add or remove it. In Premium, Bar Graph is cumulative financial-year-to-date, while Line Graph shows monthly premium and is not cumulative. Use the line view when you want month-by-month movement." },
  segments: { title: "Segments", what: "Shows which insurers write the most in a single line of business, such as Motor or Health.", how: "Pick a segment from the row of buttons. In Premium, Bar Graph shows cumulative financial-year-to-date premium, while Line Graph shows monthly premium and is not cumulative." },
  micro: { title: "Micro analysis", what: "Breaks one line of business into its sub-parts, for example Motor into Own Damage versus Third Party, and shows each insurer's split as a stacked bar.", how: "Pick a group (Motor, Marine, Health, Liability). Each bar shows one insurer; the coloured segments are the share of each sub-part for the selected month." },
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
        return (<g key={i}><line x1={x} y1={axisTop - 6} x2={x} y2={H - 4} stroke="rgba(255,255,255,.05)" /><text x={x} y={axisTop - 11} textAnchor="middle" fontSize="10.5" fill="#56534C" fontFamily="'Hanken Grotesk',sans-serif" style={{ fontVariantNumeric: "tabular-nums" }}>{tickFmt(v)}</text></g>);
      })}
      {signed && <line x1={zeroX} y1={axisTop - 6} x2={zeroX} y2={H - 4} stroke="rgba(255,255,255,.18)" />}
      {items.map((d, i) => {
        const v = d.value || 0; const cy = axisTop + i * rowH + rowH / 2;
        const x = xOf(v); const bx = Math.min(zeroX, x), bw = Math.max(2, Math.abs(x - zeroX));
        const col = colorFn(v, d);
        return (<g key={d.key || d.label}>
          <text x={labelW - 12} y={cy + 4} textAnchor="end" fontSize="13.5" fill="#F4F1EA" fontFamily="'Hanken Grotesk',sans-serif">{trunc(d.label, 24)}</text>
          <rect x={bx} y={cy - barH / 2} width={bw} height={barH} rx="2" fill={col}><title>{d.title}</title></rect>
          <text x={W} y={cy + 4} textAnchor="end" fontSize="13.5" fill={signed ? col : "#F4F1EA"} fontFamily="'Fraunces',Georgia,serif" style={{ fontVariantNumeric: "tabular-nums" }}>{valueFmt(v)}</text>
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
  const everyN = n > 24 ? Math.ceil(n / 8) : n > 12 ? Math.ceil(n / 7) : 1;
  return (
    <div ref={boxRef} style={{ position: "relative" }} onMouseMove={onMove} onMouseLeave={() => setHi(null)}>
      <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", height: "auto", overflow: "visible" }} role="img" aria-label="Line chart over time">
        {Array.from({ length: 5 }).map((_, i) => {
          const v = vmin + (span / 4) * i; const y = yOf(v);
          return (<g key={i}><line x1={padL} y1={y} x2={W - padR} y2={y} stroke="rgba(255,255,255,.055)" /><text x={padL - 10} y={y + 3.5} textAnchor="end" fontSize="10.5" fill="#56534C" fontFamily="'Hanken Grotesk',sans-serif" style={{ fontVariantNumeric: "tabular-nums" }}>{tickFmt(v)}</text></g>);
        })}
        {axisMonths.map((m, i) => {
          const cm = +m.period.slice(5, 7); const x = xOf(i);
          const show = i % everyN === 0 || i === n - 1;
          const showYear = cm === 4 || i === 0;
          return show ? (<g key={m.period}>
            <text x={x} y={H - padB + 19} textAnchor="middle" fontSize="10.5" fill={hi === i ? "#F4F1EA" : "#928E84"} fontFamily="'Hanken Grotesk',sans-serif">{MON[cm - 1]}</text>
            {showYear && <text x={x} y={H - padB + 32} textAnchor="middle" fontSize="10.5" fill="#56534C" fontFamily="'Hanken Grotesk',sans-serif">{"\u2019" + m.period.slice(2, 4)}</text>}
          </g>) : null;
        })}
        <line x1={padL} y1={padT + plotH} x2={W - padR} y2={padT + plotH} stroke="rgba(255,255,255,.16)" />
        {hi != null && <line x1={xOf(hi)} y1={padT} x2={xOf(hi)} y2={padT + plotH} stroke="rgba(217,201,163,.35)" strokeDasharray="3 3" />}
        {series.map((s) => {
          let d = "", started = false;
          const lastIndex = [...s.points].map((p) => p.value).reduce((acc, value, index) => (value != null ? index : acc), -1);
          s.points.forEach((p, i) => { if (p.value == null) { started = false; return; } d += (started ? " L " : " M ") + xOf(i).toFixed(1) + " " + yOf(p.value).toFixed(1); started = true; });
          return (<g key={s.name}>
            <path d={d} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" opacity={hi != null ? 0.9 : 1} />
            {s.points.map((p, i) => (p.value == null || (hi !== i && i !== lastIndex)) ? null : <circle key={i} cx={xOf(i)} cy={yOf(p.value)} r={hi === i ? 4.5 : 2.8} fill="#0B0B0E" stroke={s.color} strokeWidth={hi === i ? 2.2 : 1.5} />)}
          </g>);
        })}
      </svg>
      {hi != null && (
        <div style={{ position: "absolute", top: 0, right: 0, background: "rgba(13,13,17,.92)", border: "1px solid var(--line)", borderRadius: 8, padding: "10px 13px", pointerEvents: "none", backdropFilter: "blur(10px)", minWidth: 160 }}>
          <div style={{ fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted2)", marginBottom: 8 }}>{monShort(axisMonths[hi].period)}</div>
          {[...series].sort((a, b) => (b.points[hi]?.value || 0) - (a.points[hi]?.value || 0)).map((s) => (
            <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: s.color, flex: "none" }} />
              <span style={{ fontSize: 12.5, color: "var(--ivory)", flex: 1, whiteSpace: "nowrap" }}>{s.name}</span>
              <span style={{ fontFamily: "'Fraunces',Georgia,serif", fontVariantNumeric: "tabular-nums", fontSize: 13, color: "var(--ivory)" }}>{valueFmt(s.points[hi]?.value)}</span>
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
    points: (useMonthly ? monthlySeries(ctx.monthsAsc, canonicalInsurer(nm), "Grand Total") : rawSeries(ctx.monthsAsc, canonicalInsurer(nm), metric)).filter((p) => ctx.winSet.has(p.period)),
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
  const [activeInfo, setActiveInfo] = useState(INFO.leaderboard);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const isRange = mode === "range";
  // guards: From can never be after To
  const onFrom = (v) => { setRangeFrom(v); if (v > rangeTo) setRangeTo(v); };
  const onTo = (v) => { setRangeTo(v); if (v < rangeFrom) setRangeFrom(v); };
  const lo = rangeFrom, hi = rangeTo;

  const lineMonths = isRange ? monthsAsc.filter((m) => m.period >= lo && m.period <= hi) : monthsAsc;
  const winSet = useMemo(() => new Set(lineMonths.map((m) => m.period)), [lineMonths]);
  const baseMonth = isRange ? (lineMonths[lineMonths.length - 1] || monthsAsc[N - 1]) : (months.find((m) => m.period === period) || months[0]);
  const baseRecs = useMemo(() => {
    const map = {}; baseMonth.bySheet["Segmentwise Report"].records.forEach((r) => { map[canonicalInsurer(r.insurer)] = r; }); return map;
  }, [baseMonth]);
  const rows = useMemo(() => baseMonth.bySheet["Segmentwise Report"].records.filter((r) => group === "All" || r.group === group), [baseMonth, group]);

  const getValue = useMemo(() => {
    if (!isRange) return (name, key) => currentMetric(baseRecs[canonicalInsurer(name)], key, baseMonth);
    return (name, key) => monthlySeries(monthsAsc, name, key).reduce((a, p) => a + (winSet.has(p.period) && p.value != null ? p.value : 0), 0);
  }, [isRange, baseRecs, baseMonth, monthsAsc, winSet]);

  const ctx = { isRange, chartType, group, lineMonths, winSet, monthsAsc, getValue };

  const kpi = useMemo(() => {
    const ranked = [...rows].map((r) => ({ r, v: getValue(canonicalInsurer(r.insurer), "Grand Total") || 0 })).sort((a, b) => b.v - a.v);
    const grower = isRange ? null : [...rows]
      .filter((r) => currentMetric(r, "Growth %", baseMonth) != null && (r.current["Grand Total"] || 0) >= 200)
      .sort((a, b) => (currentMetric(b, "Growth %", baseMonth) || 0) - (currentMetric(a, "Growth %", baseMonth) || 0))[0];
    return { total: ranked.reduce((a, x) => a + x.v, 0), count: rows.length, leader: ranked[0], grower };
  }, [rows, getValue, isRange, baseMonth]);

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
          : <Kpi label="Fastest grower" name value={kpi.grower ? trunc(shortName(kpi.grower.insurer), 18) : "-"} sub={kpi.grower ? pct(currentMetric(kpi.grower, "Growth %", baseMonth)) + " YoY" : ""} />}
      </div>

      {/* tabs + chart toggle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "1px solid var(--line)", flexWrap: "wrap", gap: 12 }}>
        <div className="ix-tabs" style={{ borderBottom: "none" }}>
          {[["leaderboard", "Leaderboard"], ["compare", "Compare"], ["segments", "Segments"], ["micro", "Micro analysis"], ["intelligence", "Intelligence"]].map(([k, l]) => (
            <button key={k} className="ix-tab" data-active={tab === k} onClick={() => { setTab(k); setActiveInfo(INFO[k]); setIsInfoOpen(false); }}>{l}</button>
          ))}
        </div>
        {tab !== "micro" && tab !== "intelligence" && <div style={{ paddingBottom: 10 }}><Segmented value={chartType} onChange={setChartType} options={[{ v: "bar", l: "Bar Graph" }, { v: "line", l: "Line Graph" }]} /></div>}
      </div>

      <div className="ix-layout" style={{ marginTop: 34 }}>
        <div style={{ minWidth: 0 }}>
          {tab === "leaderboard" && <Leaderboard rows={rows} ctx={ctx} onOpenInfo={(info) => { setActiveInfo(info); setIsInfoOpen((open) => (activeInfo.title === info.title ? !open : true)); }} isInfoOpen={isInfoOpen} />}
          {tab === "compare" && <Compare rows={rows} ctx={ctx} onOpenInfo={(info) => { setActiveInfo(info); setIsInfoOpen((open) => (activeInfo.title === info.title ? !open : true)); }} isInfoOpen={isInfoOpen} />}
          {tab === "segments" && <Segments rows={rows} segments={baseMonth.bySheet["Segmentwise Report"].segments} ctx={ctx} onOpenInfo={(info) => { setActiveInfo(info); setIsInfoOpen((open) => (activeInfo.title === info.title ? !open : true)); }} isInfoOpen={isInfoOpen} />}
          {tab === "micro" && <Micro month={baseMonth} group={group} onOpenInfo={(info) => { setActiveInfo(info); setIsInfoOpen((open) => (activeInfo.title === info.title ? !open : true)); }} isInfoOpen={isInfoOpen} />}
          {tab === "intelligence" && <Intelligence rows={rows} ctx={ctx} onOpenInfo={(info) => { setActiveInfo(info); setIsInfoOpen((open) => (activeInfo.title === info.title ? !open : true)); }} isInfoOpen={isInfoOpen} />}
        </div>
        <aside className="ix-sidepanel" data-open={isInfoOpen ? "true" : "false"}>
          <div className="ix-sidepanel-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted2)", marginBottom: 6 }}>Definition</div>
                <div style={{ fontSize: 15, color: "var(--ivory)", fontWeight: 500 }}>{activeInfo.title}</div>
              </div>
              <button className="ix-sidepanel-close" onClick={() => setIsInfoOpen(false)} aria-label="Close definition">×</button>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6, marginBottom: 14 }}>{activeInfo.what}</div>
            <div style={{ fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted2)", marginBottom: 6 }}>How to use</div>
            <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6 }}>{activeInfo.how}</div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ---------- 1. Leaderboard ---------- */
function Leaderboard({ rows, ctx, onOpenInfo, isInfoOpen }) {
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
          ? (eff === "Grand Total" ? "Monthly premium over time" : eff === "Growth %" ? "Year-on-year growth over time" : "Market share over time") + " \u00B7 top four insurers"
          : (ctx.isRange ? "Premium written in window" : "Ranked by " + (eff === "Grand Total" ? "premium" : eff === "Growth %" ? "growth" : "market share"))}
        <InfoButton info={INFO.leaderboard} onOpen={onOpenInfo} isOpen={isInfoOpen} />
      </p>
      {showMetric && <Segmented value={sortKey} onChange={setSortKey} options={[{ v: "Grand Total", l: "Premium" }, { v: "Growth %", l: "Growth" }, { v: "Market %", l: "Market share" }]} />}
    </div>
  );

  if (ctx.chartType === "line") {
    const top = [...rows].sort((a, b) => (ctx.getValue(canonicalInsurer(b.insurer), "Grand Total") || 0) - (ctx.getValue(canonicalInsurer(a.insurer), "Grand Total") || 0)).slice(0, 4);
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

  const valOf = (r) => (
    eff === "Grand Total"
      ? (ctx.getValue(canonicalInsurer(r.insurer), "Grand Total") || 0)
      : (currentMetric(r, eff, ctx.lineMonths[ctx.lineMonths.length - 1] || ctx.monthsAsc[ctx.monthsAsc.length - 1]) || 0)
  );
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
function Compare({ rows, ctx, onOpenInfo, isInfoOpen }) {
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
  const heading = (txt) => <p className="ix-charth">{txt}<InfoButton info={INFO.compare} onOpen={onOpenInfo} isOpen={isInfoOpen} /></p>;

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
  const valAt = (name, key) => ctx.getValue(canonicalInsurer(name), key) || 0;
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
          {Array.from({ length: 5 }).map((_, i) => { const val = (top / 4) * i; const y = padT + plotH - (val / top) * plotH; return (<g key={i}><line x1={padL} y1={y} x2={W - padR} y2={y} stroke="rgba(255,255,255,.055)" /><text x={padL - 9} y={y + 3.5} textAnchor="end" fontSize="10.5" fill="#56534C" fontFamily="'Hanken Grotesk',sans-serif" style={{ fontVariantNumeric: "tabular-nums" }}>{axisFmt(val)}</text></g>); })}
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
function Segments({ rows, segments, ctx, onOpenInfo, isInfoOpen }) {
  const avail = MAIN_SEGS.filter((s) => segments.includes(s));
  const [sname, setSname] = useState(avail[0] || "Motor Total");
  const [all, setAll] = useState(false);
  const valOf = (r) => ctx.getValue(canonicalInsurer(r.insurer), sname) || 0;
  const ranked = [...rows].filter((r) => valOf(r) > 0).sort((a, b) => valOf(b) - valOf(a));
  const total = ranked.reduce((a, r) => a + valOf(r), 0);
  const picker = <div className="ix-seg" style={{ flexWrap: "wrap", marginBottom: 22 }}>{avail.map((s) => <button key={s} data-active={sname === s} onClick={() => { setSname(s); setAll(false); }}>{s}</button>)}</div>;

  if (ctx.chartType === "line") {
    const top = ranked.slice(0, 4);
    const series = seriesForMetric(ctx, top.map((r) => r.insurer), sname);
    return (<div>
      <p className="ix-charth">Monthly {sname} premium over time \u00B7 top four insurers<InfoButton info={INFO.segments} onOpen={onOpenInfo} isOpen={isInfoOpen} /></p>
      {picker}
      <Legend series={series} />
      <MultiLineChart series={series} axisMonths={ctx.lineMonths} />
      <p style={{ color: "var(--muted2)", fontSize: 11.5, marginTop: 14, lineHeight: 1.5 }}>Monthly premium derived from year-to-date figures; the financial year resets every April.</p>
    </div>);
  }
  const shown = all ? ranked : ranked.slice(0, 15);
  const items = shown.map((r) => ({ key: r.insurer, label: r.insurer, value: valOf(r), title: shortName(r.insurer) + " \u00B7 " + inr(valOf(r)) + " \u00B7 " + ((valOf(r) / total) * 100).toFixed(1) + "% of total" }));
  return (<div>
    <p className="ix-charth">Premium by insurer within a line of business<InfoButton info={INFO.segments} onOpen={onOpenInfo} isOpen={isInfoOpen} /></p>
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
function Micro({ month, group, onOpenInfo, isInfoOpen }) {
  const [mid, setMid] = useState("motor");
  const cfg = MICRO.find((m) => m.id === mid);
  const sheet = month.bySheet[cfg.sheet];
  const keys = cfg.parts.map((p) => p[0]);
  const rows = (sheet ? sheet.records : []).filter((r) => group === "All" || r.group === group);
  const withTotal = rows.map((r) => ({ ...r, _t: keys.reduce((a, k) => a + (r.current[k] || 0), 0) })).filter((r) => r._t > 0).sort((a, b) => b._t - a._t).slice(0, 12);
  return (<div>
    <p className="ix-charth">Sub-segment split within a line of business \u00B7 {month.label}<InfoButton info={INFO.micro} onOpen={onOpenInfo} isOpen={isInfoOpen} /></p>
    <div className="ix-seg" style={{ flexWrap: "wrap", marginBottom: 24 }}>{MICRO.map((m) => <button key={m.id} data-active={mid === m.id} onClick={() => setMid(m.id)}>{m.tab}</button>)}</div>
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
      <span className="fl-serif" style={{ fontSize: 19, color: "var(--ivory)", fontWeight: 350 }}>{cfg.title}</span>
      <div className="ix-legend" style={{ marginBottom: 0 }}>{cfg.parts.map((p, i) => <span key={p[0]} style={{ color: "var(--muted)", fontSize: 11.5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: SERIES[i % 4] }} />{p[1]}</span>)}</div>
    </div>
    {withTotal.length === 0 ? <p style={{ color: "var(--muted2)", fontSize: 13 }}>No data for this segment in {month.label}.</p> : withTotal.map((r) => (
      <div key={r.insurer} className="ix-row" style={{ padding: "11px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}><span style={{ color: "var(--ivory)", fontSize: 13.5 }}>{displayInsurer(r.insurer)}</span><span style={{ fontFamily: "'Fraunces',Georgia,serif", fontVariantNumeric: "tabular-nums", fontSize: 14, color: "var(--muted)" }}>{inr(r._t)}</span></div>
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
function Intelligence({ rows, ctx, onOpenInfo, isInfoOpen }) {
  if (ctx.lineMonths.length < 3) return <p style={{ color: "var(--muted2)", fontSize: 13.5 }}>Select at least three months (use Range) to generate projections.<InfoButton info={INFO.intelligence} onOpen={onOpenInfo} isOpen={isInfoOpen} /></p>;
  const top = [...rows].map((r) => ({ r, v: ctx.getValue(canonicalInsurer(r.insurer), "Grand Total") || 0 })).sort((a, b) => b.v - a.v).slice(0, 12);
  return (<div>
    <p className="ix-charth" style={{ marginBottom: 8 }}>Weighted projection and prediction accuracy{ctx.isRange ? " \u00B7 selected window" : ""}<InfoButton info={INFO.intelligence} onOpen={onOpenInfo} isOpen={isInfoOpen} /></p>
    <p style={{ color: "var(--muted2)", fontSize: 11.5, marginBottom: 24, lineHeight: 1.5 }}>The projection is for the month after your selected window, using a weighted moving average of monthly premium. Where that month's actual exists, it is compared. Directional only.</p>
    {top.map(({ r }) => {
      const I = computeIntel(ctx.monthsAsc, ctx.winSet, canonicalInsurer(r.insurer));
      if (!I) return null;
      return (<div key={r.insurer} style={{ padding: "16px 12px", borderTop: "1px solid var(--line)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12, gap: 12 }}>
          <span style={{ color: "var(--ivory)", fontSize: 14 }}>{displayInsurer(r.insurer)}</span>
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
