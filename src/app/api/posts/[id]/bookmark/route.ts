import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const { id } = await ctx.params;
  const existing = await db.bookmark.findUnique({
    where: { userId_postId: { userId: me.id, postId: id } },
  });
  if (existing) {
    await db.bookmark.delete({ where: { id: existing.id } });
    return NextResponse.json({ bookmarked: false });
  }
  await db.bookmark.create({ data: { userId: me.id, postId: id } });
  return NextResponse.json({ bookmarked: true });
}
