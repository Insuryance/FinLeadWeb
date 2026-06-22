import Link from "next/link";
import { listBlogs } from "../../lib/blogs";

export const metadata = {
  title: "FinLead AI Blog",
  description: "Notes, product updates, and insurance operations insights from FinLead AI.",
};

function fmt(date) {
  if (!date) return "Draft";
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function BlogIndexPage() {
  const posts = listBlogs().filter((post) => post.status === "published");

  return (
    <div className="fl-root" style={{ minHeight: "100vh", position: "relative", zIndex: 1 }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "72px 24px 96px", position: "relative", zIndex: 10 }}>
        <Link href="/" style={{ color: "var(--muted)", fontSize: 13 }}>&larr; FinLead AI</Link>
        <p className="fl-eyebrow" style={{ marginTop: 28, marginBottom: 14 }}>FinLead AI · Blog</p>
        <h1 className="fl-serif" style={{ fontWeight: 350, fontSize: "clamp(30px,5vw,52px)", lineHeight: 1.08, letterSpacing: "-.02em", margin: 0 }}>
          Notes from the team building <span className="fl-gold-grad">insurance AI agents.</span>
        </h1>
        <p className="fl-muted" style={{ fontSize: 17, lineHeight: 1.7, maxWidth: "62ch", marginTop: 22 }}>
          Product updates, insurance operations insights, and thinking from FinLead AI.
        </p>

        <div style={{ display: "grid", gap: 18, marginTop: 36 }}>
          {posts.length === 0 ? (
            <div className="fl-glass" style={{ padding: 28 }}>
              <div style={{ color: "var(--ivory)", fontSize: 18 }}>No published posts yet.</div>
              <div className="fl-muted" style={{ marginTop: 10, fontSize: 14 }}>Visit the hidden admin route to create the first one.</div>
            </div>
          ) : posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="fl-glass" style={{ padding: 24, display: "block" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ color: "var(--ivory)", fontSize: 28, lineHeight: 1.15 }} className="fl-serif">{post.title}</div>
                </div>
                <div className="fl-muted" style={{ fontSize: 13, whiteSpace: "nowrap" }}>{fmt(post.publishedAt)}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
