import { db } from "./db";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "scholar_uid";

export async function getCurrentUser() {
  const store = await cookies();
  const uid = store.get(SESSION_COOKIE)?.value;
  if (!uid) return null;
  const user = await db.user.findUnique({
    where: { id: uid },
    include: {
      institution: true,
      memberships: { include: { institution: true } },
      followsGiven: { select: { followingId: true } },
    },
  });
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    // Fall back to the first user (aria.chen) for the demo experience
    const fallback = await db.user.findFirst({
      where: { username: "aria.chen" },
      include: {
        institution: true,
        memberships: { include: { institution: true } },
        followsGiven: { select: { followingId: true } },
      },
    });
    return fallback;
  }
  return user;
}
