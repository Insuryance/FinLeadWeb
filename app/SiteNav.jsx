"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Product", anchor: "#product" },
  { label: "Agents", anchor: "#agents" },
  { label: "Assistant", anchor: "#assistant" },
  { label: "Why FinLead", anchor: "#why" },
  { label: "Insight", href: "/insight" },
  { label: "Blog", href: "/blog" },
];

function Logo() {
  return <img src="/FinLeadAILogo.png" alt="FinLead AI" style={{ height: 54, width: "auto", display: "block" }} />;
}

export default function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const items = useMemo(
    () =>
      NAV_ITEMS.map((item) => ({
        ...item,
        href: item.href || (pathname === "/" ? item.anchor : `/${item.anchor}`),
      })),
    [pathname]
  );

  return (
    <div className="fl-navwrap fl-nav-fixed">
      <nav className="fl-navshell">
        <a href={pathname === "/" ? "#top" : "/"} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Logo />
          <span className="fl-serif" style={{ fontSize: 22, letterSpacing: "-.02em" }}>
            FinLead<span className="fl-ital">.ai</span>
          </span>
        </a>

        <div className="fl-dock">
          {items.map((item) => (
            <a key={item.label} href={item.href}>{item.label}</a>
          ))}
        </div>

        <div className="fl-nav-actions">
          <a href="/#assistant" className="fl-btn fl-btn-shine" style={{ padding: "10px 20px", fontSize: 14 }}>
            Book a demo
          </a>
          <button type="button" className="fl-menu-btn" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      {open && (
        <div className="fl-mobile-menu">
          <div className="fl-mobile-menu-card">
            {items.map((item) => (
              <a key={item.label} href={item.href} onClick={() => setOpen(false)}>{item.label}</a>
            ))}
            <a href="/#assistant" className="fl-btn fl-btn-shine" style={{ justifyContent: "center", marginTop: 10, color: "#1b1505" }}>
              Book a demo
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
