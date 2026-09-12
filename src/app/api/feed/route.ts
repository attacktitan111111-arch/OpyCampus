import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { serializePost } from "@/lib/serializers";
import { postInclude } from "@/lib/post-include";

export async function GET(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ posts: [] });
  const { searchParams } = new URL(req.url);
  const tab = searchParams.get("tab") ?? "foryou"; // foryou | following | institution
  const limit = Number(searchParams.get("limit") ?? 25);
  const cursor = searchParams.get("cursor") ?? undefined;

  const followingIds = me.followsGiven.map((f) => f.followingId);
  const followingPlusMe = [...followingIds, me.id];

  let where: any = { parentId: null };

  if (tab === "following") {
    where.authorId = { in: followingPlusMe };
  } else if (tab === "institution") {
    const myInstIds = me.memberships.map((m) => m.institutionId);
    if (myInstIds.length === 0) {
      return NextResponse.json({ posts: [], nextCursor: null });
    }
    where.institutionId = { in: myInstIds };
  } else {
    // foryou: public posts OR institutions user is a member of OR communities they're in
    const myInstIds = me.memberships.map((m) => m.institutionId);
    const myCommIds = me.communityMemberships.map((m) => m.communityId);
    where.OR = [
      { institutionId: null, communityId: null },
      { institutionId: { in: myInstIds } },
      { communityId: { in: myCommIds } },
    ];
  }

  const posts = await db.post.findMany({
    where,
    include: postInclude,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = posts.length > limit;
  const sliced = hasMore ? posts.slice(0, limit) : posts;
  return NextResponse.json({
    posts: sliced.map((p) => serializePost(p, me.id)),
    nextCursor: hasMore ? sliced[sliced.length - 1].id : null,
  });
}
