import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, SESSION_COOKIE } from "@/lib/session";
import { serializeUser } from "@/lib/serializers";

const DEFAULT_USERNAME = "aria.chen";

async function loadFullUser(id: string) {
  return db.user.findUnique({
    where: { id },
    include: {
      institution: true,
      memberships: { include: { institution: true } },
      followsGiven: { select: { followingId: true } },
    },
  });
}

export async function GET() {
  let user = await getCurrentUser();
  // Bootstrap: if no session yet, sign in as the demo default user and set the cookie
  if (!user) {
    const def = await db.user.findUnique({
      where: { username: DEFAULT_USERNAME },
      include: {
        institution: true,
        memberships: { include: { institution: true } },
        followsGiven: { select: { followingId: true } },
      },
    });
    if (!def) return NextResponse.json({ user: null });
    user = def;
    const res = NextResponse.json({ user: serializeUser(user) });
    res.cookies.set(SESSION_COOKIE, user.id, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return res;
  }
  return NextResponse.json({ user: serializeUser(user) });
}

// Switch the active demo user (cookie-based, for the demo experience)
export async function POST(req: Request) {
  const { username } = await req.json().catch(() => ({}));
  if (!username) return NextResponse.json({ error: "username required" }, { status: 400 });
  const user = await db.user.findUnique({
    where: { username },
    include: {
      institution: true,
      memberships: { include: { institution: true } },
      followsGiven: { select: { followingId: true } },
    },
  });
  if (!user) return NextResponse.json({ error: "user not found" }, { status: 404 });
  const res = NextResponse.json({ user: serializeUser(user) });
  res.cookies.set(SESSION_COOKIE, user.id, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}
