import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { serializePost } from "@/lib/serializers";

const include = {
  author: {
    include: {
      institution: true,
      followsGiven: { select: { followingId: true } },
      _count: { select: { posts: true, followsGiven: true, followsRecv: true } },
    },
  },
  institution: { select: { id: true, name: true, handle: true, isPrivate: true } },
  parent: { include: { author: { include: { institution: true } } } },
  likes: { select: { userId: true } },
  bookmarks: { select: { userId: true } },
  reposts: { select: { userId: true } },
  _count: { select: { likes: true, bookmarks: true, reposts: true, replies: true } },
};

export async function POST(req: NextRequest) {
  const me = await requireUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const content = (body.content ?? "").toString().trim();
  if (!content) return NextResponse.json({ error: "content required" }, { status: 400 });
  if (content.length > 500) return NextResponse.json({ error: "too long" }, { status: 400 });

  const images = Array.isArray(body.images) ? body.images.filter(Boolean).slice(0, 4) : [];
  const tags = (body.tags ?? null) as string | null;
  const institutionId = body.institutionId ?? null;
  const parentId = body.parentId ?? null;

  // If posting to an institution, ensure membership
  if (institutionId) {
    const member = me.memberships.find((m) => m.institutionId === institutionId);
    if (!member) return NextResponse.json({ error: "not a member" }, { status: 403 });
  }

  const post = await db.post.create({
    data: {
      content,
      images: images.length ? JSON.stringify(images) : null,
      tags,
      authorId: me.id,
      institutionId,
      parentId,
    },
    include,
  });

  // If it's a reply, notify the parent author
  if (parentId) {
    const parent = await db.post.findUnique({ where: { id: parentId }, select: { authorId: true } });
    if (parent && parent.authorId !== me.id) {
      await db.notification.create({
        data: { type: "reply", toUserId: parent.authorId, actorId: me.id, postId: post.id },
      });
    }
  }

  return NextResponse.json({ post: serializePost(post, me.id) });
}
