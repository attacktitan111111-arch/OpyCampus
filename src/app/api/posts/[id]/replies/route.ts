import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { serializePost } from "@/lib/serializers";
import { postInclude } from "@/lib/post-include";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  const { id } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? 50);

  const replies = await db.post.findMany({
    where: { parentId: id },
    include: postInclude,
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  return NextResponse.json({ replies: replies.map((r) => serializePost(r, me?.id)) });
}
