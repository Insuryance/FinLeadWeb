import { ArrowLeft, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Playground | FinLead AI",
  description: "Interactive mocks of FinLead AI agent workflows.",
  robots: { index: false, follow: false },
};

const MOCKS = [
  {
    href: "/playground/agent-onboarding",
    title: "Agent Onboarding Automation",
    description: "Underwrite a prospective POSP and complete their application through an embedded onboarding portal.",
  },
  {
    href: "/playground/commission-query",
    title: "Commission Query",
    description: "Filter a live commission grid by insurance line, product, territory and insurer.",
  },
  {
    href: "/playground/marine-coi",
    title: "Marine COI Automation",
    description: "Read an invoice and bill of lading, then carry the declaration through an insurer portal to a certificate.",
  },
];

export default function PlaygroundIndexPage() {
  return (
    <main className="cq-root">
      <header className="cq-topbar">
        <a href="/" aria-label="FinLead AI home"><img src="/FinLeadAILogo.png" alt="FinLead AI" /></a>
        <span>Playground</span>
      </header>
      <div className="cq-page">
        <a className="cq-back" href="/"><ArrowLeft size={16} aria-hidden="true" /> Back to website</a>
        <div className="cq-title">
          <h1>Playground</h1>
          <p>Interactive mocks of the agent workflows behind FinLead AI.</p>
        </div>
        <div className="pg-index">
          {MOCKS.map((mock) => (
            <a key={mock.href} href={mock.href}>
              <h2>{mock.title}</h2>
              <p>{mock.description}</p>
              <span>Open mock <ArrowRight size={16} aria-hidden="true" /></span>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
