import fs from "fs";
import path from "path";
import LifeInsightExplorer from "./LifeInsightExplorer";
import InsightChrome from "../InsightChrome";
import DashboardSwitch from "../DashboardSwitch";

function loadLifeMonths() {
  const directory = path.join(process.cwd(), "data", "life");
  let files = [];
  try {
    files = fs.readdirSync(directory).filter((file) => /^\d{4}-\d{2}\.json$/.test(file));
  } catch {
    return [];
  }
  return files.map((file) => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(directory, file), "utf8"));
      return data?.period && Array.isArray(data.records) ? data : null;
    } catch {
      return null;
    }
  }).filter(Boolean).sort((a, b) => b.period.localeCompare(a.period));
}

export const metadata = {
  title: "Indian Life Insurance New Business Data | FinLead AI Insights",
  description: "Explore monthly new-business premium and policy data for Indian life insurers, including LIC and private insurers.",
  alternates: { canonical: "https://finlead.ai/insight/india/life" },
};

export default function LifeInsightPage() {
  const months = loadLifeMonths();
  if (!months.length) return <div style={{ minHeight: "60vh", display: "grid", placeItems: "center", color: "var(--muted)" }}>Life-insurance data is being prepared.</div>;
  const latest = months[0];
  const jsonLd = {
    "@context": "https://schema.org", "@type": "Dataset",
    name: `Indian Life Insurance New Business Performance, ${latest.label}`,
    description: "Monthly new-business premium and policy performance of Indian life insurers.",
    creator: { "@type": "Organization", name: "FinLead AI", url: "https://finlead.ai" },
    temporalCoverage: `${months.at(-1).period}/${latest.period}`,
    variableMeasured: ["New business premium (INR crore)", "Policies and schemes"],
    isAccessibleForFree: true,
  };
  return <div className="fl-root" style={{ position: "relative", zIndex: 1 }}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "72px 24px 96px", position: "relative", zIndex: 10 }}>
      <a href="/insight" style={{ color: "var(--muted)", fontSize: 13, textDecoration: "none" }}>← Choose another country</a>
      <DashboardSwitch>
        <p className="fl-eyebrow" style={{ marginTop: 28, marginBottom: 16 }}>FinLead AI · Life Insights</p>
        <h1 className="fl-serif" style={{ fontWeight: 350, fontSize: "clamp(30px,5vw,52px)", lineHeight: 1.1, letterSpacing: "-.02em", margin: 0 }}>India's life insurance market, <span className="fl-gold-grad">by the numbers.</span></h1>
        <p className="fl-muted" style={{ fontSize: 17, lineHeight: 1.7, maxWidth: "65ch", marginTop: 22 }}>Track new-business premium, policy volumes, growth, insurer rankings, and the mix between individual and group business.</p>
        <InsightChrome />
        <section className="fl-glass" style={{ padding: "28px 26px", marginTop: 36 }}><LifeInsightExplorer months={months} /></section>
        <p className="fl-muted" style={{ fontSize: 12.5, marginTop: 22 }}>Source: Life Insurance Council, Detailed New Business Performance of Life Insurers. Compiled and visualised by FinLead AI.</p>
      </DashboardSwitch>
    </main>
  </div>;
}
