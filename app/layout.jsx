import "./globals.css";

export const metadata = {
  title: "FinLead AI — The insurance back-office, run by agents",
  description:
    "FinLead deploys AI agents that reconcile commissions, calculate payouts, and automate insurer back-office work. BPO economics, SaaS margins.",
  metadataBase: new URL("https://finlead.ai"),
  openGraph: {
    title: "FinLead AI — The insurance back-office, run by agents",
    description: "AI agents for insurance operations.",
    url: "https://finlead.ai",
    siteName: "FinLead AI",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
