"use client";

import React, { useMemo, useRef, useState } from "react";

const GOLD = "#D9C9A3";
const BLUE = "#94A7C7";
const GREEN = "#9BC4A0";
const RED = "#D69A9A";
const COLORS = [GOLD, BLUE, GREEN, "#C2A3B0", "#C9B07A", "#8FB8C4"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const TYPES = [
  "Total",
  "Individual Single Premium",
  "Individual Non Single Premium",
  "Group Single Premium",
  "Group Non Single Premium",
  "Group Yearly Renewable Premium",
];
const MIX_TYPES = TYPES.slice(1);
const VIEW_INFO = {
  leaderboard: {
    title: "Leaderboard",
    what: "Ranks life insurers by new-business premium or policy and scheme volumes for the reporting period you selected.",
    how: "Choose Premium or Policies, select a business type, then use Bar Graph for a selected-month ranking or Line Graph to monitor the leading insurers through your selected month or range.",
  },
  growth: {
    title: "YoY & MoM growth",
    what: "Shows whether each insurer is expanding or contracting. YoY compares the year-to-date result with the same point last year; MoM compares the current month with the immediately preceding month.",
    how: "Choose YoY for the longer-term growth direction or MoM for short-term momentum. Use Bar Graph for the reporting-month snapshot and Line Graph to see whether growth is accelerating, slowing or volatile.",
  },
  mix: {
    title: "Business mix",
    what: "Explains how each insurer's new business is divided between individual single, individual non-single, group single, group non-single and group renewable business.",
    how: "Use Bar Graph to compare the complete YTD mix across all insurers. Use Line Graph, choose one insurer, and monitor how its monthly product mix changes over the selected period.",
  },
  compare: {
    title: "Custom compare",
    what: "Benchmarks one subject insurer against up to four life-insurance peers selected by you.",
    how: "Choose the subject insurer, select peer chips, then choose Premium/Volume, YoY or MoM. Bar Graph compares the reporting month; Line Graph compares movement across the selected period.",
  },
  insights: {
    title: "Insights",
    what: "Summarises notable signals in the selected reporting month, including the market leader, strongest YoY growth, strongest monthly momentum and private-sector market share.",
    how: "Use these cards as starting points for investigation, then open Leaderboard, Growth, Business Mix or Custom Compare to validate what is driving the signal.",
  },
};
const SUBJECT_INFO = {
  title: "Subject insurer",
  what: "The life insurer you want to study. It becomes the main benchmark in Custom Compare.",
  how: "Choose one subject insurer, then select up to four peers. The subject and peer values appear together in the overview and chart.",
};
const GROWTH_INSURER_INFO = {
  title: "Insurers to analyse",
  what: "Controls which life insurers appear in the YoY or MoM growth chart.",
  how: "Select one insurer for a focused trend or choose several insurers to compare. After that, choose the measure and business type you want to analyse.",
};

const cleanName = (name = "") => {
  if (/LIFE INSURANCE CORPORATION OF INDIA/i.test(name)) return "LIC";
  const cleaned = name
    .replace(/LIFE INSURANCE COMPANY|INSURANCE COMPANY|LIFE INSURANCE|LIMITED\.?|CORPORATION OF INDIA/gi, "")
    .replace(/\s+/g, " ").trim();
  return cleaned || name;
};
const money = (value) => value == null ? "—" : `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 1 })} Cr`;
const number = (value) => value == null ? "—" : Number(value).toLocaleString("en-IN", { maximumFractionDigits: 0 });
const percent = (value) => value == null || !Number.isFinite(Number(value)) ? "—" : `${Number(value).toFixed(1)}%`;
const compactNumber = (value) => {
  const amount = Math.abs(value);
  if (amount >= 100000) return `${(value / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return Number(value).toFixed(0);
};
const actualRecords = (month) => (month?.records || []).filter((record) => record.group === "Private" || record.group === "LIC");
const findRecord = (month, name) => actualRecords(month).find((record) => record.insurer === name);
const field = (record, measure, type, key) => record?.[measure]?.[type]?.[key] ?? null;
const shortPeriod = (period) => {
  const [year, month] = period.split("-");
  return `${MONTHS[Number(month) - 1]} ’${year.slice(2)}`;
};
const typeLabel = (type) => type.replace(" Premium", "").replace("Individual ", "Ind. ").replace("Group ", "Grp. ");

function monthlyGrowth(months, name, measure, type, index) {
  if (index < 1) return null;
  const current = field(findRecord(months[index], name), measure, type, "current_month");
  const previous = field(findRecord(months[index - 1], name), measure, type, "current_month");
  return current != null && previous != null && previous !== 0
    ? ((current - previous) / Math.abs(previous)) * 100
    : null;
}

function CompactTabs({ value, onChange, options, label }) {
  return (
    <div role="group" aria-label={label} style={{ display: "inline-flex", gap: 3, padding: 3, border: "1px solid var(--line)", borderRadius: 8, background: "#0B0B0E", flexWrap: "wrap" }}>
      {options.map(([key, text]) => (
        <button
          key={key}
          type="button"
          aria-pressed={value === key}
          onClick={() => onChange(key)}
          style={{
            border: 0,
            borderRadius: 6,
            padding: "8px 12px",
            background: value === key ? "var(--gold)" : "transparent",
            color: value === key ? "#0B0B0E" : "var(--muted)",
            font: "inherit",
            fontSize: 12,
            fontWeight: value === key ? 600 : 450,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

function InfoButton({ info }) {
  const [open, setOpen] = useState(false);
  return (
    <span
      style={{ position: "relative", display: "inline-flex", marginLeft: 8, verticalAlign: "middle" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={`About ${info.title}`}
        aria-expanded={open}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen(true)}
        style={{
          width: 18,
          height: 18,
          padding: 0,
          border: "1px solid var(--gold-deep)",
          borderRadius: "50%",
          background: open ? "var(--gold)" : "transparent",
          color: open ? "#0B0B0E" : "var(--gold)",
          fontFamily: "Georgia,serif",
          fontSize: 11,
          fontStyle: "italic",
          lineHeight: 1,
          cursor: "help",
        }}
      >
        i
      </button>

      {open && (
        <span
          role="tooltip"
          style={{
            position: "absolute",
            top: 25,
            left: 0,
            zIndex: 40,
            width: "min(320px, calc(100vw - 64px))",
            padding: "15px 16px",
            border: "1px solid var(--line)",
            borderRadius: 9,
            background: "rgba(11,11,14,.97)",
            boxShadow: "0 18px 48px rgba(0,0,0,.48)",
            backdropFilter: "blur(10px)",
            color: "var(--ivory)",
            whiteSpace: "normal",
          }}
        >
          <span style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{info.title}</span>
          <span style={{ display: "block", color: "var(--muted2)", fontSize: 9.5, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 5 }}>What this shows</span>
          <span style={{ display: "block", color: "var(--muted)", fontSize: 11.5, lineHeight: 1.55 }}>{info.what}</span>
          <span style={{ display: "block", color: "var(--muted2)", fontSize: 9.5, letterSpacing: ".14em", textTransform: "uppercase", margin: "11px 0 5px" }}>How to use it</span>
          <span style={{ display: "block", color: "var(--muted)", fontSize: 11.5, lineHeight: 1.55 }}>{info.how}</span>
        </span>
      )}
    </span>
  );
}

function ViewHelp({ view }) {
  const info = VIEW_INFO[view];
  return (
    <div style={{ display: "flex", alignItems: "center", margin: "-8px 0 22px", color: "var(--muted)" }}>
      <span style={{ fontSize: 11.5 }}>
        {view === "leaderboard" && "Rank insurers and monitor market movement."}
        {view === "growth" && "Compare longer-term growth with short-term momentum."}
        {view === "mix" && "Analyse individual and group product composition."}
        {view === "compare" && "Benchmark one insurer against peers you choose."}
        {view === "insights" && "Review the most notable signals in the selected month."}
      </span>
      <InfoButton info={info} />
    </div>
  );
}

function Select({ label, value, onChange, children, wide = false }) {
  return (
    <label style={{ display: "grid", gap: 7 }}>
      <span style={{ fontSize: 9.5, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--muted2)" }}>{label}</span>
      <select
        className="fl-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{ minWidth: wide ? 200 : 155, minHeight: 42, padding: "10px 34px 10px 12px", fontSize: 13 }}
      >
        {children}
      </select>
    </label>
  );
}

function InsurerPicker({ label, names, value, onChange, info }) {
  const [query, setQuery] = useState("");
  const visibleNames = names.filter((name) => cleanName(name).toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 9.5, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--muted2)" }}>{label}</span>
        {info && <InfoButton info={info} />}
      </div>
      <input
        className="fl-input"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search life insurers"
        aria-label={`Search ${label.toLowerCase()}`}
        style={{ width: "min(360px, 100%)", minHeight: 40, padding: "9px 12px", fontSize: 12.5, marginBottom: 10 }}
      />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, maxHeight: 126, overflowY: "auto", paddingRight: 4 }}>
        {visibleNames.map((name) => {
          const active = value === name;
          return (
            <button
              key={name}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(name)}
              style={{
                border: `1px solid ${active ? "var(--gold-deep)" : "var(--line)"}`,
                borderRadius: 999,
                padding: "7px 10px",
                background: active ? "rgba(217,201,163,.12)" : "transparent",
                color: active ? "var(--gold)" : "var(--muted)",
                font: "inherit",
                fontSize: 10.5,
                cursor: "pointer",
              }}
            >
              {cleanName(name)}
            </button>
          );
        })}
        {!visibleNames.length && <span style={{ color: "var(--muted2)", fontSize: 11.5 }}>No matching insurer.</span>}
      </div>
    </div>
  );
}

function MultiInsurerPicker({ label, names, values, onChange, recommended, max = 6, info }) {
  const [query, setQuery] = useState("");
  const visibleNames = names.filter((name) => cleanName(name).toLowerCase().includes(query.trim().toLowerCase()));
  const toggle = (name) => {
    if (values.includes(name)) onChange(values.filter((item) => item !== name));
    else if (values.length < max) onChange([...values, name]);
  };

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ fontSize: 9.5, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--muted2)" }}>{label}</span>
          {info && <InfoButton info={info} />}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" onClick={() => onChange(recommended.slice(0, max))} style={{ border: 0, background: "transparent", color: "var(--gold)", font: "inherit", fontSize: 10.5, cursor: "pointer" }}>Top {Math.min(max, recommended.length)}</button>
          <button type="button" onClick={() => onChange([])} style={{ border: 0, background: "transparent", color: "var(--muted)", font: "inherit", fontSize: 10.5, cursor: "pointer" }}>Clear</button>
        </div>
      </div>
      <input
        className="fl-input"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search life insurers"
        aria-label={`Search ${label.toLowerCase()}`}
        style={{ width: "min(360px, 100%)", minHeight: 40, padding: "9px 12px", fontSize: 12.5, marginBottom: 10 }}
      />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, maxHeight: 126, overflowY: "auto", paddingRight: 4 }}>
        {visibleNames.map((name) => {
          const active = values.includes(name);
          const unavailable = !active && values.length >= max;
          return (
            <button
              key={name}
              type="button"
              aria-pressed={active}
              disabled={unavailable}
              onClick={() => toggle(name)}
              style={{
                border: `1px solid ${active ? "var(--gold-deep)" : "var(--line)"}`,
                borderRadius: 999,
                padding: "7px 10px",
                background: active ? "rgba(217,201,163,.12)" : "transparent",
                color: active ? "var(--gold)" : "var(--muted)",
                opacity: unavailable ? .42 : 1,
                font: "inherit",
                fontSize: 10.5,
                cursor: unavailable ? "not-allowed" : "pointer",
              }}
            >
              {cleanName(name)}
            </button>
          );
        })}
      </div>
      <div style={{ color: "var(--muted2)", fontSize: 10.5, marginTop: 8 }}>{values.length} of {max} insurers selected</div>
    </div>
  );
}

function Kpi({ label, value, sub }) {
  return (
    <div style={{ background: "#0B0B0E", padding: "14px 16px", minWidth: 0 }}>
      <div style={{ fontSize: 9.5, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted2)" }}>{label}</div>
      <div className="fl-serif" style={{ fontSize: 20, color: "var(--ivory)", marginTop: 7, overflow: "hidden", textOverflow: "ellipsis" }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 5 }}>{sub}</div>
    </div>
  );
}

function BarChart({ rows, formatter, signed = false, limit }) {
  const shown = limit ? rows.slice(0, limit) : rows;
  const max = Math.max(1, ...shown.map((row) => Math.abs(row.value || 0)));
  return (
    <div style={{ display: "grid", gap: 11 }}>
      {shown.map((row) => (
        <div key={row.name} style={{ display: "grid", gridTemplateColumns: "minmax(110px,185px) minmax(90px,1fr) 105px", gap: 10, alignItems: "center" }}>
          <div title={row.name} style={{ color: "var(--ivory)", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cleanName(row.name)}</div>
          <div title={`${cleanName(row.name)}: ${formatter(row.value)}`} style={{ height: 12, background: "rgba(255,255,255,.045)", borderRadius: 2, cursor: "help" }}>
            <div style={{ width: `${Math.abs(row.value || 0) / max * 100}%`, height: "100%", borderRadius: 2, background: signed ? ((row.value || 0) >= 0 ? GREEN : RED) : GOLD }} />
          </div>
          <div style={{ textAlign: "right", fontSize: 12, color: signed ? ((row.value || 0) >= 0 ? GREEN : RED) : "var(--ivory)" }}>{formatter(row.value)}</div>
        </div>
      ))}
    </div>
  );
}

function LineChart({ months, series, formatter, axisFormatter = compactNumber, signed = false }) {
  const W = 820, H = 350, L = 60, R = 18, T = 18, B = 52;
  const boxRef = useRef(null);
  const [hoverIndex, setHoverIndex] = useState(null);
  const values = series.flatMap((item) => item.values).filter((value) => value != null && Number.isFinite(value));
  const minValue = signed ? Math.min(0, ...values) : 0;
  const maxValue = Math.max(1, ...values);
  const span = maxValue - minValue || 1;
  const x = (index) => L + (months.length < 2 ? (W - L - R) / 2 : index * (W - L - R) / (months.length - 1));
  const y = (value) => T + (H - T - B) * (1 - (value - minValue) / span);
  const labelEvery = Math.max(1, Math.ceil(months.length / 9));
  const onPointerMove = (event) => {
    if (!boxRef.current || months.length < 1) return;
    const rect = boxRef.current.getBoundingClientRect();
    const svgX = ((event.clientX - rect.left) / rect.width) * W;
    const rawIndex = months.length < 2 ? 0 : Math.round(((svgX - L) / (W - L - R)) * (months.length - 1));
    setHoverIndex(Math.max(0, Math.min(months.length - 1, rawIndex)));
  };

  if (!months.length || !values.length) return <p style={{ color: "var(--muted2)", fontSize: 12.5 }}>Not enough data for this line chart.</p>;

  return (
    <div
      ref={boxRef}
      style={{ position: "relative" }}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setHoverIndex(null)}
    >
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="Life insurance trend chart">
        {[0, .25, .5, .75, 1].map((part) => {
          const value = minValue + span * part;
          return <g key={part}>
            <line x1={L} x2={W - R} y1={y(value)} y2={y(value)} stroke="rgba(255,255,255,.06)" />
            <text x={L - 9} y={y(value) + 4} textAnchor="end" fill="#706C64" fontSize="9.5">{axisFormatter(value)}</text>
          </g>;
        })}
        {signed && minValue < 0 && <line x1={L} x2={W - R} y1={y(0)} y2={y(0)} stroke="rgba(255,255,255,.2)" />}
        {months.map((month, index) => {
          const show = index % labelEvery === 0 || index === months.length - 1;
          return show ? <text key={month.period} x={x(index)} y={H - 18} textAnchor="middle" fill="#928E84" fontSize="10">{shortPeriod(month.period)}</text> : null;
        })}
        {series.map((item, seriesIndex) => {
          const points = item.values.map((value, index) => value == null ? null : `${x(index)},${y(value)}`).filter(Boolean).join(" ");
          return <g key={item.name}>
            <polyline points={points} fill="none" stroke={COLORS[seriesIndex % COLORS.length]} strokeWidth="2" />
            {item.values.map((value, index) => value == null ? null : (
              <circle key={index} cx={x(index)} cy={y(value)} r="3" fill={COLORS[seriesIndex % COLORS.length]}>
                <title>{`${item.name}, ${months[index].label}: ${formatter(value)}`}</title>
              </circle>
            ))}
          </g>;
        })}
        {hoverIndex != null && (
          <g pointerEvents="none">
            <line
              x1={x(hoverIndex)}
              x2={x(hoverIndex)}
              y1={T}
              y2={H - B}
              stroke="rgba(217,201,163,.45)"
              strokeDasharray="3 4"
            />
            {series.map((item, seriesIndex) => {
              const value = item.values[hoverIndex];
              return value == null ? null : (
                <circle
                  key={item.name}
                  cx={x(hoverIndex)}
                  cy={y(value)}
                  r="5"
                  fill="#0B0B0E"
                  stroke={COLORS[seriesIndex % COLORS.length]}
                  strokeWidth="2.5"
                />
              );
            })}
          </g>
        )}
      </svg>

      {hoverIndex != null && (
        <div style={{
          position: "absolute",
          top: 10,
          right: 12,
          zIndex: 5,
          minWidth: 180,
          maxWidth: 270,
          padding: "12px 14px",
          border: "1px solid var(--line)",
          borderRadius: 8,
          background: "rgba(11,11,14,.94)",
          boxShadow: "0 12px 34px rgba(0,0,0,.38)",
          backdropFilter: "blur(8px)",
          pointerEvents: "none",
        }}>
          <div style={{ color: "var(--gold)", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 9 }}>
            {months[hoverIndex].label || shortPeriod(months[hoverIndex].period)}
          </div>
          <div style={{ display: "grid", gap: 7 }}>
            {series.map((item, seriesIndex) => {
              const value = item.values[hoverIndex];
              return value == null ? null : (
                <div key={item.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7, minWidth: 0, color: "var(--muted)", fontSize: 11.5 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", flex: "none", background: COLORS[seriesIndex % COLORS.length] }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cleanName(item.name)}</span>
                  </span>
                  <span style={{ color: "var(--ivory)", fontSize: 12, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                    {formatter(value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 7 }}>
        {series.map((item, index) => <span key={item.name} style={{ fontSize: 11.5, color: COLORS[index % COLORS.length] }}>● {cleanName(item.name)}</span>)}
      </div>
    </div>
  );
}

function MixBars({ records, measure }) {
  const sorted = [...records].sort((a, b) => (field(b, measure, "Total", "current_upto") || 0) - (field(a, measure, "Total", "current_upto") || 0));
  return (
    <div style={{ display: "grid", gap: 13 }}>
      {sorted.map((record) => {
        const total = field(record, measure, "Total", "current_upto") || 1;
        return (
          <div key={record.insurer} style={{ display: "grid", gridTemplateColumns: "minmax(115px,185px) 1fr", gap: 12, alignItems: "center" }}>
            <div title={record.insurer} style={{ color: "var(--ivory)", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cleanName(record.insurer)}</div>
            <div style={{ display: "flex", height: 14, overflow: "hidden", borderRadius: 2, background: "rgba(255,255,255,.04)" }}>
              {MIX_TYPES.map((type, index) => {
                const value = field(record, measure, type, "current_upto") || 0;
                const share = Math.max(0, value / total * 100);
                return <div key={type} title={`${cleanName(record.insurer)} · ${typeLabel(type)}: ${percent(share)}`} style={{ width: `${share}%`, background: COLORS[index], cursor: "help" }} />;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InsightCard({ eyebrow, title, body, color = GOLD }) {
  return (
    <article style={{ border: "1px solid var(--line)", borderRadius: 7, padding: "15px 16px", background: "rgba(11,11,14,.5)" }}>
      <div style={{ color, fontSize: 9, letterSpacing: ".15em", textTransform: "uppercase" }}>{eyebrow}</div>
      <div className="fl-serif" style={{ color: "var(--ivory)", fontSize: 17, marginTop: 8 }}>{title}</div>
      <p style={{ color: "var(--muted)", fontSize: 11.5, lineHeight: 1.55, margin: "7px 0 0" }}>{body}</p>
    </article>
  );
}

export default function LifeInsightExplorer({ months }) {
  const ordered = useMemo(() => [...months].sort((a, b) => a.period.localeCompare(b.period)), [months]);
  const lastPeriod = ordered.at(-1)?.period || "";
  const [periodMode, setPeriodMode] = useState("single");
  const [period, setPeriod] = useState(lastPeriod);
  const [rangeFrom, setRangeFrom] = useState(ordered[Math.max(0, ordered.length - 6)]?.period || lastPeriod);
  const [rangeTo, setRangeTo] = useState(lastPeriod);
  const [measure, setMeasure] = useState("premium");
  const [type, setType] = useState("Total");
  const [valueMode, setValueMode] = useState("current_upto");
  const [view, setView] = useState("leaderboard");
  const [chart, setChart] = useState("bar");
  const [growthMode, setGrowthMode] = useState("yoy");
  const [growthInsurerSelection, setGrowthInsurerSelection] = useState(null);
  const changePeriodMode = (mode) => {
    setPeriodMode(mode);
    if (mode === "single") setChart("bar");
  };

  const lineMonths = periodMode === "range"
    ? ordered.filter((month) => month.period >= rangeFrom && month.period <= rangeTo)
    : ordered.filter((month) => month.period <= period);
  const basePeriod = periodMode === "range" ? rangeTo : period;
  const baseIndex = Math.max(0, ordered.findIndex((month) => month.period === basePeriod));
  const baseMonth = ordered[baseIndex] || ordered.at(-1);
  const records = actualRecords(baseMonth);
  const formatter = measure === "premium" ? money : number;
  const total = (baseMonth?.records || []).find((record) => record.group === "Grand Total");
  const privateTotal = (baseMonth?.records || []).find((record) => record.group === "Private Total");
  const lic = records.find((record) => record.group === "LIC");

  const premiumLeaders = [...records].sort((a, b) =>
    (field(b, "premium", "Total", "current_upto") || 0) - (field(a, "premium", "Total", "current_upto") || 0)
  ).slice(0, 6).map((record) => record.insurer);
  const insurerNames = records.map((record) => record.insurer);
  const activeGrowthInsurers = (growthInsurerSelection === null ? premiumLeaders : growthInsurerSelection)
    .filter((name) => insurerNames.includes(name));

  const ranked = records.map((record) => ({ name: record.insurer, value: field(record, measure, type, valueMode) }))
    .sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity));
  const valueSeries = premiumLeaders.map((name) => ({
    name,
    values: lineMonths.map((month) => field(findRecord(month, name), measure, type, "current_month")),
  }));
  const growthRows = records.filter((record) => activeGrowthInsurers.includes(record.insurer)).map((record) => ({
    name: record.insurer,
    value: growthMode === "yoy"
      ? field(record, measure, type, "ytd_variation_pct")
      : monthlyGrowth(ordered, record.insurer, measure, type, baseIndex),
  })).sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity));
  const growthSeries = activeGrowthInsurers.map((name) => ({
    name,
    values: lineMonths.map((month) => {
      const index = ordered.findIndex((item) => item.period === month.period);
      return growthMode === "yoy"
        ? field(findRecord(month, name), measure, type, "ytd_variation_pct")
        : monthlyGrowth(ordered, name, measure, type, index);
    }),
  }));

  const industryPremium = field(total, "premium", "Total", "current_upto");
  const privatePremium = field(privateTotal, "premium", "Total", "current_upto");
  const privateShare = industryPremium ? privatePremium / industryPremium * 100 : null;
  const fastestYoy = records.map((record) => ({ name: record.insurer, value: field(record, "premium", "Total", "ytd_variation_pct") }))
    .filter((item) => item.value != null).sort((a, b) => b.value - a.value)[0];
  const fastestMom = records.map((record) => ({ name: record.insurer, value: monthlyGrowth(ordered, record.insurer, "premium", "Total", baseIndex) }))
    .filter((item) => item.value != null).sort((a, b) => b.value - a.value)[0];

  return (
    <div>
      <section style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 18, flexWrap: "wrap", paddingBottom: 22, borderBottom: "1px solid var(--line)" }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: ".17em", textTransform: "uppercase", color: "var(--muted2)", marginBottom: 9 }}>Reporting period</div>
          <CompactTabs value={periodMode} onChange={changePeriodMode} label="Reporting period mode" options={[["single", "Single month"], ["range", "Range"]]} />
        </div>
        {periodMode === "single" ? (
          <Select label="Reporting month" value={period} onChange={setPeriod} wide>
            {[...ordered].reverse().map((month) => <option key={month.period} value={month.period}>{month.label}</option>)}
          </Select>
        ) : (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Select label="From" value={rangeFrom} onChange={(value) => { setRangeFrom(value); if (value > rangeTo) setRangeTo(value); }} wide>
              {ordered.filter((month) => month.period <= rangeTo).map((month) => <option key={month.period} value={month.period}>{month.label}</option>)}
            </Select>
            <Select label="To" value={rangeTo} onChange={(value) => { setRangeTo(value); if (value < rangeFrom) setRangeFrom(value); }} wide>
              {ordered.filter((month) => month.period >= rangeFrom).map((month) => <option key={month.period} value={month.period}>{month.label}</option>)}
            </Select>
          </div>
        )}
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 1, background: "var(--line)", margin: "22px 0" }}>
        <Kpi label="Industry premium" value={money(industryPremium)} sub="Financial year to date" />
        <Kpi label="Industry policies" value={number(field(total, "policies", "Total", "current_upto"))} sub="Financial year to date" />
        <Kpi label="Private share" value={percent(privateShare)} sub="Share of YTD premium" />
        <Kpi label="LIC growth" value={percent(field(lic, "premium", "Total", "ytd_variation_pct"))} sub="YTD premium variation" />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", paddingBottom: 12, borderBottom: "1px solid var(--line)", marginBottom: 22 }}>
        <CompactTabs value={view} onChange={setView} label="Life dashboard view" options={[
          ["leaderboard", "Leaderboard"],
          ["growth", "YoY & MoM"],
          ["mix", "Business mix"],
          ["compare", "Custom compare"],
          ["insights", "Insights"],
        ]} />
        {(view === "leaderboard" || view === "growth" || view === "mix" || view === "compare") && (
          <CompactTabs
            value={chart}
            onChange={setChart}
            label="Chart type"
            options={periodMode === "range" ? [["bar", "Bar Graph"], ["line", "Line Graph"]] : [["bar", "Bar Graph"]]}
          />
        )}
      </div>

      <ViewHelp view={view} />

      {periodMode === "single" && view !== "insights" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: "10px 12px", margin: "-10px 0 22px", border: "1px solid var(--line)", borderRadius: 7, background: "rgba(217,201,163,.035)" }}>
          <span style={{ color: "var(--muted)", fontSize: 11.5 }}>Line Graph is available in Range mode because a trend needs more than one reporting month.</span>
          <button type="button" onClick={() => changePeriodMode("range")} style={{ border: 0, background: "transparent", color: "var(--gold)", font: "inherit", fontSize: 11.5, cursor: "pointer" }}>
            Choose a range →
          </button>
        </div>
      )}

      {view !== "insights" && (
        <>
        {view === "growth" && (
          <div style={{ marginBottom: 22 }}>
            <MultiInsurerPicker
              label="Insurers to analyse"
              names={insurerNames}
              values={activeGrowthInsurers}
              onChange={setGrowthInsurerSelection}
              recommended={premiumLeaders}
              info={GROWTH_INSURER_INFO}
            />
          </div>
        )}
        <div style={{ display: "flex", gap: 11, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 24 }}>
          <Select label="Measure" value={measure} onChange={setMeasure}>
            <option value="premium">Premium (₹ Cr)</option>
            <option value="policies">Policies / schemes</option>
          </Select>
          <Select label="Business type" value={type} onChange={setType} wide>
            <option value="Total">Total business</option>
            <option value="Individual Single Premium">Individual single</option>
            <option value="Individual Non Single Premium">Individual non-single / regular</option>
            <option value="Group Single Premium">Group single</option>
            <option value="Group Non Single Premium">Group non-single</option>
            <option value="Group Yearly Renewable Premium">Group yearly renewable</option>
          </Select>
          {view === "leaderboard" && chart === "bar" && (
            <Select label="Value basis" value={valueMode} onChange={setValueMode}>
              <option value="current_upto">YTD value</option>
              <option value="current_month">Current month</option>
            </Select>
          )}
          {view === "growth" && (
            <div>
              <div style={{ fontSize: 9.5, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--muted2)", marginBottom: 7 }}>Growth basis</div>
              <CompactTabs value={growthMode} onChange={setGrowthMode} label="Growth basis" options={[["yoy", "YoY"], ["mom", "MoM"]]} />
            </div>
          )}
        </div>
        </>
      )}

      {view === "leaderboard" && chart === "bar" && <BarChart rows={ranked} formatter={formatter} />}
      {view === "leaderboard" && chart === "line" && <LineChart months={lineMonths} series={valueSeries} formatter={formatter} />}
      {view === "growth" && activeGrowthInsurers.length === 0 && <p style={{ color: "var(--muted2)", fontSize: 12.5 }}>Choose at least one life insurer above.</p>}
      {view === "growth" && activeGrowthInsurers.length > 0 && chart === "bar" && <BarChart rows={growthRows} formatter={percent} signed />}
      {view === "growth" && activeGrowthInsurers.length > 0 && chart === "line" && <LineChart months={lineMonths} series={growthSeries} formatter={percent} axisFormatter={percent} signed />}

      {view === "mix" && (
        <BusinessMix
          chart={chart}
          records={records}
          months={lineMonths}
          measure={measure}
          formatter={formatter}
          defaultInsurer={premiumLeaders[0]}
        />
      )}

      {view === "compare" && (
        <CustomCompare
          chart={chart}
          records={records}
          allMonths={ordered}
          months={lineMonths}
          baseIndex={baseIndex}
          measure={measure}
          type={type}
          formatter={formatter}
        />
      )}

      {view === "insights" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 12 }}>
          <InsightCard eyebrow="Market leader" title={cleanName(premiumLeaders[0])} body={`Leads reported YTD new-business premium in ${baseMonth.label}.`} />
          <InsightCard eyebrow="YoY momentum" title={fastestYoy ? `${cleanName(fastestYoy.name)} · ${percent(fastestYoy.value)}` : "Not available"} body="Highest reported YTD premium growth among individual insurers." color={GREEN} />
          <InsightCard eyebrow="Monthly momentum" title={fastestMom ? `${cleanName(fastestMom.name)} · ${percent(fastestMom.value)}` : "Needs prior month"} body="Strongest month-on-month change in total new-business premium." color={fastestMom?.value >= 0 ? GREEN : RED} />
          <InsightCard eyebrow="Market structure" title={`Private insurers · ${percent(privateShare)}`} body="Combined private-sector share of industry YTD new-business premium." color={BLUE} />
        </div>
      )}

      <p style={{ color: "var(--muted2)", fontSize: 11, lineHeight: 1.6, marginTop: 25 }}>
        Premium figures are ₹ crore. YoY uses the source's YTD variation percentage. MoM compares reported current-month values with the immediately preceding monthly file.
      </p>
    </div>
  );
}

function BusinessMix({ chart, records, months, measure, formatter, defaultInsurer }) {
  const names = records.map((record) => record.insurer);
  const [selected, setSelected] = useState(defaultInsurer || names[0] || "");
  const insurer = names.includes(selected) ? selected : names[0];
  const series = MIX_TYPES.map((type) => ({
    name: typeLabel(type),
    values: months.map((month) => field(findRecord(month, insurer), measure, type, "current_month")),
  }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <div>
          <p className="ix-charth" style={{ margin: 0 }}>{chart === "bar" ? "Business mix · all life insurers" : "Business mix over time"}</p>
          <p style={{ color: "var(--muted2)", fontSize: 11.5, margin: "7px 0 0" }}>{chart === "bar" ? "Each bar totals 100% of the insurer's selected YTD business." : "Monthly business-type pattern for the selected insurer."}</p>
        </div>
      </div>
      {chart === "line" && (
        <div style={{ marginBottom: 22 }}>
          <InsurerPicker label="Life insurer to monitor" names={names} value={insurer} onChange={setSelected} />
        </div>
      )}
      {chart === "bar" ? (
        <>
          <div style={{ display: "flex", gap: 13, flexWrap: "wrap", marginBottom: 17 }}>
            {MIX_TYPES.map((type, index) => <span key={type} style={{ color: COLORS[index], fontSize: 10.5 }}>■ {typeLabel(type)}</span>)}
          </div>
          <MixBars records={records} measure={measure} />
        </>
      ) : <LineChart months={months} series={series} formatter={formatter} />}
    </div>
  );
}

function CustomCompare({ chart, records, allMonths, months, baseIndex, measure, type, formatter }) {
  const names = records.map((record) => record.insurer);
  const [subjectChoice, setSubjectChoice] = useState(names[0] || "");
  const subject = names.includes(subjectChoice) ? subjectChoice : names[0];
  const [peers, setPeers] = useState(() => names.slice(1, 4));
  const [metric, setMetric] = useState("value");
  const validPeers = peers.filter((name) => names.includes(name) && name !== subject).slice(0, 4);
  const selectedNames = [subject, ...validPeers];

  const valueAt = (name, month, index) => {
    if (metric === "yoy") return field(findRecord(month, name), measure, type, "ytd_variation_pct");
    if (metric === "mom") return monthlyGrowth(allMonths, name, measure, type, index);
    return field(findRecord(month, name), measure, type, "current_month");
  };
  const lineSeries = selectedNames.map((name) => ({
    name,
    values: months.map((month) => valueAt(name, month, allMonths.findIndex((item) => item.period === month.period))),
  }));
  const baseMonth = allMonths[baseIndex];
  const barRows = selectedNames.map((name) => ({ name, value: valueAt(name, baseMonth, baseIndex) }))
    .sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity));
  const isGrowth = metric !== "value";
  const subjectValue = valueAt(subject, baseMonth, baseIndex);
  const peerValues = validPeers.map((name) => valueAt(name, baseMonth, baseIndex)).filter((value) => value != null);
  const peerAverage = peerValues.length ? peerValues.reduce((sum, value) => sum + value, 0) / peerValues.length : null;
  const comparisonGap = subjectValue != null && peerAverage != null ? subjectValue - peerAverage : null;
  const comparisonFormatter = isGrowth ? percent : formatter;

  const togglePeer = (name) => {
    if (name === subject) return;
    setPeers((current) => current.includes(name) ? current.filter((item) => item !== name) : current.length < 4 ? [...current, name] : current);
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <InsurerPicker
          label="Subject insurer"
          names={names}
          value={subject}
          info={SUBJECT_INFO}
          onChange={(value) => {
            setSubjectChoice(value);
            setPeers((current) => current.filter((name) => name !== value));
          }}
        />
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 14, flexWrap: "wrap", marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 9.5, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--muted2)", marginBottom: 7 }}>Metric</div>
          <CompactTabs value={metric} onChange={setMetric} label="Comparison metric" options={[["value", "Premium / volume"], ["yoy", "YoY"], ["mom", "MoM"]]} />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 9 }}>
        <div style={{ fontSize: 9.5, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--muted2)" }}>Choose up to four peers</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" onClick={() => setPeers(names.filter((name) => name !== subject).slice(0, 3))} style={{ border: 0, background: "transparent", color: "var(--gold)", font: "inherit", fontSize: 10.5, cursor: "pointer" }}>Quick select 3</button>
          <button type="button" onClick={() => setPeers([])} style={{ border: 0, background: "transparent", color: "var(--muted)", font: "inherit", fontSize: 10.5, cursor: "pointer" }}>Clear</button>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 22 }}>
        {names.filter((name) => name !== subject).map((name) => {
          const active = validPeers.includes(name);
          return (
            <button key={name} type="button" onClick={() => togglePeer(name)} style={{
              border: `1px solid ${active ? "var(--gold-deep)" : "var(--line)"}`,
              borderRadius: 999,
              padding: "7px 10px",
              background: active ? "rgba(217,201,163,.1)" : "transparent",
              color: active ? "var(--gold)" : "var(--muted)",
              font: "inherit",
              fontSize: 10.5,
              cursor: "pointer",
            }}>{cleanName(name)}</button>
          );
        })}
      </div>

      {!validPeers.length ? (
        <p style={{ color: "var(--muted2)", fontSize: 12.5 }}>Choose at least one peer to create the comparison.</p>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 1, background: "var(--line)", marginBottom: 22 }}>
            <Kpi label={cleanName(subject)} value={comparisonFormatter(subjectValue)} sub={`${baseMonth.label} · subject`} />
            <Kpi label="Peer average" value={comparisonFormatter(peerAverage)} sub={`${validPeers.length} selected ${validPeers.length === 1 ? "peer" : "peers"}`} />
            <Kpi
              label="Gap vs peers"
              value={comparisonGap == null ? "—" : isGrowth ? `${comparisonGap >= 0 ? "+" : ""}${comparisonGap.toFixed(1)} pts` : `${comparisonGap >= 0 ? "+" : ""}${comparisonFormatter(comparisonGap)}`}
              sub={comparisonGap == null ? "Not available" : comparisonGap >= 0 ? "Subject is ahead" : "Subject is behind"}
            />
          </div>

          {chart === "bar"
            ? <BarChart rows={barRows} formatter={isGrowth ? percent : formatter} signed={isGrowth} />
            : <LineChart months={months} series={lineSeries} formatter={isGrowth ? percent : formatter} axisFormatter={isGrowth ? percent : compactNumber} signed={isGrowth} />}
        </>
      )}
    </div>
  );
}
