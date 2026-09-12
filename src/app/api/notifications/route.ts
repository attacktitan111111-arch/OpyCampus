import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { serializeUser } from "@/lib/serializers";

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ notifications: [] });
  const notifs = await db.notification.findMany({
    where: { toUserId: me.id },
    include: {
      actor: {
        include: {
          institution: true,
          memberships: { include: { institution: true } },
          followsGiven: { select: { followingId: true } },
          communityMemberships: { select: { communityId: true } },
          _count: { select: { posts: true, followsGiven: true, followsRecv: true } },
        },
      },
      post: { select: { id: true, content: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  return NextResponse.json({
    notifications: notifs.map((n) => ({
      id: n.id,
      type: n.type,
      read: n.read,
      createdAt: n.createdAt,
      actor: serializeUser(n.actor),
      post: n.post ? { id: n.post.id, content: n.post.content } : null,
    })),
    unreadCount: notifs.filter((n) => !n.read).length,
  });
}

export async function PATCH() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await db.notification.updateMany({
    where: { toUserId: me.id, read: false },
    data: { read: true },
  });
  return NextResponse.json({ ok: true });
}
