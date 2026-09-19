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

function parseMedia(raw: any) {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

// GET messages in a conversation
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const { id } = await ctx.params;

  const member = await db.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: me.id } },
  });
  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const conv = await db.conversation.findUnique({
    where: { id },
    include: {
      members: { include: { user: { include: userInclude } } },
      messages: { orderBy: { createdAt: "asc" }, take: 200 },
    },
  });
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const other = conv.members.find((m) => m.userId !== me.id);

  await db.conversationMember.update({
    where: { id: member.id },
    data: { lastReadAt: new Date() },
  });

  return NextResponse.json({
    conversation: {
      id: conv.id,
      other: other ? serializeUser(other.user) : null,
    },
    messages: conv.messages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      content: m.content,
      media: parseMedia(m.media),
      createdAt: m.createdAt,
      isMe: m.senderId === me.id,
    })),
  });
}

// POST a new message (supports text + media)
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const { id } = await ctx.params;

  const member = await db.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: me.id } },
  });
  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const content = (body.content ?? "").toString().trim();
  const mediaRaw = Array.isArray(body.media) ? body.media.filter((m: any) => m && m.url).slice(0, 4) : [];
  
  if (!content && mediaRaw.length === 0) return NextResponse.json({ error: "Empty message" }, { status: 400 });
  if (content.length > 2000) return NextResponse.json({ error: "Too long" }, { status: 400 });

  const media = mediaRaw.map((m: any) => ({
    url: m.url,
    type: m.type === "video" ? "video" : m.type === "audio" ? "audio" : m.type === "file" ? "file" : "image",
    name: m.name ?? undefined,
  }));

  const msg = await db.message.create({
    data: {
      conversationId: id,
      senderId: me.id,
      content: content || "",
      media: media.length ? JSON.stringify(media) : null,
    },
  });

  await db.conversation.update({ where: { id }, data: { updatedAt: new Date() } });

  return NextResponse.json({
    message: {
      id: msg.id,
      senderId: msg.senderId,
      content: msg.content,
      media,
      createdAt: msg.createdAt,
      isMe: true,
    },
  });
}
