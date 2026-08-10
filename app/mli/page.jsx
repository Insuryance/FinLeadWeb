const sections = [
  {
    title: "FINLEAD AI",
    items: [
      { label: "Home", href: "/" },
      { label: "Product", href: "/#product" },
      { label: "Agents", href: "/#agents" },
      { label: "Assistant", href: "/#assistant" },
      { label: "Why FinLead", href: "/#why" },
      { label: "Insight", href: "/insight" },
    ],
  },
  {
    title: "AGENT SUITES",
    items: [
      { label: "Finance Ops", href: "/#agents" },
      { label: "PoSP & Distribution", href: "/#agents" },
      { label: "Intelligence", href: "/#agents" },
    ],
  },
  {
    title: "MACHINE LINKS",
    items: [
      { label: "LLMS TXT", href: "/llms.txt" },
      { label: "Homepage Metadata", href: "/" },
      { label: "Insight Dataset Explorer", href: "/insight" },
    ],
  },
  {
    title: "CONTACT",
    items: [
      { label: "Book a Demo", href: "/#top" },
      { label: "Entrepreneur First", href: "https://www.joinef.com/about/" },
      { label: "Transpose Platform", href: "https://www.transposeplatform.vc" },
    ],
  },
];

export const metadata = {
  title: "FinLead AI MLI",
  description:
    "Machine-linkable index for FinLead AI pages, products, and resources.",
  alternates: { canonical: "https://finlead.ai/mli" },
};

function LinkLine({ label, href }) {
  const external = href.startsWith("http");
  return (
    <div style={{ marginTop: 4 }}>
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer noopener" : undefined}
        style={{ color: "#f1ead7" }}
      >
        [{label}]
      </a>
      <span style={{ color: "rgba(241,234,215,0.5)" }}>({href})</span>
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
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 20px 80px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            marginBottom: 28,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <a
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(241,234,215,0.18)",
                borderRadius: 999,
                width: 38,
                height: 38,
                color: "#f1ead7",
              }}
            >
              ←
            </a>
            <div style={{ letterSpacing: ".08em", fontSize: 13, color: "rgba(241,234,215,0.72)" }}>
              FinLead AI / MLI
            </div>
          </div>
          <div
            style={{
              display: "inline-flex",
              border: "1px solid rgba(241,234,215,0.18)",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <a
              href="/"
              style={{
                padding: "10px 18px",
                background: "rgba(241,234,215,0.08)",
                color: "#f4f1ea",
              }}
            >
              HUMAN
            </a>
            <span style={{ padding: "10px 18px", background: "#f1ead7", color: "#0b0b0d" }}>MACHINE</span>
          </div>
        </div>

        <div
          style={{
            border: "1px solid rgba(241,234,215,0.12)",
            padding: "24px 28px",
            lineHeight: 1.7,
            fontSize: 17,
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div style={{ color: "rgba(241,234,215,0.9)", marginBottom: 16 }}>
            FinLead AI helps insurers, brokers, agencies and MGAs run insurance operations through autonomous AI agents.
          </div>
          <div style={{ color: "rgba(241,234,215,0.72)" }}>
            This page is a machine-linkable index inspired by `parallel.ai` and surfaces the main FinLead AI destinations in one place.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            marginTop: 30,
          }}
        >
          {sections.map((section) => (
            <section
              key={section.title}
              style={{
                borderLeft: "1px solid rgba(241,234,215,0.16)",
                borderRight: "1px solid rgba(241,234,215,0.16)",
                padding: "18px 24px 22px",
                display: "grid",
                gridTemplateColumns: "220px minmax(0, 1fr)",
                gap: 24,
                alignItems: "start",
              }}
            >
              <div style={{ whiteSpace: "pre-wrap", color: "rgba(241,234,215,0.92)" }}>
                {section.title}
                {":"}
              </div>
              <div>
                {section.items.map((item) => (
                  <LinkLine key={item.label} label={item.label} href={item.href} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <div
          style={{
            borderTop: "1px solid rgba(241,234,215,0.12)",
            marginTop: 36,
            paddingTop: 16,
            color: "rgba(241,234,215,0.58)",
            fontSize: 14,
          }}
        >
          Prefer the raw machine-readable file? Visit <a href="/llms.txt" style={{ color: "#f1ead7" }}>/llms.txt</a>.
        </div>
      </div>
    </main>
  );
}
