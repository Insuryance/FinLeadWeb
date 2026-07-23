"use client";

import React, { useMemo, useState } from "react";

const GOLD = "#D9C9A3";
const GREEN = "#9BC4A0";
const RED = "#D69A9A";
const BLUE = "#94A7C7";
const TYPES = [
  "Total",
  "Individual Single Premium",
  "Individual Non Single Premium",
  "Group Single Premium",
  "Group Non Single Premium",
  "Group Yearly Renewable Premium",
];

const short = (name) => name
  .replace(/LIFE INSURANCE COMPANY|INSURANCE COMPANY|LIFE INSURANCE|LIMITED\.?|CORPORATION OF INDIA/gi, "")
  .replace(/\s+/g, " ").trim();
const money = (n) => n == null ? "—" : `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })} Cr`;
const number = (n) => n == null ? "—" : Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
const percent = (n) => n == null || !Number.isFinite(Number(n)) ? "—" : `${Number(n).toFixed(1)}%`;
const actualRecords = (month) => (month?.records || []).filter((r) => r.group === "Private" || r.group === "LIC");
const field = (record, measure, type, period) => record?.[measure]?.[type]?.[period] ?? null;

function Kpi({ label, value, sub }) {
  return <div style={{ background: "#0B0B0E", padding: "17px 20px", minWidth: 0 }}>
    <div style={{ fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--muted2)" }}>{label}</div>
    <div className="fl-serif" style={{ fontSize: 24, color: "var(--ivory)", marginTop: 8, overflow: "hidden", textOverflow: "ellipsis" }}>{value}</div>
    <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 6 }}>{sub}</div>
  </div>;
}

function Bars({ rows, formatter, signed = false }) {
  const max = Math.max(1, ...rows.map((r) => Math.abs(r.value || 0)));
  return <div style={{ display: "grid", gap: 13 }}>
    {rows.map((r) => <div key={r.name} style={{ display: "grid", gridTemplateColumns: "minmax(120px, 190px) 1fr 105px", gap: 12, alignItems: "center" }}>
      <div title={r.name} style={{ color: "var(--ivory)", fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{short(r.name)}</div>
      <div style={{ height: 14, background: "rgba(255,255,255,.045)", position: "relative", borderRadius: 2 }}>
        <div style={{ width: `${Math.abs(r.value || 0) / max * 100}%`, height: "100%", borderRadius: 2, background: signed ? ((r.value || 0) >= 0 ? GREEN : RED) : GOLD }} />
      </div>
      <div style={{ textAlign: "right", fontSize: 12.5, color: signed ? ((r.value || 0) >= 0 ? GREEN : RED) : "var(--ivory)" }}>{formatter(r.value)}</div>
    </div>)}
  </div>;
}

function Trend({ months, insurers, measure, type }) {
  const width = 800, height = 330, left = 58, right = 18, top = 18, bottom = 44;
  const data = insurers.map((name) => ({ name, values: months.map((m) => field(actualRecords(m).find((r) => r.insurer === name), measure, type, "current_month")) }));
  const max = Math.max(1, ...data.flatMap((s) => s.values).filter((v) => v != null));
  const x = (i) => left + (months.length === 1 ? (width-left-right)/2 : i * (width-left-right)/(months.length-1));
  const y = (v) => top + (height-top-bottom) * (1 - v/max);
  const colors = [GOLD, BLUE, GREEN, "#C2A3B0"];
  return <>
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto" }} role="img" aria-label="Monthly life insurance trend">
      {[0, .25, .5, .75, 1].map((p) => <g key={p}>
        <line x1={left} x2={width-right} y1={y(max*p)} y2={y(max*p)} stroke="rgba(255,255,255,.06)" />
        <text x={left-10} y={y(max*p)+4} textAnchor="end" fill="#706C64" fontSize="10">{Math.round(max*p).toLocaleString("en-IN")}</text>
      </g>)}
      {months.map((m, i) => <text key={m.period} x={x(i)} y={height-14} textAnchor="middle" fill="#928E84" fontSize="10">{m.period}</text>)}
      {data.map((s, si) => {
        const points = s.values.map((v, i) => v == null ? null : `${x(i)},${y(v)}`).filter(Boolean).join(" ");
        return <g key={s.name}><polyline points={points} fill="none" stroke={colors[si]} strokeWidth="2" />{s.values.map((v, i) => v == null ? null : <circle key={i} cx={x(i)} cy={y(v)} r="3" fill={colors[si]}><title>{`${s.name}: ${measure === "premium" ? money(v) : number(v)}`}</title></circle>)}</g>;
      })}
    </svg>
    <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>{data.map((s, i) => <span key={s.name} style={{ fontSize: 12, color: [GOLD, BLUE, GREEN, "#C2A3B0"][i] }}>● {short(s.name)}</span>)}</div>
  </>;
}

export default function LifeInsightExplorer({ months }) {
  const ordered = useMemo(() => [...months].sort((a, b) => a.period.localeCompare(b.period)), [months]);
  const [period, setPeriod] = useState(ordered.at(-1)?.period || "");
  const [measure, setMeasure] = useState("premium");
  const [type, setType] = useState("Total");
  const [metric, setMetric] = useState("current_upto");
  const [view, setView] = useState("leaderboard");
  const current = ordered.find((m) => m.period === period) || ordered.at(-1);
  const records = actualRecords(current);
  const ranked = [...records].map((r) => ({ name: r.insurer, group: r.group, value: field(r, measure, type, metric) })).sort((a,b) => (b.value || 0)-(a.value || 0));
  const total = (current?.records || []).find((r) => r.group === "Grand Total");
  const privateTotal = (current?.records || []).find((r) => r.group === "Private Total");
  const lic = records.find((r) => r.group === "LIC");
  const fmt = measure === "premium" ? money : number;
  const compareNames = ranked.slice(0, 4).map((r) => r.name);

  return <div>
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "space-between", alignItems: "end", marginBottom: 24 }}>
      <div><div className="ix-label">Month</div><select className="fl-input" value={period} onChange={(e) => setPeriod(e.target.value)} style={{ padding: "10px 12px" }}>{[...ordered].reverse().map((m) => <option key={m.period} value={m.period}>{m.label}</option>)}</select></div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[['leaderboard','Leaderboard'],['trend','Trend'],['mix','Business mix']].map(([v,l]) => <button key={v} className={`fl-btn ${view === v ? "fl-btn-shine" : "fl-btn-ghost"}`} onClick={() => setView(v)}>{l}</button>)}
      </div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 1, background: "var(--line)", marginBottom: 26 }}>
      <Kpi label="Industry premium" value={money(field(total, "premium", "Total", "current_upto"))} sub="Financial year to date" />
      <Kpi label="Industry policies" value={number(field(total, "policies", "Total", "current_upto"))} sub="Financial year to date" />
      <Kpi label="Private share" value={percent(100 * (field(privateTotal, "premium", "Total", "current_upto") || 0) / (field(total, "premium", "Total", "current_upto") || 1))} sub="Share of YTD premium" />
      <Kpi label="LIC growth" value={percent(field(lic, "premium", "Total", "ytd_variation_pct"))} sub="YTD premium variation" />
    </div>

    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
      <select className="fl-input" value={measure} onChange={(e) => setMeasure(e.target.value)} style={{ padding: "10px 12px" }}><option value="premium">Premium (₹ Cr)</option><option value="policies">Policies / schemes</option></select>
      <select className="fl-input" value={type} onChange={(e) => setType(e.target.value)} style={{ padding: "10px 12px" }}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
      {view === "leaderboard" && <select className="fl-input" value={metric} onChange={(e) => setMetric(e.target.value)} style={{ padding: "10px 12px" }}><option value="current_upto">YTD value</option><option value="current_month">Current month</option><option value="ytd_variation_pct">YTD growth</option></select>}
    </div>

    {view === "leaderboard" && <Bars rows={ranked.slice(0, 15)} formatter={metric === "ytd_variation_pct" ? percent : fmt} signed={metric === "ytd_variation_pct"} />}
    {view === "trend" && <Trend months={ordered} insurers={compareNames} measure={measure} type={type} />}
    {view === "mix" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>{ranked.slice(0, 8).map((r) => {
      const rec = records.find((x) => x.insurer === r.name); const denom = field(rec, measure, "Total", "current_upto") || 1;
      return <div key={r.name} style={{ border: "1px solid var(--line)", padding: 16 }}><div style={{ color: "var(--ivory)", fontSize: 13, marginBottom: 12 }}>{short(r.name)}</div>{TYPES.slice(1).map((t, i) => { const v = field(rec, measure, t, "current_upto") || 0; return <div key={t} style={{ marginTop: 8 }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--muted)" }}><span>{t.replace(" Premium", "")}</span><span>{percent(v/denom*100)}</span></div><div style={{ height: 5, background: "rgba(255,255,255,.05)", marginTop: 4 }}><div style={{ width: `${Math.max(0, v/denom*100)}%`, height: "100%", background: [GOLD,BLUE,GREEN,"#C2A3B0","#C9B07A"][i] }} /></div></div>})}</div>;
    })}</div>}
    <p style={{ color: "var(--muted2)", fontSize: 11.5, lineHeight: 1.6, marginTop: 24 }}>Premium figures are ₹ crore. “Policies” represents policies for individual business and schemes for group business, as reported by the Life Insurance Council. Growth values in the source are percentages (not decimal fractions).</p>
  </div>;
}
