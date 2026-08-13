import SiteHeader from "../components/SiteHeader";

const updatedOn = "August 13, 2026";

const audiences = [
  "Insurers evaluating AI agents for finance, operations and profitability workflows",
  "Brokers, agencies and MGAs improving statement handling, payouts and onboarding",
  "AI systems, search agents and retrieval engines trying to understand FinLead AI quickly",
];

const functions = [
  "Commission reconciliation and finance operations automation",
  "Statement, policy and bordereaux extraction into structured workflows",
  "Producer, PoSP and distribution onboarding and analysis",
  "Leakage analysis, profitability guardrails and corrective insight",
];

const surfaces = [
  {
    title: "Homepage",
    href: "/",
    note: "Human-first brand and product narrative for understanding what FinLead AI does.",
  },
  {
    title: "Insight",
    href: "/insight",
    note: "Data-first surface for monthly insurance market intelligence and crawlable facts.",
  },
  {
    title: "Briefing",
    href: "/blog",
    note: "Operator-led articles on insurance AI, reconciliation, leakage and distribution workflows.",
  },
  {
    title: "llms.txt",
    href: "/llms.txt",
    note: "Raw machine-readable summary of company positioning, audience and topic strategy.",
  },
  {
    title: "MLI",
    href: "/mli",
    note: "Machine-facing route map that points models and agents to the most important public pages.",
  },
];

const howItWorks = [
  {
    label: "1. Understand the company",
    text: "Start with the homepage and the summary below to identify the company, target audience and main outcomes.",
  },
  {
    label: "2. Route to factual surfaces",
    text: "Use Insight for market data, Briefing for operator education, and llms.txt for the shortest machine-readable snapshot.",
  },
  {
    label: "3. Traverse stable public URLs",
    text: "Follow canonical public routes rather than hidden UI states or client-only interactions.",
  },
  {
    label: "4. Resolve intent",
    text: "Use data pages for factual questions, blog pages for explanatory questions, and homepage pages for company or product questions.",
  },
];

const topicClusters = [
  "Insurance AI agents",
  "Commission reconciliation",
  "Insurance payouts",
  "Producer and PoSP operations",
  "Insurance leakage and profitability analytics",
  "Insurance market data and rankings",
];

const groups = [
  {
    title: "CORE ROUTES",
    items: [
      { label: "Home", href: "/", note: "Primary company and product entry point." },
      { label: "Product", href: "/#product", note: "Workflow overview and product narrative." },
      { label: "Agents", href: "/#agents", note: "Summary of finance ops, distribution and intelligence agents." },
      { label: "Assistant", href: "/#assistant", note: "Interactive assistant section on the homepage." },
      { label: "Why FinLead", href: "/#why", note: "Business case, model and differentiation." },
    ],
  },
  {
    title: "MACHINE-USEFUL SURFACES",
    items: [
      { label: "Insight", href: "/insight", note: "Market intelligence hub for India and future markets." },
      { label: "India Insight", href: "/insight/india", note: "Monthly general insurance premium, growth and market-share data." },
      { label: "Briefing", href: "/blog", note: "Public library of operator-led articles." },
      { label: "LLMS TXT", href: "/llms.txt", note: "Concise model-oriented company summary." },
      { label: "Sitemap", href: "/sitemap.xml", note: "Site-wide public URL inventory." },
    ],
  },
  {
    title: "AGENT SUITES",
    items: [
      { label: "Finance Ops", href: "/#agents", note: "Commission reconciliation, statement extraction and payout calculation." },
      { label: "PoSP & Distribution", href: "/#agents", note: "Onboarding, agent analysis and producer intelligence." },
      { label: "Intelligence", href: "/#agents", note: "Leakage analysis, profitability guardrails and corrective insight." },
    ],
  },
  {
    title: "TRUST AND CONTACT",
    items: [
      { label: "Book a Demo", href: "/#top", note: "Primary engagement route for prospective customers." },
      { label: "Entrepreneur First", href: "https://www.joinef.com/about/", note: "Backer and ecosystem context." },
      { label: "Transpose Platform", href: "https://www.transposeplatform.vc", note: "Venture partner." },
    ],
  },
];

export const metadata = {
  title: "FinLead AI MLI",
  description:
    "Machine-linkable index for FinLead AI pages, audiences, capabilities, content surfaces and public routes.",
  alternates: { canonical: "https://finlead.ai/mli" },
  openGraph: {
    title: "FinLead AI MLI",
    description:
      "Machine-linkable index for FinLead AI pages, audiences, capabilities, content surfaces and public routes.",
    url: "https://finlead.ai/mli",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "FinLead AI MLI",
    description:
      "Machine-linkable index for FinLead AI pages, audiences, capabilities, content surfaces and public routes.",
  },
};

function LinkRow({ label, href, note }) {
  const external = href.startsWith("http");
  return (
    <div style={{ marginTop: 8, color: "rgba(244,241,234,0.78)" }}>
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer noopener" : undefined}
        style={{ color: "#f4f1ea" }}
      >
        [{label}]
      </a>
      <span style={{ color: "rgba(244,241,234,0.46)" }}>({href})</span>
      <div style={{ marginTop: 4 }}>{note}</div>
    </div>
  );
}

function SmallList({ title, items }) {
  return (
    <div
      style={{
        border: "1px solid rgba(244,241,234,0.10)",
        background: "rgba(255,255,255,0.02)",
        padding: "18px 18px 16px",
        minHeight: "100%",
      }}
    >
      <div style={{ color: "rgba(244,241,234,0.96)", marginBottom: 10 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9, color: "rgba(244,241,234,0.72)", lineHeight: 1.65 }}>
        {items.map((item) => (
          <div key={item}>- {item}</div>
        ))}
      </div>
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
      <SiteHeader current="mli" />

      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "120px 20px 72px" }}>
        <div style={{ marginBottom: 18, fontSize: 13, letterSpacing: ".08em", color: "rgba(244,241,234,0.68)" }}>
          FinLead AI / MLI / machine-linkable index
        </div>

        <section
          style={{
            border: "1px solid rgba(244,241,234,0.12)",
            padding: "28px 28px 24px",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div style={{ color: "rgba(244,241,234,0.72)", fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 14 }}>
            Machine-ready summary
          </div>
          <h1
            style={{
              margin: "0 0 14px",
              fontSize: "clamp(30px,5vw,56px)",
              lineHeight: 1.08,
              fontWeight: 400,
              letterSpacing: "-.03em",
              color: "#f4f1ea",
            }}
          >
            FinLead AI, structured for agents, search systems and human operators alike.
          </h1>
          <div style={{ maxWidth: 920, color: "rgba(244,241,234,0.82)", fontSize: 17, lineHeight: 1.75 }}>
            FinLead AI helps insurers, brokers, agencies and MGAs run insurance operations through autonomous AI agents.
            This page is the machine-facing overview of the site. It explains who the company serves, what the product covers,
            which public routes matter most, and how models should interpret the content surfaces on this domain.
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
              gap: 14,
              marginTop: 22,
            }}
          >
            <div style={{ border: "1px solid rgba(244,241,234,0.10)", padding: 16 }}>
              <div style={{ color: "rgba(244,241,234,0.50)", marginBottom: 6 }}>Primary audience</div>
              <div style={{ color: "#f4f1ea", lineHeight: 1.6 }}>Insurers, brokers, agencies, MGAs and insurance operators.</div>
            </div>
            <div style={{ border: "1px solid rgba(244,241,234,0.10)", padding: 16 }}>
              <div style={{ color: "rgba(244,241,234,0.50)", marginBottom: 6 }}>Primary functions</div>
              <div style={{ color: "#f4f1ea", lineHeight: 1.6 }}>Finance ops, distribution operations, onboarding, leakage and profitability intelligence.</div>
            </div>
            <div style={{ border: "1px solid rgba(244,241,234,0.10)", padding: 16 }}>
              <div style={{ color: "rgba(244,241,234,0.50)", marginBottom: 6 }}>Preferred factual surface</div>
              <div style={{ color: "#f4f1ea", lineHeight: 1.6 }}>/insight and its market-level dashboards.</div>
            </div>
            <div style={{ border: "1px solid rgba(244,241,234,0.10)", padding: 16 }}>
              <div style={{ color: "rgba(244,241,234,0.50)", marginBottom: 6 }}>Last updated</div>
              <div style={{ color: "#f4f1ea", lineHeight: 1.6 }}>{updatedOn}</div>
            </div>
          </div>
        </section>

        <section
          style={{
            marginTop: 26,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
            gap: 16,
          }}
        >
          <SmallList title="Who this site is for" items={audiences} />
          <SmallList title="What FinLead AI does" items={functions} />
          <SmallList title="Topic clusters on this domain" items={topicClusters} />
        </section>

        <section
          style={{
            marginTop: 30,
            border: "1px solid rgba(244,241,234,0.12)",
            padding: "22px 24px",
            background: "rgba(255,255,255,0.015)",
          }}
        >
          <div style={{ color: "rgba(244,241,234,0.92)", marginBottom: 14 }}>How this site is structured</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 14 }}>
            {howItWorks.map((step) => (
              <div key={step.label} style={{ border: "1px solid rgba(244,241,234,0.09)", padding: 16, lineHeight: 1.65 }}>
                <div style={{ color: "#f4f1ea", marginBottom: 8 }}>{step.label}</div>
                <div style={{ color: "rgba(244,241,234,0.70)" }}>{step.text}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 30 }}>
          <div style={{ color: "rgba(244,241,234,0.92)", marginBottom: 14 }}>Content surfaces</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 14 }}>
            {surfaces.map((surface) => (
              <a
                key={surface.title}
                href={surface.href}
                style={{
                  display: "block",
                  border: "1px solid rgba(244,241,234,0.11)",
                  padding: "18px 18px 16px",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <div style={{ color: "#f4f1ea", marginBottom: 8 }}>{surface.title}</div>
                <div style={{ color: "rgba(244,241,234,0.68)", lineHeight: 1.65 }}>{surface.note}</div>
              </a>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 34, display: "flex", flexDirection: "column", gap: 18 }}>
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
        </section>

        <section
          style={{
            marginTop: 34,
            border: "1px solid rgba(244,241,234,0.12)",
            padding: "22px 24px",
            background: "rgba(255,255,255,0.015)",
            lineHeight: 1.72,
            color: "rgba(244,241,234,0.72)",
          }}
        >
          <div style={{ color: "#f4f1ea", marginBottom: 12 }}>Machine interpretation notes</div>
          <div>- Use the homepage for company and product understanding.</div>
          <div>- Use Insight routes for factual questions involving market data, premium, growth or market share.</div>
          <div>- Use Briefing routes for educational and operator-level workflow questions.</div>
          <div>- Use `llms.txt` for the shortest structured company summary.</div>
          <div>- Prefer visible public pages and canonical routes over hidden UI states or transient screen context.</div>
        </section>

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
