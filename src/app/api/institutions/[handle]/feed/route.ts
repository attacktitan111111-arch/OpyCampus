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

export async function GET(req: NextRequest, ctx: { params: Promise<{ handle: string }> }) {
  const me = await requireUser();
  const { handle } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? 30);

  const inst = await db.institution.findUnique({
    where: { handle },
    include: { members: { select: { userId: true } } },
  });
  if (!inst) return NextResponse.json({ posts: [], gated: false });

  const isMember = inst.members.some((m) => m.userId === me?.id);
  if (inst.isPrivate && !isMember) {
    return NextResponse.json({ posts: [], gated: true });
  }

  const posts = await db.post.findMany({
    where: { institutionId: inst.id, parentId: null },
    include,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({
    posts: posts.map((p) => serializePost(p, me?.id)),
    gated: false,
  });
}
