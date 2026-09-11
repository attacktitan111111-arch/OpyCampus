import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { serializePost } from "@/lib/serializers";

const include = {
  author: {
    include: {
      institution: true,
      memberships: { include: { institution: true } },
      followsGiven: { select: { followingId: true } },
      communityMemberships: { select: { communityId: true } },
      _count: { select: { posts: true, followsGiven: true, followsRecv: true } },
    },
  },
  institution: { select: { id: true, name: true, handle: true, isPrivate: true } },
  community: { select: { id: true, name: true, handle: true, isPrivate: true } },
  parent: { include: { author: { include: { institution: true } } } },
  likes: { select: { userId: true } },
  bookmarks: { select: { userId: true } },
  reposts: { select: { userId: true } },
  _count: { select: { likes: true, bookmarks: true, reposts: true, replies: true } },
};

export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Sign in to post" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const content = (body.content ?? "").toString().trim();
  const mediaRaw = Array.isArray(body.media) ? body.media : [];
  // normalize media items: {url, type}
  const media = mediaRaw
    .filter((m: any) => m && m.url)
    .slice(0, 4)
    .map((m: any) => ({ url: m.url, type: m.type === "video" ? "video" : "image" }));

  if (!content && media.length === 0) {
    return NextResponse.json({ error: "Write something or add media" }, { status: 400 });
  }
  if (content.length > 500) return NextResponse.json({ error: "Text too long (max 500)" }, { status: 400 });

  const tags = (body.tags ?? null) as string | null;
  const institutionId = body.institutionId ?? null;
  const communityId = body.communityId ?? null;
  const parentId = body.parentId ?? null;

  // Membership checks
  if (institutionId) {
    const member = me.memberships.find((m) => m.institutionId === institutionId);
    if (!member) return NextResponse.json({ error: "Not a member of this institution" }, { status: 403 });
  }
  if (communityId) {
    const member = await db.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId: me.id } },
    });
    if (!member) return NextResponse.json({ error: "Not a member of this community" }, { status: 403 });
  }

  const post = await db.post.create({
    data: {
      content,
      media: media.length ? JSON.stringify(media) : null,
      tags,
      authorId: me.id,
      institutionId,
      communityId,
      parentId,
    },
    include,
  });

  // Notify parent author on reply
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
