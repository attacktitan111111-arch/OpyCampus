import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { serializeUser } from "@/lib/serializers";

export async function GET(req: NextRequest) {
  const me = await requireUser();
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
      include: {
        institution: true,
        memberships: { include: { institution: true } },
        followsGiven: { select: { followingId: true } },
        _count: { select: { posts: true, followsGiven: true, followsRecv: true } },
      },
      take: 20,
    });
    return NextResponse.json({
      users: users.map((u) => serializeUser(u)),
      isFollowing: (me?.followsGiven ?? []).map((f: any) => f.followingId),
    });
  }
  // No query: return suggested users (not already followed, exclude self)
  const followingIds = (me?.followsGiven ?? []).map((f: any) => f.followingId);
  const exclude = [...followingIds, me?.id].filter(Boolean) as string[];
  const users = await db.user.findMany({
    where: { id: { notIn: exclude } },
    include: {
      institution: true,
      memberships: { include: { institution: true } },
      followsGiven: { select: { followingId: true } },
      _count: { select: { posts: true, followsGiven: true, followsRecv: true } },
    },
    take: 12,
  });
  return NextResponse.json({
    users: users.map((u) => serializeUser(u)),
    isFollowing: followingIds,
  });
}
