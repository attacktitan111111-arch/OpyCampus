import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { serializePost } from "@/lib/serializers";
import { postInclude } from "@/lib/post-include";

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ posts: [] });
  const bookmarks = await db.bookmark.findMany({
    where: { userId: me.id },
    include: { post: { include: postInclude } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({
    posts: bookmarks.map((b) => serializePost(b.post, me.id)),
  });
}
