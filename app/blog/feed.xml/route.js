import { posts } from "../posts";

function escapeXml(value) {
  return value.replace(/[<>&'"]/g, (character) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;",
  }[character]));
}

export function GET() {
  const items = posts.map((post) => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>https://finlead.ai/blog/${post.slug}</link>
      <guid>https://finlead.ai/blog/${post.slug}</guid>
      <pubDate>${new Date(`${post.published}T12:00:00Z`).toUTCString()}</pubDate>
      <description>${escapeXml(post.dek)}</description>
      <category>${escapeXml(post.category)}</category>
    </item>`).join("");

  return new Response(`<?xml version="1.0" encoding="UTF-8" ?>
  <rss version="2.0"><channel>
    <title>FinLead Briefing</title>
    <link>https://finlead.ai/blog</link>
    <description>Intelligence for insurance operations.</description>
    <language>en</language>${items}
  </channel></rss>`, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
