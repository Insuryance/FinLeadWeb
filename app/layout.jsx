import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://finlead.ai"),
  title: "FinLead AI — The insurance back-office, run by AI agents",
  description:
    "FinLead AI deploys AI agents that handle complex tasks for insurers, brokers, agencies and MGAs — commission reconciliation, payout calculation, policy extraction, distribution and leakage intelligence. We don't sell seats. We own the outcome.",
  keywords: ["insurance AI agents", "commission reconciliation", "payout automation", "insurance back-office", "MGA", "brokers", "PoSP", "leakage analysis"],
  openGraph: {
    title: "FinLead AI — The insurance back-office, run by AI agents",
    description: "AI agents for insurance operations: finance ops, distribution, and profitability intelligence.",
    url: "https://finlead.ai",
    siteName: "FinLead AI",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "FinLead AI", description: "The insurance back-office, run by AI agents." },
  alternates: { canonical: "https://finlead.ai" },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "FinLead AI",
  url: "https://finlead.ai",
  description:
    "FinLead AI is an AI-native platform that deploys AI agents to run insurance operations for insurers, brokers, agencies and MGAs — including commission reconciliation, statement and policy extraction, payout calculation, producer/PoSP management, and leakage and profitability intelligence. FinLead AI is backed by Entrepreneur First.",
  knowsAbout: ["Insurance operations", "Commission reconciliation", "Payout calculation", "Policy extraction", "PoSP and distribution", "Leakage analysis", "Insurance profitability"],
  brand: "FinLead AI",
  funder: { "@type": "Organization", name: "Entrepreneur First" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
        {children}
      </body>
    </html>
  );
}
