import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { serializeUser } from "@/lib/serializers";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ username: string }> }) {
  const me = await getCurrentUser();
  const { username } = await ctx.params;
  const user = await db.user.findUnique({
    where: { username },
    include: {
      institution: true,
      memberships: { include: { institution: true } },
      followsGiven: { select: { followingId: true } },
      communityMemberships: { select: { communityId: true } },
      _count: { select: { posts: true, followsGiven: true, followsRecv: true } },
    },
  });
  if (!user) return NextResponse.json({ error: "not found" }, { status: 404 });
  const isFollowing = (me?.followsGiven ?? []).some((f: any) => f.followingId === user.id);
  return NextResponse.json({
    user: serializeUser(user),
    isFollowing,
    isMe: me?.id === user.id,
  });
}
