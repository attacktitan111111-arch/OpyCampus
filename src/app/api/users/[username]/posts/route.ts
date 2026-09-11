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

export async function GET(req: NextRequest, ctx: { params: Promise<{ username: string }> }) {
  const me = await requireUser();
  const { username } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const tab = searchParams.get("tab") ?? "posts"; // posts | replies | likes
  const limit = Number(searchParams.get("limit") ?? 30);

  const user = await db.user.findUnique({ where: { username }, select: { id: true } });
  if (!user) return NextResponse.json({ posts: [] });

  let where: any = {};
  if (tab === "replies") {
    where = { authorId: user.id, parentId: { not: null } };
  } else if (tab === "likes") {
    const likes = await db.like.findMany({
      where: { userId: user.id },
      select: { postId: true },
    });
    const ids = likes.map((l) => l.postId);
    const posts = await db.post.findMany({
      where: { id: { in: ids } },
      include,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return NextResponse.json({ posts: posts.map((p) => serializePost(p, me?.id)) });
  } else {
    where = { authorId: user.id, parentId: null };
  }

  const posts = await db.post.findMany({
    where,
    include,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ posts: posts.map((p) => serializePost(p, me?.id)) });
}
