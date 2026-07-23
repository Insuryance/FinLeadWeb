"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const GI_ROUTE = "/insight/india";
const LIFE_ROUTE = "/insight/india/life";
const EXIT_MS = 140;

export default function DashboardSwitch({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const recoveryTimer = useRef(null);
  const [visible, setVisible] = useState(false);
  const [switching, setSwitching] = useState(false);
  const isLife = pathname.startsWith(LIFE_ROUTE);

  useEffect(() => {
    router.prefetch(GI_ROUTE);
    router.prefetch(LIFE_ROUTE);
  }, [router]);

  useEffect(() => {
    clearTimeout(recoveryTimer.current);
    setSwitching(false);
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  function changeSector(route) {
    if (switching || route === pathname) return;
    setSwitching(true);
    setVisible(false);

    window.setTimeout(() => router.push(route), EXIT_MS);

    // If navigation is ever interrupted, restore the current dashboard.
    recoveryTimer.current = window.setTimeout(() => {
      setVisible(true);
      setSwitching(false);
    }, 1600);
  }

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

        <div
          role="group"
          aria-label="Choose insurance sector"
          style={{
            display: "inline-flex",
            gap: 4,
            padding: 4,
            border: "1px solid var(--line)",
            borderRadius: 10,
            background: "#0B0B0E",
          }}
        >
          <SectorButton
            active={!isLife}
            disabled={switching}
            onClick={() => changeSector(GI_ROUTE)}
          >
            General insurance
          </SectorButton>
          <SectorButton
            active={isLife}
            disabled={switching}
            onClick={() => changeSector(LIFE_ROUTE)}
          >
            Life insurance
          </SectorButton>
        </div>

        <a
          href="/insight"
          style={{
            color: "var(--gold)",
            fontSize: 12.5,
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          Change country →
        </a>
      </section>

      <div
        aria-busy={switching}
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(3px)",
          transition: "opacity 160ms ease-out, transform 160ms ease-out",
          pointerEvents: switching ? "none" : "auto",
          willChange: switching ? "opacity, transform" : "auto",
        }}
      >
        {children}
      </div>
    </>
  );
}

function SectorButton({ active, disabled, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      style={{
        border: 0,
        borderRadius: 7,
        padding: "10px 15px",
        cursor: disabled ? "wait" : "pointer",
        color: active ? "#0B0B0E" : "var(--muted)",
        background: active ? "var(--gold)" : "transparent",
        font: "inherit",
        fontSize: 12.5,
        fontWeight: active ? 600 : 450,
        transition: "color 120ms ease, background 120ms ease",
      }}
    >
      {children}
    </button>
  );
}
