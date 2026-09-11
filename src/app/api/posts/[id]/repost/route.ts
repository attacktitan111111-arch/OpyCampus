import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const existing = await db.repost.findUnique({
    where: { userId_postId: { userId: me.id, postId: id } },
  });
  if (existing) {
    await db.repost.delete({ where: { id: existing.id } });
    return NextResponse.json({ reposted: false });
  }
  await db.repost.create({ data: { userId: me.id, postId: id } });
  // notify author
  const post = await db.post.findUnique({ where: { id }, select: { authorId: true } });
  if (post && post.authorId !== me.id) {
    await db.notification.create({
      data: { type: "repost", toUserId: post.authorId, actorId: me.id, postId: id },
    });
  }
  return NextResponse.json({ reposted: true });
}
