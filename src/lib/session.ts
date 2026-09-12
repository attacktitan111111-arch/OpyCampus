import { db } from "./db";
import { cookies } from "next/headers";
import { SESSION_COOKIE, hashToken } from "./auth";

const fullUserInclude = {
  institution: true,
  memberships: { include: { institution: true } },
  followsGiven: { select: { followingId: true } },
  communityMemberships: { select: { communityId: true } },
} as const;

export type FullUser = Awaited<ReturnType<typeof db.user.findUnique>> & {};

export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const hashed = hashToken(token);
  const session = await db.session.findUnique({
    where: { token: hashed },
    include: { user: { include: fullUserInclude } },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return session.user;
}

// Returns the current user or null — never falls back. Used by API routes
// that require auth. Callers should return 401 when null.
export async function requireUser() {
  return getCurrentUser();
}
