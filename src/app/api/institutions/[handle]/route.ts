import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { serializeInstitution } from "@/lib/serializers";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ handle: string }> }) {
  const me = await getCurrentUser();
  const { handle } = await ctx.params;
  const inst = await db.institution.findUnique({
    where: { handle },
    include: {
      members: {
        include: {
          user: {
            include: {
              institution: true,
              followsGiven: { select: { followingId: true } },
              communityMemberships: { select: { communityId: true } },
              _count: { select: { posts: true, followsGiven: true, followsRecv: true } },
            },
          },
        },
      },
      _count: { select: { members: true, posts: true } },
    },
  });
  if (!inst) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ institution: serializeInstitution(inst, me?.id) });
}
