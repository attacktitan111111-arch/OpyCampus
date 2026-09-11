import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { serializePost } from "@/lib/serializers";
import { postInclude } from "@/lib/post-include";

export async function GET(req: NextRequest, ctx: { params: Promise<{ handle: string }> }) {
  const me = await getCurrentUser();
  const { handle } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? 30);

  const community = await db.community.findUnique({
    where: { handle },
    include: { members: { select: { userId: true } } },
  });
  if (!community) return NextResponse.json({ posts: [], gated: false });

  const isMember = community.members.some((m) => m.userId === me?.id);
  if (community.isPrivate && !isMember) {
    return NextResponse.json({ posts: [], gated: true });
  }

  const posts = await db.post.findMany({
    where: { communityId: community.id, parentId: null },
    include: postInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({
    posts: posts.map((p) => serializePost(p, me?.id)),
    gated: false,
  });
}
