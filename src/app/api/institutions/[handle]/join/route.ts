import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ handle: string }> }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Sign in to join" }, { status: 401 });
  const { handle } = await ctx.params;
  const inst = await db.institution.findUnique({ where: { handle }, select: { id: true, ownerId: true } });
  if (!inst) return NextResponse.json({ error: "not found" }, { status: 404 });
  const existing = await db.institutionMember.findUnique({
    where: { institutionId_userId: { institutionId: inst.id, userId: me.id } },
  });
  if (existing) {
    // Owner can't leave their own institution
    if (inst.ownerId === me.id) {
      return NextResponse.json({ error: "Owners can't leave their institution" }, { status: 400 });
    }
    await db.institutionMember.delete({ where: { id: existing.id } });
    return NextResponse.json({ member: false });
  }
  await db.institutionMember.create({
    data: { institutionId: inst.id, userId: me.id, role: "member", approved: true },
  });
  return NextResponse.json({ member: true });
}
