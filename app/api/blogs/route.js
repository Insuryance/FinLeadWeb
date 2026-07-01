import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createPost, getAllPosts } from "../../../lib/blogStore";

export const runtime = "nodejs";

export async function GET() {
  const posts = await getAllPosts();
  return NextResponse.json({ posts });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const post = await createPost(body);
    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);
    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Could not publish blog." }, { status: 400 });
  }
}
