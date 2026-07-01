"use client";

export default function Error({ error, reset }) {
  return (
    <div style={{ minHeight: "100vh", background: "#08080A", color: "#F4F1EA", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 560, width: "100%", background: "#131317", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 28 }}>
        <p style={{ margin: "0 0 12px", color: "#B6975C", fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase" }}>Something went wrong</p>
        <h1 style={{ margin: "0 0 12px", fontSize: 30, lineHeight: 1.1, fontWeight: 500 }}>We hit an unexpected error.</h1>
        <p style={{ margin: "0 0 20px", color: "#928E84", fontSize: 15, lineHeight: 1.7 }}>
          {error?.message || "Please try again."}
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            onClick={() => reset()}
            style={{ padding: "12px 18px", borderRadius: 999, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#ECDDB4,#B6975C)", color: "#1b1505", fontWeight: 700 }}
          >
            Try again
          </button>
          <a
            href="/"
            style={{ display: "inline-flex", alignItems: "center", padding: "12px 18px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.10)", color: "#F4F1EA" }}
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
