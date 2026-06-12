"use client";
import React, { useState, useEffect } from "react";

/* Loads SheetJS from CDN once, so no npm dependency is needed */
function useSheetJS() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (window.XLSX) { setReady(true); return; }
    const s = document.createElement("script");
    s.src = "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";
    s.onload = () => setReady(true);
    document.body.appendChild(s);
  }, []);
  return ready;
}

const SHEETS = {
  "Segmentwise Report": {},
  "Health Portfolio": {},
  "Liability Portfolio": {},
  "Miscellaneous portfolio": {},
};
const SECTIONS = { "General Insurers": "General", "Stand-alone Health Insurers": "Standalone Health", "Specialised Insurers": "Specialised" };
const SKIP = ["sub total", "previous year", "% growth", "% market", "industry total", "market share"];
const clean = (s) => String(s).replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
const isSkip = (l) => SKIP.some((k) => l.toLowerCase().includes(k));

function parseWorkbook(XLSX, wb) {
  const result = {};
  for (const name of Object.keys(SHEETS)) {
    const ws = wb.Sheets[name];
    if (!ws) { result[name] = { error: "sheet missing", segments: [], records: [] }; continue; }
    const grid = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: true, range: 0 });
    // header row = the row directly above the first section header ("General Insurers")
    let headerRow = -1;
    for (let r = 0; r < grid.length; r++) {
      const a = clean((grid[r] || [])[0]);
      if (SECTIONS[a]) { headerRow = r - 1; break; }
    }
    if (headerRow < 0) headerRow = 1;
    const segs = {};
    (grid[headerRow] || []).forEach((v, c) => { if (c > 0 && clean(v)) segs[c] = clean(v); });
    const records = []; let section = null;
    for (let r = headerRow + 1; r < grid.length; r++) {
      const row = grid[r] || []; const a = row[0];
      if (a == null) continue;
      const label = clean(a);
      if (SECTIONS[label]) { section = SECTIONS[label]; continue; }
      if (isSkip(label)) continue;
      const cur = {}, prev = {};
      for (const c in segs) cur[segs[c]] = row[Number(c)] ?? null;
      const nxt = (grid[r + 1] || [])[0];
      if (nxt && clean(nxt).toLowerCase().includes("previous year")) {
        const prow = grid[r + 1] || [];
        for (const c in segs) prev[segs[c]] = prow[Number(c)] ?? null;
        r++;
      }
      records.push({ insurer: label, group: section, current: cur, previous: prev });
    }
    result[name] = { segments: Object.values(segs), records };
  }
  return result;
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function InsightAdmin() {
  const ready = useSheetJS();
  const [data, setData] = useState(null);
  const [fileName, setFileName] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [err, setErr] = useState("");

  const onFile = async (e) => {
    setErr(""); setData(null);
    const file = e.target.files?.[0]; if (!file) return;
    setFileName(file.name);
    try {
      const buf = await file.arrayBuffer();
      const wb = window.XLSX.read(buf, { type: "array" });
      const parsed = parseWorkbook(window.XLSX, wb);
      setData(parsed);
      // best-effort: guess month/year from filename like segment_april_2026
      const m = file.name.toLowerCase().match(/(january|february|march|april|may|june|july|august|september|october|november|december)/);
      const y = file.name.match(/(20\d{2})/);
      if (m) setMonth(String(MONTHS.findIndex((x) => x.toLowerCase() === m[1]) + 1).padStart(2, "0"));
      if (y) setYear(y[1]);
    } catch (e2) { setErr("Could not read this file. Make sure it's the original .xlsx from GIC."); }
  };

  const totalInsurers = data ? (data["Segmentwise Report"]?.records.length || 0) : 0;
  const segCount = data ? (data["Segmentwise Report"]?.segments.length || 0) : 0;
  const ok = data && totalInsurers > 20 && segCount > 5 && month && year;

  const download = () => {
    const payload = {
      period: `${year}-${month}`,
      label: `${MONTHS[Number(month) - 1]} ${year}`,
      source: "GIC Council — Segmentwise Gross Direct Premium",
      generatedAt: new Date().toISOString(),
      sheets: data,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${year}-${month}.json`;
    a.click();
  };

  const box = { background: "#131317", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 22, marginBottom: 16 };
  const lbl = { color: "#928E84", fontSize: 12, letterSpacing: ".04em", textTransform: "uppercase" };

  return (
    <div style={{ minHeight: "100vh", background: "#08080A", color: "#F4F1EA", fontFamily: "system-ui, sans-serif", padding: "48px 20px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, margin: "0 0 6px" }}>Insight data uploader</h1>
        <p style={{ color: "#928E84", fontSize: 14, margin: "0 0 28px" }}>
          Upload the monthly GIC segment file. We'll clean it, check it, and give you a data file to commit. Internal use only.
        </p>

        <div style={box}>
          <div style={lbl}>Step 1 · Upload the GIC .xlsx</div>
          <input type="file" accept=".xlsx" onChange={onFile} disabled={!ready}
            style={{ marginTop: 12, color: "#F4F1EA", fontSize: 14 }} />
          {!ready && <p style={{ color: "#928E84", fontSize: 12, marginTop: 8 }}>Loading reader…</p>}
          {fileName && <p style={{ color: "#928E84", fontSize: 12, marginTop: 8 }}>Loaded: {fileName}</p>}
          {err && <p style={{ color: "#FF7E7E", fontSize: 13, marginTop: 8 }}>{err}</p>}
        </div>

        {data && (
          <>
            <div style={box}>
              <div style={lbl}>Step 2 · Confirm the month</div>
              <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                <select value={month} onChange={(e) => setMonth(e.target.value)} style={{ flex: 1, padding: 10, borderRadius: 8, background: "#08080A", color: "#F4F1EA", border: "1px solid rgba(255,255,255,0.12)" }}>
                  <option value="">Month…</option>
                  {MONTHS.map((m, i) => <option key={m} value={String(i + 1).padStart(2, "0")}>{m}</option>)}
                </select>
                <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="Year e.g. 2026" style={{ flex: 1, padding: 10, borderRadius: 8, background: "#08080A", color: "#F4F1EA", border: "1px solid rgba(255,255,255,0.12)" }} />
              </div>
            </div>

            <div style={box}>
              <div style={lbl}>Step 3 · Check it looks right</div>
              <div style={{ marginTop: 12, fontSize: 14, lineHeight: 1.9 }}>
                <div>Insurers found (Segmentwise): <b style={{ color: totalInsurers > 20 ? "#6FCF7F" : "#FF7E7E" }}>{totalInsurers}</b></div>
                <div>Segments found: <b style={{ color: segCount > 5 ? "#6FCF7F" : "#FF7E7E" }}>{segCount}</b></div>
                {Object.entries(data).map(([k, v]) => (
                  <div key={k} style={{ color: "#928E84", fontSize: 13 }}>· {k}: {v.records?.length || 0} insurers, {v.segments?.length || 0} segments {v.error ? `(⚠ ${v.error})` : ""}</div>
                ))}
              </div>
              <p style={{ color: "#928E84", fontSize: 12, marginTop: 10 }}>
                A normal month shows ~30+ insurers in Segmentwise and 5+ segments. If these are red, the file format may have changed — don't publish; flag it.
              </p>
            </div>

            <button onClick={download} disabled={!ok}
              style={{ width: "100%", padding: "14px", borderRadius: 999, border: "none", cursor: ok ? "pointer" : "not-allowed",
                background: ok ? "linear-gradient(135deg,#ECDDB4,#B6975C)" : "#2a2a30", color: ok ? "#1b1505" : "#666", fontWeight: 600, fontSize: 15 }}>
              {ok ? `Download ${year}-${month}.json` : "Confirm month & year to enable download"}
            </button>
            <p style={{ color: "#928E84", fontSize: 12, marginTop: 12, textAlign: "center" }}>
              Then commit this file into the <code>data/insight/</code> folder on GitHub.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
