import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { serializePost } from "@/lib/serializers";
import { postInclude } from "@/lib/post-include";

/**
 * POST /api/posts/[id]/quote
 * Body: { content: string, media?: MediaItem[], tags?: string }
 *
 * Creates a new top-level Post authored by the current user that quotes the
 * post identified by [id]. The new post has:
 *   - content = user's quote text (required — quoting with no commentary is
 *     just a regular repost, handled by /api/posts/[id]/repost)
 *   - quoteOfId = [id]
 *   - parentId = null (quote posts are top-level)
 *
 * The quoted post's author gets a "repost" notification.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Sign in to quote" }, { status: 401 });
  const { id } = await ctx.params;

  // Validate the quoted post exists and is not itself a quote.
  const quoted = await db.post.findUnique({
    where: { id },
    select: { id: true, authorId: true, quoteOfId: true },
  });
  if (!quoted) return NextResponse.json({ error: "Quoted post not found" }, { status: 404 });
  if (quoted.quoteOfId) return NextResponse.json({ error: "Can't quote a quote post" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const content = (body.content ?? "").toString().trim();
  if (!content) {
    return NextResponse.json({ error: "Write something to quote" }, { status: 400 });
  }
  if (content.length > 500) {
    return NextResponse.json({ error: "Text too long (max 500)" }, { status: 400 });
  }

  const mediaRaw = Array.isArray(body.media) ? body.media : [];
  const media = mediaRaw
    .filter((m: any) => m && m.url)
    .slice(0, 4)
    .map((m: any) => ({ url: m.url, type: m.type === "video" ? "video" : "image" }));

  // Quote posts are always top-level (no parentId). Institution/community
  // scoping doesn't apply — a quote lives on the author's own timeline.
  const tags = (body.tags ?? null) as string | null;

  const post = await db.post.create({
    data: {
      content,
      media: media.length ? JSON.stringify(media) : null,
      tags,
      authorId: me.id,
      quoteOfId: id,
    },
    include: postInclude,
  });

  // Notify the quoted post's author (unless self).
  if (quoted.authorId !== me.id) {
    await db.notification.create({
      data: { type: "repost", toUserId: quoted.authorId, actorId: me.id, postId: post.id },
    });
  }

  return NextResponse.json({ post: serializePost(post, me.id) });
}
