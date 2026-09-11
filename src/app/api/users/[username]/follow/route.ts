import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ username: string }> }) {
  const me = await requireUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { username } = await ctx.params;
  const target = await db.user.findUnique({ where: { username }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (target.id === me.id) return NextResponse.json({ error: "cannot follow self" }, { status: 400 });
  const existing = await db.follow.findUnique({
    where: { followerId_followingId: { followerId: me.id, followingId: target.id } },
  });
  if (existing) {
    await db.follow.delete({ where: { id: existing.id } });
    return NextResponse.json({ following: false });
  }
  await db.follow.create({ data: { followerId: me.id, followingId: target.id } });
  await db.notification.create({
    data: { type: "follow", toUserId: target.id, actorId: me.id },
  });
  return NextResponse.json({ following: true });
}
