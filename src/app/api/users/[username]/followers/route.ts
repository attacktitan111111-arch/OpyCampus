import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { serializeUser } from "@/lib/serializers";

const userInclude = {
  institution: true,
  memberships: { include: { institution: true } },
  followsGiven: { select: { followingId: true } },
  communityMemberships: { select: { communityId: true } },
  _count: { select: { posts: true, followsGiven: true, followsRecv: true } },
};

export async function GET(_req: NextRequest, ctx: { params: Promise<{ username: string }> }) {
  const me = await getCurrentUser();
  const { username } = await ctx.params;
  const user = await db.user.findUnique({ where: { username }, select: { id: true } });
  if (!user) return NextResponse.json({ users: [] });

  const follows = await db.follow.findMany({
    where: { followingId: user.id },
    include: { follower: { include: userInclude } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({
    users: follows.map((f) => serializeUser(f.follower)),
    following: (me?.followsGiven ?? []).map((f: any) => f.followingId),
  });
}
