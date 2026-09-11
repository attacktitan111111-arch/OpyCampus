import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  hashPassword,
  newSessionToken,
  hashToken,
  sessionExpiry,
  SESSION_MAX_AGE,
  validateEmail,
  validateUsername,
  validatePassword,
  slugifyHandle,
} from "@/lib/auth";
import { serializeUser } from "@/lib/serializers";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = (body.email ?? "").toString().trim().toLowerCase();
  const username = (body.username ?? "").toString().trim();
  const name = (body.name ?? "").toString().trim() || username;
  const password = (body.password ?? "").toString();
  const role = (body.role ?? "student").toString() === "teacher" ? "teacher" : "student";

  const emailErr = validateEmail(email);
  if (emailErr) return NextResponse.json({ error: emailErr, field: "email" }, { status: 400 });
  const userErr = validateUsername(username);
  if (userErr) return NextResponse.json({ error: userErr, field: "username" }, { status: 400 });
  const passErr = validatePassword(password);
  if (passErr) return NextResponse.json({ error: passErr, field: "password" }, { status: 400 });

  const existing = await db.user.findFirst({
    where: { OR: [{ email }, { username: username.toLowerCase() }, { username: username.toUpperCase() }, { username }] },
  });
  if (existing) {
    if (existing.email === email)
      return NextResponse.json({ error: "An account with this email already exists", field: "email" }, { status: 409 });
    return NextResponse.json({ error: "This username is taken", field: "username" }, { status: 409 });
  }

  const user = await db.user.create({
    data: {
      email,
      username: slugifyHandle(username) || username.toLowerCase(),
      name,
      password: hashPassword(password),
      role,
    },
    include: {
      institution: true,
      memberships: { include: { institution: true } },
      followsGiven: { select: { followingId: true } },
      communityMemberships: { select: { communityId: true } },
    },
  });

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
