import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { serializeUser } from "@/lib/serializers";

export async function PATCH(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Sign in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const data: any = {};

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    if (name.length > 60) return NextResponse.json({ error: "Name too long" }, { status: 400 });
    data.name = name;
  }
  if (typeof body.bio === "string") {
    data.bio = body.bio.trim().slice(0, 160) || null;
  }
  if (typeof body.department === "string") {
    data.department = body.department.trim().slice(0, 80) || null;
  }
  if (typeof body.location === "string") {
    data.location = body.location.trim().slice(0, 80) || null;
  }
  if (typeof body.website === "string") {
    const w = body.website.trim();
    data.website = w ? w.slice(0, 200) : null;
  }
  if (typeof body.avatarUrl === "string") {
    data.avatarUrl = body.avatarUrl || null;
  }
  if (typeof body.coverUrl === "string") {
    data.coverUrl = body.coverUrl || null;
  }

  const updated = await db.user.update({
    where: { id: me.id },
    data,
    include: {
      institution: true,
      memberships: { include: { institution: true } },
      followsGiven: { select: { followingId: true } },
      communityMemberships: { select: { communityId: true } },
      _count: { select: { posts: true, followsGiven: true, followsRecv: true } },
    },
  });

  return NextResponse.json({ user: serializeUser(updated) });
}
