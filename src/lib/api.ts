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
    let message = txt || `request failed: ${res.status}`;
    try {
      const j = JSON.parse(txt);
      if (j?.error) message = j.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
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
  following: (username: string) => ["following", username] as const,
  followers: (username: string) => ["followers", username] as const,
  reposts: (username: string) => ["reposts", username] as const,
  usersSearch: (q: string) => ["users", q] as const,
  institutionsSearch: (q: string) => ["institutions", q] as const,
  institution: (handle: string) => ["institution", handle] as const,
  institutionFeed: (handle: string) => ["institution-feed", handle] as const,
  communitiesSearch: (q: string, mine: boolean) => ["communities", q, mine ? "mine" : "all"] as const,
  community: (handle: string) => ["community", handle] as const,
  communityFeed: (handle: string) => ["community-feed", handle] as const,
  notifications: ["notifications"] as const,
  explore: (q: string) => ["explore", q] as const,
  bookmarks: ["bookmarks"] as const,
  conversations: ["conversations"] as const,
  conversationMessages: (id: string) => ["conv-messages", id] as const,
  legal: (page: string) => ["legal", page] as const,
};
