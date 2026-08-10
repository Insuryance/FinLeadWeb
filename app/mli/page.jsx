const groups = [
  {
    title: "FINLEAD AI",
    items: [
      { label: "Home", href: "/", note: "Main brand and product homepage" },
      { label: "Product", href: "/#product", note: "Live workflow and product overview" },
      { label: "Agents", href: "/#agents", note: "Finance ops, distribution and intelligence suites" },
      { label: "Assistant", href: "/#assistant", note: "Interactive assistant section on the homepage" },
      { label: "Why FinLead", href: "/#why", note: "Business case, outcomes and differentiation" },
    ],
  },
  {
    title: "DATA AND CONTENT",
    items: [
      { label: "Insight", href: "/insight", note: "Insurance market intelligence and monthly premium data" },
      { label: "Briefing", href: "/blog", note: "Insurance operations and AI agents blog hub" },
      { label: "LLMS TXT", href: "/llms.txt", note: "Raw language-model-facing company summary" },
      { label: "Sitemap", href: "/sitemap.xml", note: "Index of public site URLs" },
    ],
  },
  {
    title: "AGENT SUITES",
    items: [
      { label: "Finance Ops", href: "/#agents", note: "Commission reconciliation, extraction and payouts" },
      { label: "PoSP & Distribution", href: "/#agents", note: "Onboarding, producer analysis and activation" },
      { label: "Intelligence", href: "/#agents", note: "Leakage analysis, guardrails and corrective insight" },
    ],
  },
  {
    title: "CONTACT AND TRUST",
    items: [
      { label: "Book a Demo", href: "/#top", note: "Primary engagement flow" },
      { label: "Entrepreneur First", href: "https://www.joinef.com/about/", note: "Backing and company context" },
      { label: "Transpose Platform", href: "https://www.transposeplatform.vc", note: "Venture partner" },
    ],
  },
];

export const metadata = {
  title: "FinLead AI MLI",
  description: "Machine-linkable index for FinLead AI pages, resources, and product surfaces.",
  alternates: { canonical: "https://finlead.ai/mli" },
  openGraph: {
    title: "FinLead AI MLI",
    description: "Machine-linkable index for FinLead AI pages, resources, and product surfaces.",
    url: "https://finlead.ai/mli",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "FinLead AI MLI",
    description: "Machine-linkable index for FinLead AI pages, resources, and product surfaces.",
  },
};

function LinkRow({ label, href, note }) {
  const external = href.startsWith("http");
  return (
    <div style={{ marginTop: 6, color: "rgba(244,241,234,0.76)" }}>
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer noopener" : undefined}
        style={{ color: "#f4f1ea" }}
      >
        [{label}]
      </a>
      <span style={{ color: "rgba(244,241,234,0.46)" }}>({href})</span>
      <div style={{ marginTop: 3 }}>{note}</div>
    </div>
  );
}

export default function MLIPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0b0b0d",
        color: "#f4f1ea",
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "28px 20px 72px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 28,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <a
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 38,
                height: 38,
                borderRadius: 999,
                border: "1px solid rgba(244,241,234,0.16)",
                color: "#f4f1ea",
              }}
            >
              ←
            </a>
            <div style={{ fontSize: 13, letterSpacing: ".08em", color: "rgba(244,241,234,0.7)" }}>
              FinLead AI / MLI
            </div>
          </div>

          <div
            style={{
              display: "inline-flex",
              border: "1px solid rgba(244,241,234,0.16)",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <a href="/" style={{ padding: "10px 18px", background: "rgba(244,241,234,0.08)", color: "#f4f1ea" }}>
              HUMAN
            </a>
            <span style={{ padding: "10px 18px", background: "#f4f1ea", color: "#0b0b0d" }}>
              MACHINE
            </span>
          </div>
        </div>

        <div
          style={{
            border: "1px solid rgba(244,241,234,0.12)",
            padding: "24px 28px",
            background: "rgba(255,255,255,0.02)",
            lineHeight: 1.7,
            fontSize: 17,
          }}
        >
          <div style={{ marginBottom: 16, color: "rgba(244,241,234,0.92)" }}>
            FinLead AI helps insurers, brokers, agencies and MGAs run insurance operations through autonomous AI agents.
          </div>
          <div style={{ color: "rgba(244,241,234,0.72)" }}>
            This page is a machine-linkable map of FinLead AI. It exposes the primary public routes, product surfaces, data pages and reference assets in a compact format that machines can traverse quickly.
          </div>
        </div>

        <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 18 }}>
          {groups.map((group) => (
            <section
              key={group.title}
              style={{
                borderLeft: "1px solid rgba(244,241,234,0.16)",
                borderRight: "1px solid rgba(244,241,234,0.16)",
                padding: "18px 24px 22px",
                display: "grid",
                gridTemplateColumns: "220px minmax(0, 1fr)",
                gap: 24,
                alignItems: "start",
              }}
            >
              <div style={{ color: "rgba(244,241,234,0.94)" }}>
                {group.title}
                {":"}
              </div>
              <div>
                {group.items.map((item) => (
                  <LinkRow key={item.label} {...item} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <div
          style={{
            borderTop: "1px solid rgba(244,241,234,0.12)",
            marginTop: 36,
            paddingTop: 16,
            color: "rgba(244,241,234,0.58)",
            fontSize: 14,
            lineHeight: 1.7,
          }}
        >
          Prefer the raw machine-readable summary? Visit <a href="/llms.txt" style={{ color: "#f4f1ea" }}>/llms.txt</a>.
        </div>
      </div>
    </main>
  );
}
