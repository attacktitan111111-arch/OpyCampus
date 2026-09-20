"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, keys } from "./api";
import { toast } from "sonner";

export interface User {
  id: string;
  username: string;
  name: string;
  bio: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  location: string | null;
  website: string | null;
  role: string;
  verified: boolean;
  department: string | null;
  institution: {
    id: string;
    name: string;
    handle: string;
    type: string;
    isPrivate: boolean;
    logoUrl: string | null;
  } | null;
  createdAt: string;
  followingIds: string[];
  communityIds: string[];
  _counts: { posts: number; followsGiven: number; followsRecv: number };
}

export interface MediaItem {
  url: string;
  type: "image" | "video";
}

export interface Post {
  id: string;
  content: string;
  media: MediaItem[];
  tags: string[];
  createdAt: string;
  author: User;
  institution: { id: string; name: string; handle: string; isPrivate: boolean } | null;
  community: { id: string; name: string; handle: string; isPrivate: boolean } | null;
  parent: { id: string; author: User } | null;
  // Quote repost: the original post being quoted (recursive Post shape).
  quoteOf: Post | null;
  liked: boolean;
  bookmarked: boolean;
  reposted: boolean;
  _counts: { likes: number; bookmarks: number; reposts: number; replies: number };
}

export interface Institution {
  id: string;
  name: string;
  handle: string;
  type: string;
  bio: string;
  logoUrl: string | null;
  coverUrl: string | null;
  website: string | null;
  location: string | null;
  verified: boolean;
  isPrivate: boolean;
  ownerId: string | null;
  members: { id: string; role: string; approved: boolean; user: User }[];
  isMember: boolean;
  memberRole: string | null;
  isOwner: boolean;
  _counts: { members: number; posts: number };
}

export interface Community {
  id: string;
  name: string;
  handle: string;
  description: string;
  iconUrl: string | null;
  coverUrl: string | null;
  category: string;
  isPrivate: boolean;
  ownerId: string;
  isOwner: boolean;
  isMember: boolean;
  memberRole: string | null;
  members: { id: string; role: string; user: User }[];
  _counts: { members: number; posts: number };
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  read: boolean;
  createdAt: string;
  actor: User;
  post: { id: string; content: string } | null;
}

// ---------- Queries ----------

export function useSession() {
  return useQuery({
    queryKey: keys.session,
    queryFn: () => api<{ user: User | null }>("/api/session"),
  });
}

export function useFeed(tab: string) {
  return useQuery({
    queryKey: keys.feed(tab),
    queryFn: () => api<{ posts: Post[]; nextCursor: string | null }>(`/api/feed?tab=${tab}`),
    enabled: !!tab,
  });
}

export function usePost(id: string | null) {
  return useQuery({
    queryKey: id ? keys.post(id) : ["post", "none"],
    queryFn: () => api<{ post: Post }>(`/api/posts/${id}`),
    enabled: !!id,
  });
}

export function useReplies(id: string | null, limit?: number) {
  return useQuery({
    queryKey: id ? keys.replies(id, limit) : ["replies", "none"],
    queryFn: () =>
      api<{ replies: Post[] }>(
        `/api/posts/${id}/replies${limit ? `?limit=${limit}` : ""}`
      ),
    enabled: !!id,
  });
}

export function useProfile(username: string) {
  return useQuery({
    queryKey: keys.profile(username),
    queryFn: () => api<{ user: User; isFollowing: boolean; isMe: boolean }>(`/api/users/${username}`),
    enabled: !!username,
  });
}

export function useUserPosts(username: string, tab: string) {
  return useQuery({
    queryKey: keys.userPosts(username, tab),
    queryFn: () => api<{ posts: Post[] }>(`/api/users/${username}/posts?tab=${tab}`),
    enabled: !!username,
  });
}

export function useUsersSearch(q: string) {
  return useQuery({
    queryKey: keys.usersSearch(q),
    queryFn: () => api<{ users: User[]; isFollowing: string[] }>(`/api/users${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  });
}

export function useInstitutionsSearch(q: string) {
  return useQuery({
    queryKey: keys.institutionsSearch(q),
    queryFn: () => api<{ institutions: Institution[] }>(`/api/institutions${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  });
}

export function useInstitution(handle: string) {
  return useQuery({
    queryKey: keys.institution(handle),
    queryFn: () => api<{ institution: Institution }>(`/api/institutions/${handle}`),
    enabled: !!handle,
  });
}

export function useInstitutionFeed(handle: string) {
  return useQuery({
    queryKey: keys.institutionFeed(handle),
    queryFn: () => api<{ posts: Post[]; gated: boolean }>(`/api/institutions/${handle}/feed`),
    enabled: !!handle,
  });
}

export function useCommunitiesSearch(q: string, mine = false) {
  return useQuery({
    queryKey: keys.communitiesSearch(q, mine),
    queryFn: () =>
      api<{ communities: Community[] }>(`/api/communities${q ? `?q=${encodeURIComponent(q)}` : ""}${mine ? `${q ? "&" : "?"}mine=true` : ""}`),
  });
}

export function useCommunity(handle: string) {
  return useQuery({
    queryKey: keys.community(handle),
    queryFn: () => api<{ community: Community }>(`/api/communities/${handle}`),
    enabled: !!handle,
  });
}

export function useCommunityFeed(handle: string) {
  return useQuery({
    queryKey: keys.communityFeed(handle),
    queryFn: () => api<{ posts: Post[]; gated: boolean }>(`/api/communities/${handle}/feed`),
    enabled: !!handle,
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: keys.notifications,
    queryFn: () => api<{ notifications: NotificationItem[]; unreadCount: number }>("/api/notifications"),
  });
}

export function useExplore(q: string) {
  return useQuery({
    queryKey: keys.explore(q),
    queryFn: () =>
      api<{ trending: { tag: string; count: number }[]; suggestedUsers: User[]; posts: Post[] }>(
        `/api/explore${q ? `?q=${encodeURIComponent(q)}` : ""}`
      ),
  });
}

export function useBookmarks() {
  return useQuery({
    queryKey: keys.bookmarks,
    queryFn: () => api<{ posts: Post[] }>("/api/bookmarks"),
  });
}

// ---------- Mutations ----------

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { content: string; media?: MediaItem[]; tags?: string | null; institutionId?: string | null; communityId?: string | null; parentId?: string | null; quoteOfId?: string | null }) =>
      api<{ post: Post }>("/api/posts", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_data, vars) => {
      // Optimistic: prepend the new post to the feed cache immediately
      if (!vars.parentId && _data.post) {
        const feedKey = keys.feed("foryou");
        const prev = qc.getQueryData<{ posts: Post[]; nextCursor: string | null }>(feedKey);
        if (prev) {
          qc.setQueryData(feedKey, { ...prev, posts: [_data.post, ...prev.posts] });
        }
      }
      // Only invalidate replies if it's a comment
      if (vars.parentId) {
        qc.invalidateQueries({ queryKey: ["replies", vars.parentId] });
        qc.invalidateQueries({ queryKey: ["post", vars.parentId] });
      }
    },
  });
}

/**
 * Quote a post — creates a new top-level Post authored by the current user
 * whose `quoteOfId` points at the original post. The user must provide
 * commentary text (no commentary = use the plain repost toggle instead).
 */
export function useQuotePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content, media, tags }: { id: string; content: string; media?: MediaItem[]; tags?: string | null }) =>
      api<{ post: Post }>(`/api/posts/${id}/quote`, {
        method: "POST",
        body: JSON.stringify({ content, media, tags }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["user-posts"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useUploadFile() {
  return useMutation({
    mutationFn: async (file: File) => {
      // Client-side validation for instant feedback
      const allowedTypes = [
        "image/jpeg", "image/png", "image/webp", "image/gif",
        "video/mp4", "video/webm", "video/quicktime",
      ];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Unsupported file type: ${file.type || "unknown"}. Use JPG, PNG, WEBP, GIF, MP4, WEBM or MOV.`);
      }
      const isVideo = file.type.startsWith("video/");
      const maxSize = isVideo ? 60 * 1024 * 1024 : 12 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max ${isVideo ? "60 MB" : "12 MB"}.`);
      }
      if (file.size === 0) {
        throw new Error("File is empty.");
      }

      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        /* ignore parse error */
      }
      if (!res.ok) {
        throw new Error(data?.error || `Upload failed (HTTP ${res.status})`);
      }
      return data as { id: string; url: string; type: "image" | "video"; mimeType: string; size: number };
    },
  });
}

function invalidateAllPosts(qc: QueryClientLike, id: string, transform: (p: Post) => Post) {
  const update = (cacheKey: any) => {
    const data = qc.getQueryData<any>(cacheKey);
    if (!data) return;
    const map = (p: Post) => (p.id === id ? transform(p) : p);
    if (Array.isArray(data.posts)) qc.setQueryData(cacheKey, { ...data, posts: data.posts.map(map) });
    else if (data.post) qc.setQueryData(cacheKey, { ...data, post: map(data.post) });
    else if (Array.isArray(data.replies)) qc.setQueryData(cacheKey, { ...data, replies: data.replies.map(map) });
  };
  update(keys.feed("foryou"));
  update(keys.feed("following"));
  update(keys.feed("institution"));
  update(keys.bookmarks);
}

type QueryClientLike = ReturnType<typeof useQueryClient>;

export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, liked }: { id: string; liked: boolean }) =>
      api(`/api/posts/${id}/like`, { method: "POST" }).then(() => ({ id, liked })),
    onMutate: async ({ id, liked }) => {
      invalidateAllPosts(qc, id, (p) => ({ ...p, liked: !liked, _counts: { ...p._counts, likes: p._counts.likes + (liked ? -1 : 1) } }));
    },
  });
}

export function useToggleBookmark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, bookmarked }: { id: string; bookmarked: boolean }) =>
      api(`/api/posts/${id}/bookmark`, { method: "POST" }).then(() => ({ id, bookmarked })),
    onMutate: async ({ id, bookmarked }) => {
      invalidateAllPosts(qc, id, (p) => ({ ...p, bookmarked: !bookmarked, _counts: { ...p._counts, bookmarks: p._counts.bookmarks + (bookmarked ? -1 : 1) } }));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.bookmarks }),
  });
}

export function useToggleRepost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reposted }: { id: string; reposted: boolean }) =>
      api(`/api/posts/${id}/repost`, { method: "POST" }).then(() => ({ id, reposted })),
    onMutate: async ({ id, reposted }) => {
      invalidateAllPosts(qc, id, (p) => ({ ...p, reposted: !reposted, _counts: { ...p._counts, reposts: p._counts.reposts + (reposted ? -1 : 1) } }));
    },
  });
}

export function useToggleFollow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ username }: { username: string }) =>
      api<{ following: boolean }>(`/api/users/${username}/follow`, { method: "POST" }),
    onMutate: async ({ username }) => {
      // Optimistic update — instantly flip the follow state in the profile cache
      const profileKey = keys.profile(username);
      const prev = qc.getQueryData<{ user: User; isFollowing: boolean; isMe: boolean }>(profileKey);
      if (prev) {
        qc.setQueryData(profileKey, {
          ...prev,
          isFollowing: !prev.isFollowing,
          user: {
            ...prev.user,
            _counts: {
              ...prev.user._counts,
              followsRecv: prev.user._counts.followsRecv + (prev.isFollowing ? -1 : 1),
            },
          },
        });
      }
      // Also update session (following count)
      const sessionKey = keys.session;
      const sess = qc.getQueryData<{ user: User | null }>(sessionKey);
      if (sess?.user) {
        qc.setQueryData(sessionKey, {
          ...sess,
          user: {
            ...sess.user,
            followingIds: prev?.isFollowing
              ? sess.user.followingIds.filter((id: string) => id !== prev.user.id)
              : [...sess.user.followingIds, prev?.user.id].filter(Boolean),
            _counts: {
              ...sess.user._counts,
              followsGiven: sess.user._counts.followsGiven + (prev?.isFollowing ? -1 : 1),
            },
          },
        });
      }
    },
    onSuccess: (_data, vars) => {
      // Only invalidate the profile — the optimistic update already handles the UI
      // Don't invalidate session/users/explore/feed — that causes unnecessary refetches
      qc.invalidateQueries({ queryKey: keys.profile(vars.username) });
    },
  });
}

export function useJoinInstitution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ handle }: { handle: string }) =>
      api<{ member: boolean }>(`/api/institutions/${handle}/join`, { method: "POST" }),
    onMutate: async ({ handle }) => {
      const key = keys.institution(handle);
      const prev = qc.getQueryData<{ institution: Institution }>(key);
      if (prev?.institution) {
        qc.setQueryData(key, {
          institution: {
            ...prev.institution,
            isMember: !prev.institution.isMember,
            _counts: {
              ...prev.institution._counts,
              members: prev.institution._counts.members + (prev.institution.isMember ? -1 : 1),
            },
          },
        });
      }
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: keys.institution(vars.handle) });
      qc.invalidateQueries({ queryKey: keys.institutionFeed(vars.handle) });
      qc.invalidateQueries({ queryKey: keys.session });
      qc.invalidateQueries({ queryKey: keys.feed("institution") });
    },
  });
}

export function useJoinCommunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ handle }: { handle: string }) =>
      api<{ member: boolean }>(`/api/communities/${handle}/join`, { method: "POST" }),
    onMutate: async ({ handle }) => {
      const key = keys.community(handle);
      const prev = qc.getQueryData<{ community: Community }>(key);
      if (prev?.community) {
        qc.setQueryData(key, {
          community: {
            ...prev.community,
            isMember: !prev.community.isMember,
            _counts: {
              ...prev.community._counts,
              members: prev.community._counts.members + (prev.community.isMember ? -1 : 1),
            },
          },
        });
      }
    },
    onSuccess: (data, vars) => {
      qc.invalidateQueries({ queryKey: keys.community(vars.handle) });
      qc.invalidateQueries({ queryKey: keys.communityFeed(vars.handle) });
      qc.invalidateQueries({ queryKey: keys.session });
      qc.invalidateQueries({ queryKey: ["communities"] });
      toast.success(data.member ? "Joined" : "Left");
    },
  });
}

export function useCreateInstitution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; handle: string; type: string; bio?: string; location?: string; website?: string; isPrivate?: boolean; logoUrl?: string | null; coverUrl?: string | null }) =>
      api<{ institution: Institution }>("/api/institutions", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["institutions"] });
      qc.invalidateQueries({ queryKey: keys.session });
    },
  });
}

export function useCreateCommunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; handle: string; description?: string; category: string; isPrivate?: boolean; iconUrl?: string | null; coverUrl?: string | null }) =>
      api<{ community: Community }>("/api/communities", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["communities"] });
      qc.invalidateQueries({ queryKey: keys.session });
    },
  });
}

export function useSignup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { email: string; username: string; name?: string; password: string; role?: "student" | "teacher" }) =>
      api<{ user: User }>("/api/auth/signup", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.session });
      qc.invalidateQueries();
    },
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { identifier: string; password: string }) =>
      api<{ user: User }>("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.session });
      qc.invalidateQueries();
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api("/api/auth/logout", { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries();
      qc.clear();
    },
  });
}

export function useMarkNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api("/api/notifications", { method: "PATCH" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.notifications }),
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/posts/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["user-posts"] });
      qc.invalidateQueries({ queryKey: keys.bookmarks });
      toast.success("Post deleted");
    },
  });
}

// ---------- Following / Followers / Reposts ----------

export function useFollowing(username: string) {
  return useQuery({
    queryKey: keys.following(username),
    queryFn: () => api<{ users: User[]; following: string[] }>(`/api/users/${username}/following`),
    enabled: !!username,
  });
}

export function useFollowers(username: string) {
  return useQuery({
    queryKey: keys.followers(username),
    queryFn: () => api<{ users: User[]; following: string[] }>(`/api/users/${username}/followers`),
    enabled: !!username,
  });
}

export function useUserReposts(username: string) {
  return useQuery({
    queryKey: keys.reposts(username),
    queryFn: () => api<{ posts: Post[] }>(`/api/users/${username}/reposts`),
    enabled: !!username,
  });
}

// ---------- Profile edit ----------

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name?: string; bio?: string; department?: string; location?: string; website?: string; avatarUrl?: string; coverUrl?: string }) =>
      api<{ user: User }>("/api/profile", { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.session });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

// ---------- Conversations (DMs) ----------

export function useConversations() {
  return useQuery({
    queryKey: keys.conversations,
    queryFn: () => api<{ conversations: { id: string; other: User | null; lastReadAt: string; lastMessage: { content: string; createdAt: string; senderId: string } | null }[] }>("/api/conversations"),
  });
}

export function useStartConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { username: string }) =>
      api<{ conversationId: string }>("/api/conversations", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.conversations }),
  });
}

export function useConversationMessages(id: string | null) {
  return useQuery({
    queryKey: id ? keys.conversationMessages(id) : ["conv-messages", "none"],
    queryFn: () => api<{ conversation: { id: string; other: User | null }; messages: MessageItem[] }>(`/api/conversations/${id}/messages`),
    enabled: !!id,
    staleTime: 30_000, // cache for 30s — don't refetch on every mount
    refetchOnMount: false, // don't refetch when navigating back
  });
}

export interface MessageItem {
  id: string;
  senderId: string;
  content: string;
  media: { url: string; type: "image" | "video" | "audio" | "file"; name?: string }[];
  createdAt: string;
  isMe: boolean;
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content, media }: { id: string; content: string; media?: { url: string; type: string; name?: string }[] }) =>
      api<{ message: MessageItem }>(`/api/conversations/${id}/messages`, { method: "POST", body: JSON.stringify({ content, media }) }),
    onMutate: async ({ id, content, media }) => {
      const key = keys.conversationMessages(id);
      const prev = qc.getQueryData<{ conversation: any; messages: MessageItem[] }>(key);
      if (prev) {
        const optimisticMsg: MessageItem = {
          id: `temp-${Date.now()}`,
          senderId: "me",
          content,
          media: (media ?? []) as any,
          createdAt: new Date().toISOString(),
          isMe: true,
        };
        qc.setQueryData(key, {
          ...prev,
          messages: [...prev.messages, optimisticMsg],
        });
      }
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: keys.conversationMessages(vars.id) });
      qc.invalidateQueries({ queryKey: keys.conversations });
    },
  });
}

// ---------- Legal pages ----------

export function useLegal(page: string) {
  return useQuery({
    queryKey: keys.legal(page),
    queryFn: () => api<{ title: string; body: string }>(`/api/legal?page=${page}`),
  });
}

export { useApp } from "./store";
