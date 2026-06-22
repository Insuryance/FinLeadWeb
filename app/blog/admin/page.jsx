"use client";

import React, { useMemo, useState } from "react";

const initialForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  author: "FinLead AI",
  tags: "",
  status: "published",
};

function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export default function BlogAdminPage() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ kind: "idle", message: "" });
  const [savedPost, setSavedPost] = useState(null);

  const effectiveSlug = useMemo(() => slugify(form.slug || form.title), [form.slug, form.title]);
  const previewJson = useMemo(() => JSON.stringify({
    slug: effectiveSlug,
    title: form.title,
    excerpt: form.excerpt,
    content: form.content,
    author: form.author,
    tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    status: form.status,
  }, null, 2), [effectiveSlug, form]);

  const update = (key) => (e) => setForm((curr) => ({ ...curr, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setStatus({ kind: "saving", message: "Saving post…" });
    setSavedPost(null);
    try {
      const res = await fetch("/api/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, slug: effectiveSlug }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Could not save blog.");
      setSavedPost(data.post);
      setStatus({ kind: "done", message: `Saved ${data.post.slug}.json into data/blogs/.` });
    } catch (error) {
      setStatus({ kind: "error", message: error.message || "Could not save blog." });
    }
  }

  const field = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    background: "#08080A",
    color: "#F4F1EA",
    border: "1px solid rgba(255,255,255,0.12)",
    fontSize: 14,
    fontFamily: "inherit",
  };
  const label = { color: "#928E84", fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8, display: "block" };

  return (
    <div style={{ minHeight: "100vh", background: "#08080A", color: "#F4F1EA", padding: "48px 20px", fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div style={{ maxWidth: 720, marginBottom: 26 }}>
          <div style={{ color: "#B6975C", fontSize: 12, letterSpacing: ".16em", textTransform: "uppercase", marginBottom: 12 }}>Hidden route · /blog/admin</div>
          <h1 style={{ fontSize: 34, lineHeight: 1.1, margin: 0, fontWeight: 500 }}>Blog admin</h1>
          <p style={{ color: "#928E84", fontSize: 15, lineHeight: 1.7, marginTop: 14 }}>
            Create or update blog posts here. Each save writes a JSON file directly into <code>data/blogs/</code> in this repo.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.2fr) minmax(320px,.8fr)", gap: 22, alignItems: "start" }}>
          <form onSubmit={submit} style={{ background: "#131317", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 22 }}>
            <div style={{ display: "grid", gap: 18 }}>
              <div>
                <label style={label}>Title</label>
                <input value={form.title} onChange={update("title")} placeholder="A clear blog title" style={field} />
              </div>
              <div>
                <label style={label}>Slug</label>
                <input value={form.slug} onChange={update("slug")} placeholder="Optional — auto-generated if blank" style={field} />
                <div style={{ color: "#928E84", fontSize: 12, marginTop: 8 }}>Final slug: <code>{effectiveSlug || "generated-from-title"}</code></div>
              </div>
              <div>
                <label style={label}>Excerpt</label>
                <textarea value={form.excerpt} onChange={update("excerpt")} rows={3} placeholder="Short summary for the blog index page" style={{ ...field, resize: "vertical" }} />
              </div>
              <div>
                <label style={label}>Content</label>
                <textarea value={form.content} onChange={update("content")} rows={14} placeholder="Write the blog body here…" style={{ ...field, resize: "vertical", lineHeight: 1.7 }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16 }}>
                <div>
                  <label style={label}>Author</label>
                  <input value={form.author} onChange={update("author")} style={field} />
                </div>
                <div>
                  <label style={label}>Status</label>
                  <select value={form.status} onChange={update("status")} style={field}>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={label}>Tags</label>
                <input value={form.tags} onChange={update("tags")} placeholder="insurance ops, product, reconciliation" style={field} />
              </div>

              <button
                type="submit"
                style={{
                  padding: "14px 18px",
                  borderRadius: 999,
                  border: "none",
                  cursor: "pointer",
                  background: "linear-gradient(135deg,#ECDDB4,#B6975C)",
                  color: "#1b1505",
                  fontWeight: 700,
                  fontSize: 15,
                }}
              >
                {status.kind === "saving" ? "Saving…" : "Save blog JSON"}
              </button>

              {status.kind !== "idle" && (
                <div style={{ color: status.kind === "error" ? "#FF7E7E" : status.kind === "done" ? "#6FCF7F" : "#F4F1EA", fontSize: 14 }}>
                  {status.message}
                </div>
              )}
              {savedPost && (
                <div style={{ color: "#928E84", fontSize: 13, lineHeight: 1.7 }}>
                  Saved file: <code>data/blogs/{savedPost.slug}.json</code><br />
                  Public URL: <code>/blog/{savedPost.slug}</code> {savedPost.status === "draft" ? "(drafts are hidden from the public list)" : ""}
                </div>
              )}
            </div>
          </form>

          <div style={{ background: "#131317", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 22, position: "sticky", top: 24 }}>
            <div style={{ color: "#928E84", fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 12 }}>JSON preview</div>
            <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", color: "#F4F1EA", fontSize: 12.5, lineHeight: 1.65 }}>{previewJson}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
