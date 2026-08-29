"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function Logo() {
  return (
    <>
      <img src="/FinLeadAILogo.png" alt="FinLead AI" style={{ height: 70, width: "auto", display: "block" }} />
      <span className="fl-serif" style={{ fontSize: 22, letterSpacing: "-.02em" }}>
        FinLead<span className="fl-ital">.ai</span>
      </span>
    </>
  );
}

export default function SiteHeader({
  current,
  ctaLabel = "Book a demo",
  ctaHref = "mailto:surya@finleadai.com?subject=Book%20a%20demo",
  ctaOnClick,
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isHome = pathname === "/";

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, [open]);

  const links = useMemo(
    () => [
      { key: "product", label: "Product", href: isHome ? "#product" : "/#product" },
      { key: "agents", label: "Agents", href: isHome ? "#agents" : "/#agents" },
      { key: "assistant", label: "Assistant", href: isHome ? "#assistant" : "/#assistant" },
      { key: "why", label: "Why FinLead", href: isHome ? "#why" : "/#why" },
      { key: "insight", label: "Insight", href: "/insight" },
      // { key: "try", label: "Try it", href: "/try" },
      { key: "briefing", label: "Briefing", href: "/blog" },
      // { key: "mli", label: "MLI", href: "/mli" },
    ],
    [isHome],
  );

  const ctaProps = ctaOnClick
    ? { as: "button", onClick: ctaOnClick, href: undefined }
    : { as: "a", href: ctaHref, onClick: undefined };

  const CTA = ({ mobile = false }) =>
    ctaProps.as === "button" ? (
      <button
        onClick={() => {
          setOpen(false);
          ctaOnClick?.();
        }}
        className={`fl-btn fl-btn-shine ${mobile ? "fl-mobile-cta" : ""}`}
        style={{ padding: mobile ? "12px 18px" : "10px 20px", fontSize: mobile ? 13 : 14 }}
      >
        {ctaLabel}
      </button>
    ) : (
      <a
        href={ctaHref}
        className={`fl-btn fl-btn-shine ${mobile ? "fl-mobile-cta" : ""}`}
        style={{ padding: mobile ? "12px 18px" : "10px 20px", fontSize: mobile ? 13 : 14 }}
        onClick={() => setOpen(false)}
      >
        {ctaLabel}
      </a>
    );

  return (
    <header className="fl-site-header">
      <div className="fl-navshell">
        <Link href="/" className="fl-brand" aria-label="FinLead AI home">
          <Logo />
        </Link>

        <nav className="fl-dock fl-desktop-nav" aria-label="Primary navigation">
          {links.map((link) => (
            <Link key={link.key} href={link.href} aria-current={current === link.key ? "page" : undefined}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="fl-header-actions">
          <div className="fl-desktop-cta">
            <CTA />
          </div>
          <button
            type="button"
            className="fl-menu-btn"
            aria-expanded={open}
            aria-controls="fl-mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {open ? (
        <div id="fl-mobile-menu" className="fl-mobile-menu">
          <nav className="fl-mobile-links" aria-label="Mobile navigation">
            {links.map((link) => (
              <Link key={link.key} href={link.href} aria-current={current === link.key ? "page" : undefined} onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
          </nav>
          <CTA mobile />
        </div>
      ) : null}
    </header>
  );
}
