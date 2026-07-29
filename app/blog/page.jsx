import { Suspense } from "react";
import { BlogFooter, BlogHeader } from "./BlogChrome";
import BlogExplorer from "./BlogExplorer";

export const metadata = {
  title: "FinLead Briefing | Intelligence for insurance operations",
  description: "Practical guides on insurance AI agents, commission reconciliation, distribution, bordereaux processing, and revenue leakage.",
  keywords: ["insurance operations blog", "insurance AI", "commission reconciliation", "producer onboarding", "bordereaux"],
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "FinLead Briefing",
    description: "Intelligence for insurance operations.",
    url: "/blog",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "FinLead Briefing" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function BlogPage() {
  return (
    <div className="bl-root">
      <div className="fl-grain" />
      <BlogHeader />
      <main>
        <section className="bl-hero">
          <span className="bl-kicker">FinLead Briefing · Insurance operations</span>
          <h1 className="fl-serif">Ideas for an insurance back office that <em>runs itself.</em></h1>
          <p>Clear, operator-led thinking on AI agents, finance operations, distribution, data, and profitable growth.</p>
        </section>
        <Suspense fallback={<div className="bl-loading">Loading the library…</div>}>
          <BlogExplorer />
        </Suspense>
      </main>
      <BlogFooter />
    </div>
  );
}
