"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const SWITCH_DELAY_MS = 280;

export default function DashboardSwitch({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [switching, setSwitching] = useState(false);
  const isLife = pathname.endsWith("/life");

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setVisible(true);
      setSwitching(false);
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  function changeDashboard(target) {
    if (switching || target === (isLife ? "life" : "gi")) return;
    setSwitching(true);
    setVisible(false);
    window.setTimeout(() => {
      router.push(target === "life" ? "/insight/india/life" : "/insight/india");
    }, SWITCH_DELAY_MS);
  }

  return (
    <>
      <div
        role="group"
        aria-label="Choose insurance dashboard"
        style={{
          display: "inline-flex",
          gap: 4,
          padding: 4,
          marginTop: 28,
          border: "1px solid var(--line)",
          borderRadius: 999,
          background: "rgba(11,11,14,.72)",
        }}
      >
        <SwitchButton active={!isLife} disabled={switching} onClick={() => changeDashboard("gi")}>
          General insurance
        </SwitchButton>
        <SwitchButton active={isLife} disabled={switching} onClick={() => changeDashboard("life")}>
          Life insurance
        </SwitchButton>
      </div>

      <div
        aria-busy={switching}
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0) scale(1)" : "translateY(7px) scale(.995)",
          filter: visible ? "blur(0)" : "blur(5px)",
          transition: "opacity 280ms var(--ease), transform 280ms var(--ease), filter 280ms var(--ease)",
          pointerEvents: switching ? "none" : "auto",
        }}
      >
        {children}
      </div>
    </>
  );
}

function SwitchButton({ active, disabled, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      style={{
        border: 0,
        borderRadius: 999,
        padding: "10px 17px",
        cursor: disabled ? "wait" : "pointer",
        color: active ? "#0B0B0E" : "var(--muted)",
        background: active ? "var(--gold)" : "transparent",
        font: "inherit",
        fontSize: 12.5,
        transition: "color 180ms ease, background 180ms ease",
      }}
    >
      {children}
    </button>
  );
}
