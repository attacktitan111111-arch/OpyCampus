import { NextResponse } from "next/server";
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

export async function GET() {
  const me = await requireUser();
  if (!me) return NextResponse.json({ posts: [] });
  const bookmarks = await db.bookmark.findMany({
    where: { userId: me.id },
    include: { post: { include } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({
    posts: bookmarks.map((b) => serializePost(b.post, me.id)),
  });
}
