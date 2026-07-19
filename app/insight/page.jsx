export const metadata = {
  title: "Insurance Market Insights: India & US | FinLead AI",
  description: "Monthly insurance market data, compiled and published automatically by FinLead AI agents. India general insurance segment data live; US market data coming soon.",
  alternates: { canonical: "https://finlead.ai/insight" },
};

export default function InsightChooser() {
  return (
    <div className="fl-root" style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "88px 24px 96px", position: "relative", zIndex: 10 }}>
        <a href="/" style={{ color: "var(--muted)", fontSize: 13 }}>&larr; FinLead AI</a>
        <p className="fl-eyebrow" style={{ marginTop: 28, marginBottom: 16 }}>FinLead AI · Insights</p>
        <h1 className="fl-serif" style={{ fontWeight: 350, fontSize: "clamp(30px,5vw,52px)", lineHeight: 1.1, letterSpacing: "-.02em", margin: 0 }}>
          Insurance markets, <span className="fl-gold-grad">by the numbers.</span>
        </h1>
        <p className="fl-muted" style={{ fontSize: 16.5, lineHeight: 1.7, maxWidth: "60ch", marginTop: 20 }}>
          Market datasets compiled, structured and published automatically by FinLead AI agents. Pick a market.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16, marginTop: 44 }}>
          <a href="/insight/india" className="fl-card" style={{ padding: 32, display: "block" }}>
            <p className="fl-eyebrow" style={{ marginBottom: 14 }}>Live · Updated monthly</p>
            <h2 className="fl-serif" style={{ fontWeight: 400, fontSize: 28, margin: "0 0 10px" }}>India</h2>
            <p className="fl-muted" style={{ fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>
              Gross direct premium for India&apos;s general insurers by segment: motor, health, fire, marine and more. Compare insurers, market share and growth.
            </p>
            <span style={{ display: "inline-block", marginTop: 18, color: "var(--gold)", fontSize: 14 }}>Open the dashboard &rarr;</span>
          </a>

          <div className="fl-card" style={{ padding: 32 }}>
            <p className="fl-eyebrow" style={{ marginBottom: 14, color: "var(--muted2)" }}>Coming soon</p>
            <h2 className="fl-serif" style={{ fontWeight: 400, fontSize: 28, margin: "0 0 10px" }}>United States</h2>
            <p className="fl-muted" style={{ fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>
              US P&amp;C market data: premium by line and state, carrier market share and growth. In preparation by our agents.
            </p>
            <a href="mailto:surya@finleadai.com?subject=Notify%20me%20about%20US%20Insights" style={{ display: "inline-block", marginTop: 18, color: "var(--gold)", fontSize: 14 }}>Get notified when it&apos;s live &rarr;</a>
          </div>
        </div>
      </div>
    </div>
  );
}
