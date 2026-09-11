import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { serializePost } from "@/lib/serializers";

const include = {
  author: {
    include: {
      institution: true,
      followsGiven: { select: { followingId: true } },
      _count: { select: { posts: true, followsGiven: true, followsRecv: true } },
    },
  },
  institution: { select: { id: true, name: true, handle: true, isPrivate: true } },
  parent: { include: { author: { include: { institution: true } } } },
  likes: { select: { userId: true } },
  bookmarks: { select: { userId: true } },
  reposts: { select: { userId: true } },
  _count: { select: { likes: true, bookmarks: true, reposts: true, replies: true } },
};

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  const { id } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? 50);

  const replies = await db.post.findMany({
    where: { parentId: id },
    include,
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  return NextResponse.json({ replies: replies.map((r) => serializePost(r, me?.id)) });
}
