import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug } from "../../../lib/blogStore";

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }) {
  const post = await getPostBySlug(params.slug);
  if (!post) return { title: "Blog not found" };
  return {
    title: `${post.title} | FinLead AI Blog`,
    description: post.content.replace(/\s+/g, " ").trim().slice(0, 150),
  };
}

function formatDate(value) {
  try {
    return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return value;
  }
}

function renderBlocks(content) {
  return content
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, index) => {
      if (block.startsWith("## ")) return <h2 key={index} className="fl-serif" style={{ fontSize: 30, margin: "34px 0 12px" }}>{block.slice(3)}</h2>;
      if (block.startsWith("# ")) return <h2 key={index} className="fl-serif" style={{ fontSize: 34, margin: "38px 0 14px" }}>{block.slice(2)}</h2>;
      return <p key={index} style={{ margin: "0 0 18px", color: "var(--muted)", fontSize: 17, lineHeight: 1.8 }}>{block}</p>;
    });
}

export default async function BlogPostPage({ params }) {
  const post = await getPostBySlug(params.slug);
  if (!post) notFound();

  return (
    <main style={{ minHeight: "100vh", background: "#08080A", color: "#F4F1EA", padding: "118px 24px 72px" }}>
      <article style={{ maxWidth: 820, margin: "0 auto" }}>
        <a href="/blog" style={{ display: "inline-block", marginBottom: 18, color: "var(--muted)", fontSize: 14 }}>← Back to blog</a>
        <p className="fl-eyebrow" style={{ marginBottom: 14 }}>FinLead AI Blog</p>
        <h1 className="fl-serif" style={{ fontSize: "clamp(36px,5vw,60px)", lineHeight: 1.04, margin: 0 }}>{post.title}</h1>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 18, marginBottom: 28, color: "var(--muted)", fontSize: 15 }}>
          <span>{post.author}</span>
          <span>•</span>
          <span>{formatDate(post.publishedAt)}</span>
        </div>
        {post.coverImage ? (
          <img
            src={post.coverImage}
            alt={post.title}
            style={{ width: "100%", display: "block", borderRadius: 24, marginBottom: 30, border: "1px solid var(--line)" }}
          />
        ) : null}
        <div>{renderBlocks(post.content)}</div>
      </article>
    </main>
  );
}
