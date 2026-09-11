import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { serializeInstitution } from "@/lib/serializers";
import { slugifyHandle } from "@/lib/auth";

const instInclude = {
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
};

export async function GET(req: NextRequest) {
  const me = await getCurrentUser();
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  const where = q
    ? { OR: [{ name: { contains: q } }, { handle: { contains: q } }] }
    : {};

  const institutions = await db.institution.findMany({
    where,
    include: instInclude,
    take: 30,
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    institutions: institutions.map((i) => serializeInstitution(i, me?.id)),
  });
}

export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Sign in to create an institution" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = (body.name ?? "").toString().trim();
  const handle = slugifyHandle((body.handle ?? name).toString());
  const type = ["school", "college", "university", "institute"].includes(body.type) ? body.type : "university";
  const bio = (body.bio ?? "").toString().trim() || null;
  const location = (body.location ?? "").toString().trim() || null;
  const website = (body.website ?? "").toString().trim() || null;
  const isPrivate = !!body.isPrivate;
  const logoUrl = body.logoUrl ? body.logoUrl.toString() : null;
  const coverUrl = body.coverUrl ? body.coverUrl.toString() : null;

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (name.length > 80) return NextResponse.json({ error: "Name is too long" }, { status: 400 });
  if (!handle) return NextResponse.json({ error: "Handle is required" }, { status: 400 });

  const existing = await db.institution.findUnique({ where: { handle } });
  if (existing) return NextResponse.json({ error: "This handle is already taken" }, { status: 409 });

  const inst = await db.institution.create({
    data: {
      name,
      handle,
      type,
      bio,
      location,
      website,
      isPrivate,
      logoUrl,
      coverUrl,
      ownerId: me.id,
      verified: false,
      members: {
        create: { userId: me.id, role: "admin", approved: true },
      },
    },
    include: instInclude,
  });

  return NextResponse.json({ institution: serializeInstitution(inst, me.id) });
}
