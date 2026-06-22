import { saveBlog } from "../../../lib/blogs";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const body = await req.json();
    const tags = String(body.tags || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const post = saveBlog({
      title: body.title,
      slug: body.slug,
      excerpt: body.excerpt,
      content: body.content,
      author: body.author,
      status: body.status,
      tags,
    });

    return Response.json({ ok: true, post });
  } catch (error) {
    return Response.json({ ok: false, error: error.message || "Could not save blog." }, { status: 400 });
  }
}

