import CommissionQueryPlayground from "./CommissionQueryPlayground";

export const metadata = {
  title: "Commission Query | FinLead AI Playground",
  description: "Explore commission grids by insurance line, product, territory, and insurer.",
  robots: { index: false, follow: false },
};

export default function PlaygroundPage() {
  return <CommissionQueryPlayground />;
}
