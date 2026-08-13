import Link from "next/link";
import SiteHeader from "../components/SiteHeader";

export function BlogLogo() {
  return (
    <Link href="/" className="bl-logo" aria-label="FinLead AI home">
      <img src="/FinLeadAILogo.png" alt="FinLead AI" />
      <span className="fl-serif">FinLead<span className="fl-ital">.ai</span></span>
    </Link>
  );
}

export function BlogHeader() {
  return (
    <header className="bl-header">
      <SiteHeader current="briefing" />
    </header>
  );
}

export function BlogFooter() {
  return (
    <footer className="bl-footer">
      <BlogLogo />
      <div className="bl-footer-backed">
        <span>Backed by</span>
        <a href="https://www.joinef.com/about/" target="_blank" rel="noopener noreferrer">
          <img src="/EFLogo.png" alt="Entrepreneur First" />
        </a>
        <a href="https://www.transposeplatform.vc" target="_blank" rel="noopener noreferrer">
          <img src="/TI_logo.png" alt="Transpose Platform" />
        </a>
      </div>
      <span>© 2026 FinLead AI</span>
    </footer>
  );
}
