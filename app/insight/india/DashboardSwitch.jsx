"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const GI_ROUTE = "/insight/india";
const LIFE_ROUTE = "/insight/india/life";

export default function DashboardSwitch({ children }) {
  const pathname = usePathname();
  const isLife = pathname.startsWith(LIFE_ROUTE);

  return (
    <>
      <section
        aria-label="India insurance sector navigation"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 20,
          flexWrap: "wrap",
          margin: "24px 0 34px",
          padding: "17px 18px",
          border: "1px solid var(--line)",
          borderRadius: 14,
          background: "rgba(13,13,17,.68)",
          boxShadow: "0 10px 34px rgba(0,0,0,.16)",
        }}
      >
        <div>
          <div style={{ color: "var(--ivory)", fontSize: 14, fontWeight: 550 }}>
            India insurance insights
          </div>
          <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>
            Choose an insurance sector
          </div>
        </div>

        <nav
          aria-label="Insurance sectors"
          style={{
            display: "inline-flex",
            gap: 4,
            padding: 4,
            border: "1px solid var(--line)",
            borderRadius: 10,
            background: "#0B0B0E",
          }}
        >
          <SectorLink href={GI_ROUTE} active={!isLife}>
            General insurance
          </SectorLink>
          <SectorLink href={LIFE_ROUTE} active={isLife}>
            Life insurance
          </SectorLink>
        </nav>

        <Link
          href="/insight"
          prefetch
          style={{
            color: "var(--gold)",
            fontSize: 12.5,
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          Change country →
        </Link>
      </section>

      {/* Always visible. The dashboard no longer depends on an effect or timer. */}
      <div>{children}</div>
    </>
  );
}

function SectorLink({ href, active, children }) {
  return (
    <Link
      href={href}
      prefetch
      aria-current={active ? "page" : undefined}
      style={{
        display: "inline-block",
        borderRadius: 7,
        padding: "10px 15px",
        color: active ? "#0B0B0E" : "var(--muted)",
        background: active ? "var(--gold)" : "transparent",
        fontSize: 12.5,
        fontWeight: active ? 600 : 450,
        textDecoration: "none",
        transition: "color 100ms ease, background 100ms ease",
      }}
    >
      {children}
    </Link>
  );
}
