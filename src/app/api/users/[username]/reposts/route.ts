import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { serializePost } from "@/lib/serializers";
import { postInclude } from "@/lib/post-include";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ username: string }> }) {
  const me = await getCurrentUser();
  const { username } = await ctx.params;
  const user = await db.user.findUnique({ where: { username }, select: { id: true } });
  if (!user) return NextResponse.json({ posts: [] });

  const reposts = await db.repost.findMany({
    where: { userId: user.id },
    include: { post: { include: postInclude } },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return NextResponse.json({
    posts: reposts.map((r) => serializePost(r.post, me?.id)),
  });
}
