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

export async function GET(req: NextRequest) {
  const me = await getCurrentUser();
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q) {
    const users = await db.user.findMany({
      where: {
        OR: [
          { username: { contains: q } },
          { name: { contains: q } },
          { department: { contains: q } },
        ],
      },
      include: userInclude,
      take: 20,
    });
    return NextResponse.json({
      users: users.map((u) => serializeUser(u)),
      isFollowing: (me?.followsGiven ?? []).map((f: any) => f.followingId),
    });
  }
  const followingIds = (me?.followsGiven ?? []).map((f: any) => f.followingId);
  const exclude = [...followingIds, me?.id].filter(Boolean) as string[];
  const users = await db.user.findMany({
    where: { id: { notIn: exclude } },
    include: userInclude,
    take: 12,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    users: users.map((u) => serializeUser(u)),
    isFollowing: followingIds,
  });
}
