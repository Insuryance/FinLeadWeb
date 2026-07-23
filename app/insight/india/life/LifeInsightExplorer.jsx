"use client";

import React, { useMemo, useState } from "react";

const GOLD = "#D9C9A3";
const BLUE = "#94A7C7";
const GREEN = "#9BC4A0";
const RED = "#D69A9A";
const COLORS = [GOLD, BLUE, GREEN, "#C2A3B0", "#C9B07A", "#8FB8C4"];
const TYPES = [
  "Total",
  "Individual Single Premium",
  "Individual Non Single Premium",
  "Group Single Premium",
  "Group Non Single Premium",
  "Group Yearly Renewable Premium",
];

const short = (name = "") => name
  .replace(/LIFE INSURANCE COMPANY|INSURANCE COMPANY|LIFE INSURANCE|LIMITED\.?|CORPORATION OF INDIA/gi, "")
  .replace(/\s+/g, " ").trim();
const money = (n) => n == null ? "—" : `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })} Cr`;
const number = (n) => n == null ? "—" : Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
const percent = (n) => n == null || !Number.isFinite(Number(n)) ? "—" : `${Number(n).toFixed(1)}%`;
const actualRecords = (month) => (month?.records || []).filter((r) => r.group === "Private" || r.group === "LIC");
const field = (record, measure, type, key) => record?.[measure]?.[type]?.[key] ?? null;
const findRecord = (month, name) => actualRecords(month).find((r) => r.insurer === name);

function monthlyGrowth(months, name, measure, type, index) {
  if (index < 1) return null;
  const current = field(findRecord(months[index], name), measure, type, "current_month");
  const previous = field(findRecord(months[index - 1], name), measure, type, "current_month");
  return current != null && previous != null && previous !== 0
    ? ((current - previous) / Math.abs(previous)) * 100
    : null;
}

function Kpi({ label, value, sub }) {
  return (
    <div style={{ background: "#0B0B0E", padding: "17px 20px", minWidth: 0 }}>
      <div style={{ fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--muted2)" }}>{label}</div>
      <div className="fl-serif" style={{ fontSize: 24, color: "var(--ivory)", marginTop: 8, overflow: "hidden", textOverflow: "ellipsis" }}>{value}</div>
      <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 6 }}>{sub}</div>
    </div>
  );
}

function Controls({ children }) {
  return <div style={{ display: "flex", gap: 9, flexWrap: "wrap", alignItems: "center", marginBottom: 24 }}>{children}</div>;
}

function Tabs({ value, onChange, options }) {
  return (
    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
      {options.map(([key, label]) => (
        <button key={key} type="button" className={`fl-btn ${value === key ? "fl-btn-shine" : "fl-btn-ghost"}`} onClick={() => onChange(key)}>
          {label}
        </button>
      ))}
    </div>
  );
}

function BarChart({ rows, formatter, signed = false }) {
  const values = rows.map((row) => Math.abs(row.value || 0));
  const max = Math.max(1, ...values);
  return (
    <div style={{ display: "grid", gap: 13 }}>
      {rows.map((row) => (
        <div key={row.name} style={{ display: "grid", gridTemplateColumns: "minmax(115px,190px) minmax(90px,1fr) 110px", gap: 12, alignItems: "center" }}>
          <div title={row.name} style={{ color: "var(--ivory)", fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{short(row.name)}</div>
          <div style={{ height: 14, background: "rgba(255,255,255,.045)", borderRadius: 2 }}>
            <div style={{
              width: `${Math.abs(row.value || 0) / max * 100}%`,
              height: "100%",
              borderRadius: 2,
              background: signed ? ((row.value || 0) >= 0 ? GREEN : RED) : GOLD,
            }} />
          </div>
          <div style={{ textAlign: "right", fontSize: 12.5, color: signed ? ((row.value || 0) >= 0 ? GREEN : RED) : "var(--ivory)" }}>{formatter(row.value)}</div>
        </div>
      ))}
    </div>
  );
}

function LineChart({ months, series, formatter, signed = false }) {
  const W = 820, H = 360, L = 62, R = 18, T = 18, B = 48;
  const values = series.flatMap((item) => item.values).filter((v) => v != null && Number.isFinite(v));
  const minValue = signed ? Math.min(0, ...values) : 0;
  const maxValue = Math.max(1, ...values);
  const span = maxValue - minValue || 1;
  const x = (i) => L + (months.length < 2 ? (W - L - R) / 2 : i * (W - L - R) / (months.length - 1));
  const y = (v) => T + (H - T - B) * (1 - (v - minValue) / span);

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }} role="img" aria-label="Life insurance trend chart">
        {[0, .25, .5, .75, 1].map((p) => {
          const value = minValue + span * p;
          return <g key={p}>
            <line x1={L} x2={W - R} y1={y(value)} y2={y(value)} stroke="rgba(255,255,255,.06)" />
            <text x={L - 9} y={y(value) + 4} textAnchor="end" fill="#706C64" fontSize="9.5">{formatter(value)}</text>
          </g>;
        })}
        {signed && minValue < 0 && <line x1={L} x2={W - R} y1={y(0)} y2={y(0)} stroke="rgba(255,255,255,.2)" />}
        {months.map((month, i) => <text key={month.period} x={x(i)} y={H - 15} textAnchor="middle" fill="#928E84" fontSize="10">{month.period}</text>)}
        {series.map((item, si) => {
          const points = item.values.map((v, i) => v == null ? null : `${x(i)},${y(v)}`).filter(Boolean).join(" ");
          return <g key={item.name}>
            <polyline points={points} fill="none" stroke={COLORS[si % COLORS.length]} strokeWidth="2" />
            {item.values.map((v, i) => v == null ? null : <circle key={i} cx={x(i)} cy={y(v)} r="3" fill={COLORS[si % COLORS.length]}><title>{`${item.name}, ${months[i].label}: ${formatter(v)}`}</title></circle>)}
          </g>;
        })}
      </svg>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 6 }}>
        {series.map((item, i) => <span key={item.name} style={{ fontSize: 11.5, color: COLORS[i % COLORS.length] }}>● {short(item.name)}</span>)}
      </div>
    </>
  );
}

function InsightCard({ eyebrow, title, body, tone = GOLD }) {
  return (
    <article style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "18px 18px 20px", background: "rgba(11,11,14,.5)" }}>
      <div style={{ color: tone, fontSize: 9.5, letterSpacing: ".16em", textTransform: "uppercase" }}>{eyebrow}</div>
      <div className="fl-serif" style={{ color: "var(--ivory)", fontSize: 19, marginTop: 9 }}>{title}</div>
      <p style={{ color: "var(--muted)", fontSize: 12.5, lineHeight: 1.6, margin: "9px 0 0" }}>{body}</p>
    </article>
  );
}

export default function LifeInsightExplorer({ months }) {
  const ordered = useMemo(() => [...months].sort((a, b) => a.period.localeCompare(b.period)), [months]);
  const [period, setPeriod] = useState(ordered.at(-1)?.period || "");
  const [measure, setMeasure] = useState("premium");
  const [type, setType] = useState("Total");
  const [valueMode, setValueMode] = useState("current_upto");
  const [view, setView] = useState("leaderboard");
  const [chart, setChart] = useState("bar");
  const [growthMode, setGrowthMode] = useState("yoy");

  const currentIndex = Math.max(0, ordered.findIndex((month) => month.period === period));
  const current = ordered[currentIndex] || ordered.at(-1);
  const records = actualRecords(current);
  const formatter = measure === "premium" ? money : number;
  const total = (current?.records || []).find((r) => r.group === "Grand Total");
  const privateTotal = (current?.records || []).find((r) => r.group === "Private Total");
  const lic = records.find((r) => r.group === "LIC");

  const ranked = records.map((record) => ({
    name: record.insurer,
    value: field(record, measure, type, valueMode),
  })).sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity));

  const premiumLeaders = [...records].sort((a, b) =>
    (field(b, "premium", "Total", "current_upto") || 0) - (field(a, "premium", "Total", "current_upto") || 0)
  ).slice(0, 6).map((record) => record.insurer);

  const valueSeries = premiumLeaders.map((name) => ({
    name,
    values: ordered.map((month) => field(findRecord(month, name), measure, type, "current_month")),
  }));

  const growthRows = records.map((record) => ({
    name: record.insurer,
    value: growthMode === "yoy"
      ? field(record, measure, type, "ytd_variation_pct")
      : monthlyGrowth(ordered, record.insurer, measure, type, currentIndex),
  })).sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity));

  const growthSeries = premiumLeaders.map((name) => ({
    name,
    values: ordered.map((month, index) => growthMode === "yoy"
      ? field(findRecord(month, name), measure, type, "ytd_variation_pct")
      : monthlyGrowth(ordered, name, measure, type, index)),
  }));

  const industryPremium = field(total, "premium", "Total", "current_upto");
  const privatePremium = field(privateTotal, "premium", "Total", "current_upto");
  const privateShare = industryPremium ? privatePremium / industryPremium * 100 : null;
  const fastestYoy = [...records].map((record) => ({ name: record.insurer, value: field(record, "premium", "Total", "ytd_variation_pct") }))
    .filter((item) => item.value != null).sort((a, b) => b.value - a.value)[0];
  const fastestMom = [...records].map((record) => ({ name: record.insurer, value: monthlyGrowth(ordered, record.insurer, "premium", "Total", currentIndex) }))
    .filter((item) => item.value != null).sort((a, b) => b.value - a.value)[0];
  const individualPremium = (field(total, "premium", "Individual Single Premium", "current_upto") || 0)
    + (field(total, "premium", "Individual Non Single Premium", "current_upto") || 0);
  const individualShare = industryPremium ? individualPremium / industryPremium * 100 : null;

  return (
    <div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "space-between", alignItems: "end", marginBottom: 24 }}>
        <div>
          <div className="ix-label">Reporting month</div>
          <select className="fl-input" value={period} onChange={(e) => setPeriod(e.target.value)} style={{ padding: "10px 12px" }}>
            {[...ordered].reverse().map((month) => <option key={month.period} value={month.period}>{month.label}</option>)}
          </select>
        </div>
        <Tabs value={view} onChange={setView} options={[
          ["leaderboard", "Leaderboard"],
          ["growth", "YoY & MoM growth"],
          ["mix", "Business mix"],
          ["insights", "Insights"],
        ]} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 1, background: "var(--line)", marginBottom: 26 }}>
        <Kpi label="Industry premium" value={money(industryPremium)} sub="Financial year to date" />
        <Kpi label="Industry policies" value={number(field(total, "policies", "Total", "current_upto"))} sub="Financial year to date" />
        <Kpi label="Private share" value={percent(privateShare)} sub="Share of YTD premium" />
        <Kpi label="LIC growth" value={percent(field(lic, "premium", "Total", "ytd_variation_pct"))} sub="YTD premium variation" />
      </div>

      {view !== "insights" && <Controls>
        <select className="fl-input" value={measure} onChange={(e) => setMeasure(e.target.value)} style={{ padding: "10px 12px" }}>
          <option value="premium">Premium (₹ Cr)</option>
          <option value="policies">Policies / schemes</option>
        </select>
        <select className="fl-input" value={type} onChange={(e) => setType(e.target.value)} style={{ padding: "10px 12px" }}>
          {TYPES.map((item) => <option key={item}>{item}</option>)}
        </select>
        {view === "leaderboard" && <select className="fl-input" value={valueMode} onChange={(e) => setValueMode(e.target.value)} style={{ padding: "10px 12px" }}>
          <option value="current_upto">YTD value</option>
          <option value="current_month">Current month</option>
        </select>}
        {view === "growth" && <Tabs value={growthMode} onChange={setGrowthMode} options={[["yoy", "YoY growth"], ["mom", "MoM growth"]]} />}
        {(view === "leaderboard" || view === "growth") && <Tabs value={chart} onChange={setChart} options={[["bar", "Bar chart"], ["line", "Line chart"]]} />}
      </Controls>}

      {view === "leaderboard" && chart === "bar" && <BarChart rows={ranked} formatter={formatter} />}
      {view === "leaderboard" && chart === "line" && <LineChart months={ordered} series={valueSeries} formatter={formatter} />}

      {view === "growth" && chart === "bar" && (
        <>
          {growthMode === "mom" && currentIndex === 0
            ? <p className="fl-muted">MoM growth needs at least one earlier monthly file.</p>
            : <BarChart rows={growthRows} formatter={percent} signed />}
        </>
      )}
      {view === "growth" && chart === "line" && <LineChart months={ordered} series={growthSeries} formatter={percent} signed />}

      {view === "mix" && (
        <>
          <p className="fl-muted" style={{ fontSize: 12.5, margin: "0 0 18px" }}>
            Showing every life insurer reported for {current.label}. Each percentage is the insurer's share of selected YTD business.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
            {[...records].sort((a, b) => (field(b, measure, "Total", "current_upto") || 0) - (field(a, measure, "Total", "current_upto") || 0)).map((record) => {
              const denominator = field(record, measure, "Total", "current_upto") || 1;
              return <article key={record.insurer} style={{ border: "1px solid var(--line)", borderRadius: 7, padding: 16 }}>
                <div title={record.insurer} style={{ color: "var(--ivory)", fontSize: 13, marginBottom: 12 }}>{short(record.insurer)}</div>
                {TYPES.slice(1).map((item, index) => {
                  const value = field(record, measure, item, "current_upto") || 0;
                  const share = value / denominator * 100;
                  return <div key={item} style={{ marginTop: 9 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 10.5, color: "var(--muted)" }}>
                      <span>{item.replace(" Premium", "")}</span><span>{percent(share)}</span>
                    </div>
                    <div style={{ height: 5, background: "rgba(255,255,255,.05)", marginTop: 4 }}>
                      <div style={{ width: `${Math.min(100, Math.max(0, share))}%`, height: "100%", background: COLORS[index] }} />
                    </div>
                  </div>;
                })}
              </article>;
            })}
          </div>
        </>
      )}

      {view === "insights" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 14 }}>
          <InsightCard eyebrow="Market leader" title={short(premiumLeaders[0])} body={`Leads reported YTD new-business premium in ${current.label}.`} />
          <InsightCard eyebrow="YoY momentum" title={fastestYoy ? `${short(fastestYoy.name)} · ${percent(fastestYoy.value)}` : "Not available"} body="Highest reported YTD premium growth among individual insurers." tone={GREEN} />
          <InsightCard eyebrow="Monthly momentum" title={fastestMom ? `${short(fastestMom.name)} · ${percent(fastestMom.value)}` : "Needs prior month"} body="Strongest month-on-month change in total new-business premium." tone={fastestMom?.value >= 0 ? GREEN : RED} />
          <InsightCard eyebrow="Market structure" title={`Private insurers · ${percent(privateShare)}`} body="Combined private-sector share of total industry YTD new-business premium." tone={BLUE} />
          <InsightCard eyebrow="Business composition" title={`Individual · ${percent(individualShare)}`} body="Individual single and non-single premium as a share of total industry YTD premium." tone="#C2A3B0" />
          <InsightCard eyebrow="LIC direction" title={percent(field(lic, "premium", "Total", "ytd_variation_pct"))} body="LIC's reported YTD change in total new-business premium." tone={(field(lic, "premium", "Total", "ytd_variation_pct") || 0) >= 0 ? GREEN : RED} />
        </div>
      )}

      <p style={{ color: "var(--muted2)", fontSize: 11.5, lineHeight: 1.6, marginTop: 26 }}>
        Premium figures are ₹ crore. “Policies” represents policies for individual business and schemes for group business. YoY uses the source's YTD variation percentage. MoM compares reported current-month values with the immediately preceding file.
      </p>
    </div>
  );
}
