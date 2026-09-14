import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { serializeUser } from "@/lib/serializers";

const userInclude = {
  institution: true,
  memberships: { include: { institution: true } },
  followsGiven: { select: { followingId: true } },
  communityMemberships: { select: { communityId: true } },
  _count: { select: { posts: true, followsGiven: true, followsRecv: true } },
};

// GET /api/conversations — list current user's conversations
export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ conversations: [] });

  const memberships = await db.conversationMember.findMany({
    where: { userId: me.id },
    include: {
      conversation: {
        include: {
          members: { include: { user: { include: userInclude } } },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
    orderBy: { conversation: { updatedAt: "desc" } },
  });

  const conversations = memberships.map((m) => {
    const other = m.conversation.members.find((mm) => mm.userId !== me.id);
    const lastMsg = m.conversation.messages[0];
    return {
      id: m.conversation.id,
      other: other ? serializeUser(other.user) : null,
      lastReadAt: m.lastReadAt,
      lastMessage: lastMsg ? { content: lastMsg.content, createdAt: lastMsg.createdAt, senderId: lastMsg.senderId } : null,
    };
  });

  return NextResponse.json({ conversations });
}

// POST /api/conversations — start or open a conversation with a user
export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Sign in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const targetUsername = (body.username ?? "").toString().trim();
  if (!targetUsername) return NextResponse.json({ error: "Username required" }, { status: 400 });

  const target = await db.user.findUnique({ where: { username: targetUsername } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.id === me.id) return NextResponse.json({ error: "Can't message yourself" }, { status: 400 });

  // Check if conversation already exists between these two users
  const existing = await db.conversationMember.findFirst({
    where: { userId: me.id, conversation: { members: { some: { userId: target.id } } } },
    include: { conversation: true },
  });

  if (existing) {
    return NextResponse.json({ conversationId: existing.conversationId });
  }

  // Create new conversation
  const conv = await db.conversation.create({
    data: {
      starterId: me.id,
      members: { create: [{ userId: me.id }, { userId: target.id }] },
    },
  });

  return NextResponse.json({ conversationId: conv.id });
}
