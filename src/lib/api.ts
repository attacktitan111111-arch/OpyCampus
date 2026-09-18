"use client";

// Custom error thrown when the browser reports no network connection OR when
// a fetch itself fails (e.g. DNS error, server unreachable). This is caught
// by the ErrorBoundary and surfaces a friendly "You're offline" screen
// instead of an unhelpful generic error (and definitely no auto-reload loop).
export class NetworkError extends Error {
  readonly isNetworkError = true;
  constructor(message = "You're offline") {
    super(message);
    this.name = "NetworkError";
  }
}

/**
 * Returns true when the browser reports no network connection. We use the
 * standard `navigator.onLine` flag, which is supported in all modern browsers
 * (including iOS Safari). Note: `onLine` can be `true` even when the network
 * is unreachable (e.g. captive portal), so we ALSO catch fetch failures below.
 */
function isOffline(): boolean {
  if (typeof navigator === "undefined") return false;
  return navigator.onLine === false;
}

// Lightweight typed fetchers used by TanStack Query hooks.
export async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  // Pre-check: if the browser says we're offline, fail fast with a friendly
  // error instead of waiting for the fetch to time out. This prevents the
  // "page reloads repeatedly" bug users hit when going offline.
  if (isOffline()) {
    throw new NetworkError("You're offline");
  }

  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      credentials: "include",
    });
  } catch (err) {
    // fetch() throws a TypeError when the request can't be completed at all
    // — DNS failure, no network, server unreachable, CORS, etc. We surface
    // these as NetworkError so the ErrorBoundary shows the offline screen.
    throw new NetworkError(
      err instanceof Error && err.message ? err.message : "Network request failed"
    );
  }

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
  replies: (id: string, limit?: number) => ["replies", id, limit ?? "all"] as const,
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
