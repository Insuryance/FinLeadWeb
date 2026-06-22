import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlog, listBlogs } from "../../../lib/blogs";

export async function generateStaticParams() {
  return listBlogs().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }) {
  const post = getBlog(params.slug);
  if (!post) return {};
  return {
    title: `${post.title} | FinLead AI Blog`,
    description: post.excerpt,
  };
}

function fmt(date) {
  if (!date) return "Draft";
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function BlogPostPage({ params }) {
  const post = getBlog(params.slug);
  if (!post || post.status !== "published") notFound();

  return (
    <div className="fl-root" style={{ minHeight: "100vh", position: "relative", zIndex: 1 }}>
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "72px 24px 96px", position: "relative", zIndex: 10 }}>
        <Link href="/blog" style={{ color: "var(--muted)", fontSize: 13 }}>&larr; All posts</Link>
        <p className="fl-eyebrow" style={{ marginTop: 28, marginBottom: 14 }}>FinLead AI · Blog</p>
        <h1 className="fl-serif" style={{ fontWeight: 350, fontSize: "clamp(34px,5vw,56px)", lineHeight: 1.08, letterSpacing: "-.02em", margin: 0 }}>
          {post.title}
        </h1>
        <div className="fl-muted" style={{ marginTop: 18, fontSize: 14 }}>
          {fmt(post.publishedAt)} · {post.author}
        </div>
        <div className="fl-glass" style={{ padding: "30px 28px", marginTop: 28 }}>
          <div style={{ color: "var(--ivory)", fontSize: 16, lineHeight: 1.85, whiteSpace: "pre-wrap" }}>
            {post.content}
          </div>
        </div>
      </div>
    </div>
  );
}
