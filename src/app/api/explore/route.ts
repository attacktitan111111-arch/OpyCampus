import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { serializePost, serializeUser } from "@/lib/serializers";
import { postInclude } from "@/lib/post-include";

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

  // Trending tags
  const allPosts = await db.post.findMany({
    where: { tags: { not: null } },
    select: { tags: true },
    take: 500,
  });
  const tagCount: Record<string, number> = {};
  for (const p of allPosts) {
    if (!p.tags) continue;
    for (const t of p.tags.split(",")) {
      const tag = t.trim().toLowerCase();
      if (tag) tagCount[tag] = (tagCount[tag] ?? 0) + 1;
    }
  }
  const trending = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  // Suggested users
  const followingIds = (me?.followsGiven ?? []).map((f: any) => f.followingId);
  const exclude = [...followingIds, me?.id].filter(Boolean) as string[];
  const suggestedUsers = await db.user.findMany({
    where: { id: { notIn: exclude } },
    include: userInclude,
    take: 6,
    orderBy: { createdAt: "desc" },
  });

  let matchedPosts: any[] = [];
  if (q) {
    matchedPosts = await db.post.findMany({
      where: { content: { contains: q } },
      include: postInclude,
      orderBy: { createdAt: "desc" },
      take: 30,
    });
  }

  return NextResponse.json({
    trending,
    suggestedUsers: suggestedUsers.map((u) => serializeUser(u)),
    posts: matchedPosts.map((p) => serializePost(p, me?.id)),
  });
}
