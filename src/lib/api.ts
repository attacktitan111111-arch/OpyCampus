"use client";

// Lightweight typed fetchers used by TanStack Query hooks.
export async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const keys = {
  session: ["session"] as const,
  feed: (tab: string) => ["feed", tab] as const,
  post: (id: string) => ["post", id] as const,
  replies: (id: string) => ["replies", id] as const,
  profile: (username: string) => ["profile", username] as const,
  userPosts: (username: string, tab: string) => ["user-posts", username, tab] as const,
  usersSearch: (q: string) => ["users", q] as const,
  institutionsSearch: (q: string) => ["institutions", q] as const,
  institution: (handle: string) => ["institution", handle] as const,
  institutionFeed: (handle: string) => ["institution-feed", handle] as const,
  notifications: ["notifications"] as const,
  explore: (q: string) => ["explore", q] as const,
  bookmarks: ["bookmarks"] as const,
};
