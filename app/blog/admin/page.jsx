"use client";

import React, { useMemo, useState } from "react";

function makeSlug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export default function BlogAdminPage() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("FinLead AI");
  const [publishedAt, setPublishedAt] = useState(new Date().toISOString().slice(0, 10));
  const [coverImage, setCoverImage] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [publishing, setPublishing] = useState(false);

  const slugPreview = useMemo(() => makeSlug(title), [title]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setPublishing(true);
    setStatus({ type: "", message: "" });

    try {
      const response = await fetch("/api/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, author, publishedAt, coverImage, content }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not publish blog.");

      setStatus({ type: "success", message: `Published at /blog/${result.post.slug}` });
      setTitle("");
      setAuthor("FinLead AI");
      setPublishedAt(new Date().toISOString().slice(0, 10));
      setCoverImage("");
      setContent("");
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setPublishing(false);
    }
  };

  const box = { background: "#131317", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: 22 };
  const label = { display: "block", color: "#928E84", fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8 };
  const input = { width: "100%", padding: "12px 14px", borderRadius: 12, background: "#08080A", color: "#F4F1EA", border: "1px solid rgba(255,255,255,0.12)", fontSize: 15, fontFamily: "inherit" };

  return (
    <main style={{ minHeight: "100vh", background: "#08080A", color: "#F4F1EA", padding: "118px 24px 72px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <p className="fl-eyebrow" style={{ marginBottom: 14 }}>Internal</p>
          <h1 className="fl-serif" style={{ fontSize: "clamp(34px,5vw,52px)", lineHeight: 1.05, margin: 0 }}>Blog publisher</h1>
          <p className="fl-muted" style={{ marginTop: 14, fontSize: 16 }}>
            This page is available only at <code>/blog/admin</code>. Publishing writes the post into <code>data/blogs.json</code> in this repo.
          </p>
        </div>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 18 }}>
          <div style={box}>
            <label style={label}>Title</label>
            <input value={title} onChange={(event) => setTitle(event.target.value)} style={input} placeholder="How AI agents can improve insurance payouts" />
          </div>

          <div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
            <div style={box}>
              <label style={label}>Author</label>
              <input value={author} onChange={(event) => setAuthor(event.target.value)} style={input} placeholder="FinLead AI" />
            </div>
            <div style={box}>
              <label style={label}>Publish date</label>
              <input type="date" value={publishedAt} onChange={(event) => setPublishedAt(event.target.value)} style={input} />
            </div>
          </div>

          <div style={box}>
            <label style={label}>Cover image URL</label>
            <input value={coverImage} onChange={(event) => setCoverImage(event.target.value)} style={input} placeholder="https://…" />
          </div>

          <div style={box}>
            <label style={label}>Slug preview</label>
            <div style={{ color: "#D9C9A3", fontSize: 15 }}>{slugPreview || "starts-after-you-add-a-title"}</div>
          </div>

          <div style={box}>
            <label style={label}>Content</label>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={16}
              style={{ ...input, resize: "vertical", lineHeight: 1.7 }}
              placeholder={"Write the full post here.\n\nUse blank lines between paragraphs.\nUse # or ## for headings if you want simple sections."}
            />
          </div>

          <button
            type="submit"
            disabled={publishing}
            style={{
              width: "100%",
              padding: "15px",
              borderRadius: 999,
              border: "none",
              cursor: publishing ? "wait" : "pointer",
              background: "linear-gradient(135deg,#ECDDB4,#B6975C)",
              color: "#1b1505",
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            {publishing ? "Publishing…" : "Publish blog"}
          </button>

          {status.message ? (
            <p style={{ margin: 0, color: status.type === "error" ? "#FF8A8A" : "#6FCF7F", fontSize: 14 }}>
              {status.message}
            </p>
          ) : null}
        </form>
      </div>
    </main>
  );
}
