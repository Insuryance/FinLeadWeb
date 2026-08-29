import TryGridExtraction from "./TryGridExtraction";

export const metadata = {
  title: "Try grid extraction — FinLead AI",
  description:
    "Watch FinLead AI read a real insurance commission grid and turn it into structured, machine-readable payout rules. Live extraction, not a simulation.",
  keywords: [
    "commission grid extraction",
    "insurance commission rules",
    "payout rule automation",
    "commission grid to structured data",
  ],
  openGraph: {
    title: "Try grid extraction — FinLead AI",
    description:
      "See a commission grid become structured payout rules, extracted live by FinLead AI.",
    url: "https://finlead.ai/try",
    siteName: "FinLead AI",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "FinLead AI — grid extraction" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Try grid extraction — FinLead AI",
    description: "See a commission grid become structured payout rules.",
    images: ["/og.png"],
  },
  alternates: { canonical: "https://finlead.ai/try" },
};

export default function TryPage() {
  return <TryGridExtraction />;
}
