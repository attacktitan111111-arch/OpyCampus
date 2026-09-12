import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  verifyPassword,
  newSessionToken,
  hashToken,
  sessionExpiry,
  SESSION_MAX_AGE,
} from "@/lib/auth";
import { serializeUser } from "@/lib/serializers";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const identifier = (body.identifier ?? "").toString().trim(); // email or username
  const password = (body.password ?? "").toString();

  if (!identifier || !password)
    return NextResponse.json({ error: "Enter your email or username and password" }, { status: 400 });

  const isEmail = identifier.includes("@");
  // SQLite doesn't support mode:"insensitive" — fetch by lowercased field
  const user = await db.user.findFirst({
    where: isEmail
      ? { email: identifier.toLowerCase() }
      : { OR: [{ username: identifier }, { username: identifier.toLowerCase() }, { username: identifier.toUpperCase() }] },
    include: {
      institution: true,
      memberships: { include: { institution: true } },
      followsGiven: { select: { followingId: true } },
      communityMemberships: { select: { communityId: true } },
    },
  });

  if (!user || !verifyPassword(password, user.password)) {
    return NextResponse.json({ error: "Incorrect email/username or password" }, { status: 401 });
  }

  const token = newSessionToken();
  await db.session.create({
    data: { token: hashToken(token), userId: user.id, expiresAt: sessionExpiry() },
  });

  const res = NextResponse.json({ user: serializeUser(user) });
  res.cookies.set("scholar_session", token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
