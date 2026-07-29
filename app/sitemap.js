import { posts } from "./blog/posts";

export default function sitemap() {
  const updated = new Date();
  return [
    { url: "https://finlead.ai", lastModified: updated, changeFrequency: "monthly", priority: 1 },
    { url: "https://finlead.ai/blog", lastModified: updated, changeFrequency: "weekly", priority: 0.9 },
    { url: "https://finlead.ai/insight", lastModified: updated, changeFrequency: "monthly", priority: 0.7 },
    ...posts.map((post) => ({
      url: `https://finlead.ai/blog/${post.slug}`,
      lastModified: new Date(`${post.updated}T00:00:00Z`),
      changeFrequency: "monthly",
      priority: 0.8,
    })),
  ];
}
