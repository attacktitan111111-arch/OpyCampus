import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { serializeInstitution } from "@/lib/serializers";

export async function GET(req: NextRequest) {
  const me = await requireUser();
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  const where = q
    ? { OR: [{ name: { contains: q } }, { handle: { contains: q } }] }
    : {};

  const institutions = await db.institution.findMany({
    where,
    include: {
      members: { include: { user: { include: { institution: true, followsGiven: { select: { followingId: true } } } } } },
      _count: { select: { members: true, posts: true } },
    },
    take: 30,
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    institutions: institutions.map((i) => serializeInstitution(i, me?.id)),
  });
}
