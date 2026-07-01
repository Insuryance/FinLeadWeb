import Link from "next/link";
import { getAllPosts } from "../../lib/blogStore";

export const metadata = {
  title: "FinLead AI Blog",
  description: "Thoughts and updates from FinLead AI.",
};

function formatDate(value) {
  try {
    return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return value;
  }
}

function preview(content) {
  return content.replace(/\s+/g, " ").trim().slice(0, 180) + (content.length > 180 ? "…" : "");
}

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <main style={{ minHeight: "100vh", background: "#08080A", color: "#F4F1EA", padding: "118px 24px 72px" }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <div style={{ marginBottom: 32 }}>
          <p className="fl-eyebrow" style={{ marginBottom: 14 }}>Blog</p>
          <h1 className="fl-serif" style={{ fontSize: "clamp(34px,5vw,56px)", lineHeight: 1.05, margin: 0 }}>Insights from FinLead AI</h1>
          <p className="fl-muted" style={{ maxWidth: 680, marginTop: 16, fontSize: 17 }}>
            Notes on insurance operations, AI workflows, and what we are learning while building FinLead.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="fl-glass" style={{ padding: 28, borderRadius: 22 }}>
            <p style={{ margin: 0, fontSize: 16, color: "var(--muted)" }}>No posts published yet.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 18 }}>
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="fl-glass"
                style={{ display: "block", padding: 24, borderRadius: 22, transition: "transform .25s ease, border-color .25s ease" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 560px" }}>
                    <h2 className="fl-serif" style={{ fontSize: 28, lineHeight: 1.15, margin: "0 0 10px" }}>{post.title}</h2>
                    <p className="fl-muted" style={{ margin: 0, fontSize: 15.5 }}>{preview(post.content)}</p>
                  </div>
                  <div style={{ minWidth: 160, textAlign: "right" }}>
                    <div style={{ color: "var(--gold)", fontSize: 13, marginBottom: 6 }}>{formatDate(post.publishedAt)}</div>
                    <div style={{ color: "var(--muted)", fontSize: 14 }}>{post.author}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
