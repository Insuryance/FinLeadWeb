import fs from "fs";
import path from "path";

const BLOG_DIR = path.join(process.cwd(), "data", "blogs");

function ensureBlogDir() {
  if (!fs.existsSync(BLOG_DIR)) fs.mkdirSync(BLOG_DIR, { recursive: true });
}

function blogPath(slug) {
  return path.join(BLOG_DIR, `${slug}.json`);
}

export function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function listBlogs() {
  ensureBlogDir();
  const files = fs.readdirSync(BLOG_DIR).filter((file) => file.endsWith(".json"));
  const posts = files.map((file) => {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
    return JSON.parse(raw);
  });
  return posts.sort((a, b) => {
    const ad = new Date(a.publishedAt || a.updatedAt || a.createdAt || 0).getTime();
    const bd = new Date(b.publishedAt || b.updatedAt || b.createdAt || 0).getTime();
    return bd - ad;
  });
}

export function getBlog(slug) {
  ensureBlogDir();
  const target = blogPath(slug);
  if (!fs.existsSync(target)) return null;
  return JSON.parse(fs.readFileSync(target, "utf8"));
}

export function saveBlog(input) {
  ensureBlogDir();
  const now = new Date().toISOString();
  const slug = slugify(input.slug || input.title);
  if (!slug) throw new Error("A valid title or slug is required.");

  const existing = getBlog(slug);
  const post = {
    slug,
    title: String(input.title || "").trim(),
    excerpt: String(input.excerpt || "").trim(),
    content: String(input.content || "").trim(),
    author: String(input.author || "FinLead AI").trim(),
    tags: Array.isArray(input.tags) ? input.tags : [],
    status: input.status === "draft" ? "draft" : "published",
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    publishedAt: input.status === "draft" ? existing?.publishedAt || null : existing?.publishedAt || now,
  };

  if (!post.title || !post.excerpt || !post.content) {
    throw new Error("Title, excerpt, and content are required.");
  }

  fs.writeFileSync(blogPath(slug), JSON.stringify(post, null, 2) + "\n", "utf8");
  return post;
}

