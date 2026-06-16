import fs from "fs";
import path from "path";
import InsightExplorer from "./InsightExplorer";
import InsightChrome from "./InsightChrome";

/* ---------- load all monthly JSON files at build time ---------- */
function loadMonths() {
  const dir = path.join(process.cwd(), "data", "insight");
  let files = [];
  try { files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")); } catch (e) { return []; }
  const months = files.map((f) => {
    const j = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    return { period: j.period, label: j.label, source: (j.source || "").replace(/\u2014/g, ","), bySheet: j.sheets };
  });
  // newest first
  months.sort((a, b) => (a.period < b.period ? 1 : -1));
  return months;
}

const inrCr = (n) => (n == null ? "-" : "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 }) + " Cr");
const pct = (x) => (x == null ? "-" : (x * 100).toFixed(1) + "%");

/* ---------- SEO / GEO metadata ---------- */
export const metadata = {
  title: "Indian General Insurance Premium Data · Monthly Segment Tracker | FinLead AI Insights",
  description:
    "Explore monthly gross direct premium data for India's general insurers by segment: motor, health, fire, marine, engineering and more. Compare insurers, market share and growth. Sourced from the GIC Council, presented by FinLead AI.",
  keywords: [
    "Indian general insurance premium", "GIC Council segment data", "insurer market share India",
    "motor insurance premium India", "health insurance premium India", "gross direct premium income",
    "general insurance growth India", "insurance segment data",
  ],
  openGraph: {
    title: "Indian General Insurance Premium Data · Monthly Segment Tracker",
    description: "Compare India's general insurers by premium, market share, growth and segment. Updated monthly. By FinLead AI.",
    type: "website",
  },
  alternates: { canonical: "https://finlead.ai/insight" },
};

export default function InsightPage() {
  const months = loadMonths();

  if (!months.length) {
    return (
      <div style={{ minHeight: "60vh", display: "grid", placeItems: "center", color: "var(--muted)", padding: 40 }}>
        Insight data is being prepared. Please check back shortly.
      </div>
    );
  }

  const latest = months[0];
  const seg = latest.bySheet["Segmentwise Report"];
  const ranked = [...seg.records].sort((a, b) => (b.current["Grand Total"] || 0) - (a.current["Grand Total"] || 0));
  const top = ranked.slice(0, 10);

  // JSON-LD Dataset structured data for AI crawlers + Google Dataset Search
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Indian General Insurance Gross Direct Premium by Segment, " + latest.label,
    description:
      "Monthly gross direct premium income (GDPI) for Indian general, standalone health and specialised insurers, broken down by segment (motor, health, fire, marine, engineering, liability and more). Source: GIC Council.",
    url: "https://finlead.ai/insight",
    keywords: ["general insurance", "India", "gross direct premium", "insurer market share", "GIC Council"],
    creator: { "@type": "Organization", name: "FinLead AI", url: "https://finlead.ai" },
    temporalCoverage: months[months.length - 1].period + "/" + latest.period,
    measurementTechnique: "Aggregation of GIC Council monthly segment reports",
    variableMeasured: "Gross Direct Premium Income (INR crore)",
    isAccessibleForFree: true,
  };

  return (
    <div className="fl-root" style={{ position: "relative", zIndex: 1 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "72px 24px 96px", position: "relative", zIndex: 10 }}>
        {/* back link */}
        <a href="/" style={{ color: "var(--muted)", fontSize: 13, textDecoration: "none" }}>&larr; FinLead AI</a>

        {/* header */}
        <p className="fl-eyebrow" style={{ marginTop: 28, marginBottom: 16 }}>FinLead AI · Insights</p>
        <h1 className="fl-serif" style={{ fontWeight: 350, fontSize: "clamp(30px,5vw,52px)", lineHeight: 1.1, letterSpacing: "-.02em", margin: 0 }}>
          India's Insurance Data, <span className="fl-gold-grad">by the numbers.</span>
        </h1>

        {/* compact hook + interactive chrome */}
        <p className="fl-muted" style={{ fontSize: 17, lineHeight: 1.7, maxWidth: "62ch", marginTop: 22 }}>
          This page updates itself. Each month a FinLead AI agent visits the GIC Council, downloads the latest segment premium figures for India's general insurers, structures them, and publishes them here for anyone to use.
        </p>
        <InsightChrome />

        {/* interactive explorer */}
        <div className="fl-glass" style={{ padding: "28px 26px", marginTop: 36 }}>
          <InsightExplorer months={months} />
        </div>

        {/* crawlable HTML table: real numbers for search engines and AI */}
        <h2 className="fl-serif" style={{ fontWeight: 350, fontSize: 24, marginTop: 56, marginBottom: 18 }}>
          Top insurers by premium · {latest.label}
        </h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--muted)", borderBottom: "1px solid var(--line)" }}>
                <th style={{ padding: "10px 12px" }}>#</th>
                <th style={{ padding: "10px 12px" }}>Insurer</th>
                <th style={{ padding: "10px 12px" }}>Group</th>
                <th style={{ padding: "10px 12px", textAlign: "right" }}>GDPI</th>
                <th style={{ padding: "10px 12px", textAlign: "right" }}>Growth</th>
                <th style={{ padding: "10px 12px", textAlign: "right" }}>Market share</th>
              </tr>
            </thead>
            <tbody>
              {top.map((r, i) => (
                <tr key={r.insurer} style={{ borderBottom: "1px solid var(--line)", color: "var(--ivory)" }}>
                  <td style={{ padding: "10px 12px", color: "var(--muted)" }}>{i + 1}</td>
                  <td style={{ padding: "10px 12px" }}>{r.insurer}</td>
                  <td style={{ padding: "10px 12px", color: "var(--muted)" }}>{r.group}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right" }}>{inrCr(r.current["Grand Total"])}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: (r.current["Growth %"] || 0) >= 0 ? "#6FCF7F" : "#FF7E7E" }}>{pct(r.current["Growth %"])}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: "var(--muted)" }}>{pct(r.current["Market %"])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="fl-muted" style={{ fontSize: 12.5, marginTop: 22, lineHeight: 1.6 }}>
          Source: GIC Council monthly segment report. Premium figures in ₹ crore (gross direct premium income). Compiled and visualised by FinLead AI. Data is provided for informational purposes.
        </p>
      </div>
    </div>
  );
}
