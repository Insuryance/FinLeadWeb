import "./agent-onboarding.css";
import AgentOnboardingPlayground from "./AgentOnboardingPlayground";

export const metadata = {
  title: "Agent Onboarding Automation | FinLead AI Playground",
  description: "Underwrite a prospective insurance agent and carry their application through an embedded onboarding portal.",
  robots: { index: false, follow: false },
};

export default function AgentOnboardingPage() {
  return <AgentOnboardingPlayground />;
}
