import MeetExperience from "./MeetExperience";

export const metadata = {
  title: "Meet FinLead AI",
  description:
    "A quick mobile-first introduction to FinLead AI for insurance operators, brokers, MGAs and distribution leaders.",
  alternates: { canonical: "https://finlead.ai/meet" },
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: "Meet FinLead AI",
    description:
      "Scan, pick a workflow, and see where FinLead AI agents can help insurance teams remove manual back-office work.",
    url: "https://finlead.ai/meet",
    siteName: "FinLead AI",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "FinLead AI" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Meet FinLead AI",
    description: "A quick scan page for meeting FinLead AI.",
    images: ["/og.png"],
  },
};

export default function MeetPage() {
  return <MeetExperience />;
}
