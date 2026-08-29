import "./marine-coi.css";
import MarineCoiPlayground from "./MarineCoiPlayground";

export const metadata = {
  title: "Marine COI Automation | FinLead AI Playground",
  description:
    "Read a commercial invoice and bill of lading, prepare the marine declaration, and carry it through the insurer portal to a certificate of insurance.",
  robots: { index: false, follow: false },
};

export default function MarineCoiPage() {
  return <MarineCoiPlayground />;
}
