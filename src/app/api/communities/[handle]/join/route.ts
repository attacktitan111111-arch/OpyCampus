import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ handle: string }> }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Sign in to join" }, { status: 401 });
  const { handle } = await ctx.params;
  const community = await db.community.findUnique({ where: { handle }, select: { id: true, ownerId: true } });
  if (!community) return NextResponse.json({ error: "not found" }, { status: 404 });
  const existing = await db.communityMember.findUnique({
    where: { communityId_userId: { communityId: community.id, userId: me.id } },
  });
  if (existing) {
    if (community.ownerId === me.id) {
      return NextResponse.json({ error: "Owners can't leave their community" }, { status: 400 });
    }
    await db.communityMember.delete({ where: { id: existing.id } });
    return NextResponse.json({ member: false });
  }
  await db.communityMember.create({
    data: { communityId: community.id, userId: me.id, role: "member" },
  });
  return NextResponse.json({ member: true });
}
