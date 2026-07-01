import { promises as fs } from "fs";
import path from "path";

const BLOGS_PATH = path.join(process.cwd(), "data", "blogs.json");

function clean(value) {
  return String(value ?? "").replace(/\r/g, "").trim();
}

function slugify(value) {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function ensureStore() {
  await fs.mkdir(path.dirname(BLOGS_PATH), { recursive: true });
  try {
    await fs.access(BLOGS_PATH);
  } catch {
    await fs.writeFile(BLOGS_PATH, JSON.stringify({ posts: [] }, null, 2));
  }
}

async function readStore() {
  await ensureStore();
  const raw = await fs.readFile(BLOGS_PATH, "utf8");
  const parsed = JSON.parse(raw || "{}");
  return Array.isArray(parsed.posts) ? parsed : { posts: [] };
}

async function writeStore(store) {
  await ensureStore();
  await fs.writeFile(BLOGS_PATH, JSON.stringify(store, null, 2) + "\n", "utf8");
}

export async function getAllPosts() {
  const store = await readStore();
  return [...store.posts].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
}

export async function getPostBySlug(slug) {
  const posts = await getAllPosts();
  return posts.find((post) => post.slug === slug) || null;
}

export async function createPost(input) {
  const title = clean(input.title);
  const author = clean(input.author) || "FinLead AI";
  const content = clean(input.content);
  const coverImage = clean(input.coverImage);
  const publishedAt = clean(input.publishedAt) || new Date().toISOString().slice(0, 10);

  if (!title) throw new Error("Title is required.");
  if (!content) throw new Error("Content is required.");

  const store = await readStore();
  const baseSlug = slugify(input.slug || title);
  if (!baseSlug) throw new Error("Could not generate a valid slug.");

  let slug = baseSlug;
  let suffix = 2;
  while (store.posts.some((post) => post.slug === slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const now = new Date().toISOString();
  const post = {
    id: `${Date.now()}`,
    slug,
    title,
    author,
    content,
    coverImage,
    publishedAt,
    createdAt: now,
    updatedAt: now,
  };

  store.posts.unshift(post);
  await writeStore(store);
  return post;
}
