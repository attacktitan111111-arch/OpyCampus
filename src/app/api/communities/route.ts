import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { serializeCommunity } from "@/lib/serializers";
import { slugifyHandle } from "@/lib/auth";

const commInclude = {
  members: {
    include: {
      user: {
        include: {
          institution: true,
          followsGiven: { select: { followingId: true } },
          communityMemberships: { select: { communityId: true } },
          _count: { select: { posts: true, followsGiven: true, followsRecv: true } },
        },
      },
    },
  },
  _count: { select: { members: true, posts: true } },
};

export async function GET(req: NextRequest) {
  const me = await getCurrentUser();
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const mine = searchParams.get("mine") === "true";

  const where: any = {};
  if (q) where.OR = [{ name: { contains: q } }, { handle: { contains: q } }];
  if (mine && me) where.members = { some: { userId: me.id } };

  const communities = await db.community.findMany({
    where,
    include: commInclude,
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  return NextResponse.json({
    communities: communities.map((c) => serializeCommunity(c, me?.id)),
  });
}

export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Sign in to create a community" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = (body.name ?? "").toString().trim();
  const handle = slugifyHandle((body.handle ?? name).toString());
  const description = (body.description ?? "").toString().trim() || null;
  const category = ["study", "club", "hobby", "course", "project", "other"].includes(body.category) ? body.category : "study";
  const isPrivate = !!body.isPrivate;
  const iconUrl = body.iconUrl ? body.iconUrl.toString() : null;
  const coverUrl = body.coverUrl ? body.coverUrl.toString() : null;

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (name.length > 60) return NextResponse.json({ error: "Name is too long" }, { status: 400 });
  if (!handle) return NextResponse.json({ error: "Handle is required" }, { status: 400 });

  const existing = await db.community.findUnique({ where: { handle } });
  if (existing) return NextResponse.json({ error: "This handle is already taken" }, { status: 409 });

  const community = await db.community.create({
    data: {
      name,
      handle,
      description,
      category,
      isPrivate,
      iconUrl,
      coverUrl,
      ownerId: me.id,
      members: { create: { userId: me.id, role: "owner" } },
    },
    include: commInclude,
  });

  return NextResponse.json({ community: serializeCommunity(community, me.id) });
}
