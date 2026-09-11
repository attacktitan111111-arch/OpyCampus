"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, keys } from "./api";
import { useApp } from "./store";
import { toast } from "sonner";

export interface User {
  id: string;
  username: string;
  name: string;
  bio: string;
  avatarUrl: string | null;
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
  _counts: { posts: number; followsGiven: number; followsRecv: number };
}

export interface Post {
  id: string;
  content: string;
  images: string[];
  tags: string[];
  createdAt: string;
  author: User;
  institution: { id: string; name: string; handle: string; isPrivate: boolean } | null;
  parent: { id: string; author: User } | null;
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
  members: { id: string; role: string; approved: boolean; user: User }[];
  isMember: boolean;
  memberRole: string | null;
  _counts: { members: number; posts: number };
}

export interface NotificationItem {
  id: string;
  type: string;
  read: boolean;
  createdAt: string;
  actor: User;
  post: { id: string; content: string } | null;
}

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
  });
}

export function usePost(id: string | null) {
  return useQuery({
    queryKey: id ? keys.post(id) : ["post", "none"],
    queryFn: () => api<{ post: Post }>(`/api/posts/${id}`),
    enabled: !!id,
  });
}

export function useReplies(id: string | null) {
  return useQuery({
    queryKey: id ? keys.replies(id) : ["replies", "none"],
    queryFn: () => api<{ replies: Post[] }>(`/api/posts/${id}/replies`),
    enabled: !!id,
  });
}

export function useProfile(username: string) {
  return useQuery({
    queryKey: keys.profile(username),
    queryFn: () => api<{ user: User; isFollowing: boolean; isMe: boolean }>(`/api/users/${username}`),
  });
}

export function useUserPosts(username: string, tab: string) {
  return useQuery({
    queryKey: keys.userPosts(username, tab),
    queryFn: () => api<{ posts: Post[] }>(`/api/users/${username}/posts?tab=${tab}`),
  });
}

export function useUsersSearch(q: string) {
  return useQuery({
    queryKey: keys.usersSearch(q),
    queryFn: () => api<{ users: User[]; isFollowing: string[] }>(`/api/users${q ? `?q=${encodeURIComponent(q)}` : ""}`),
    enabled: q.length >= 0,
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
  });
}

export function useInstitutionFeed(handle: string) {
  return useQuery({
    queryKey: keys.institutionFeed(handle),
    queryFn: () => api<{ posts: Post[]; gated: boolean }>(`/api/institutions/${handle}/feed`),
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

// --- Mutations ---

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { content: string; images?: string[]; tags?: string | null; institutionId?: string | null; parentId?: string | null }) =>
      api<{ post: Post }>("/api/posts", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["user-posts"] });
      qc.invalidateQueries({ queryKey: ["institution-feed"] });
    },
  });
}

export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, liked }: { id: string; liked: boolean }) =>
      api(`/api/posts/${id}/like`, { method: "POST" }).then(() => ({ id, liked })),
    onMutate: async ({ id, liked }) => {
      const update = (cacheKey: any) => {
        const data = qc.getQueryData<any>(cacheKey);
        if (!data) return;
        const map = (p: Post) =>
          p.id === id
            ? { ...p, liked: !liked, _counts: { ...p._counts, likes: p._counts.likes + (liked ? -1 : 1) } }
            : p;
        if (Array.isArray(data.posts)) {
          qc.setQueryData(cacheKey, { ...data, posts: data.posts.map(map) });
        } else if (data.post) {
          qc.setQueryData(cacheKey, { ...data, post: map(data.post) });
        } else if (Array.isArray(data.replies)) {
          qc.setQueryData(cacheKey, { ...data, replies: data.replies.map(map) });
        }
      };
      update(keys.feed("foryou"));
      update(keys.feed("following"));
      update(keys.feed("institution"));
      update(keys.bookmarks);
      return { id, liked };
    },
  });
}

export function useToggleBookmark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, bookmarked }: { id: string; bookmarked: boolean }) =>
      api(`/api/posts/${id}/bookmark`, { method: "POST" }).then(() => ({ id, bookmarked })),
    onMutate: async ({ id, bookmarked }) => {
      const update = (cacheKey: any) => {
        const data = qc.getQueryData<any>(cacheKey);
        if (!data) return;
        const map = (p: Post) =>
          p.id === id
            ? { ...p, bookmarked: !bookmarked, _counts: { ...p._counts, bookmarks: p._counts.bookmarks + (bookmarked ? -1 : 1) } }
            : p;
        if (Array.isArray(data.posts)) qc.setQueryData(cacheKey, { ...data, posts: data.posts.map(map) });
        else if (data.post) qc.setQueryData(cacheKey, { ...data, post: map(data.post) });
        else if (Array.isArray(data.replies)) qc.setQueryData(cacheKey, { ...data, replies: data.replies.map(map) });
      };
      update(keys.feed("foryou"));
      update(keys.feed("following"));
      update(keys.feed("institution"));
      update(keys.bookmarks);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.bookmarks });
    },
  });
}

export function useToggleRepost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reposted }: { id: string; reposted: boolean }) =>
      api(`/api/posts/${id}/repost`, { method: "POST" }).then(() => ({ id, reposted })),
    onMutate: async ({ id, reposted }) => {
      const update = (cacheKey: any) => {
        const data = qc.getQueryData<any>(cacheKey);
        if (!data) return;
        const map = (p: Post) =>
          p.id === id
            ? { ...p, reposted: !reposted, _counts: { ...p._counts, reposts: p._counts.reposts + (reposted ? -1 : 1) } }
            : p;
        if (Array.isArray(data.posts)) qc.setQueryData(cacheKey, { ...data, posts: data.posts.map(map) });
        else if (data.post) qc.setQueryData(cacheKey, { ...data, post: map(data.post) });
      };
      update(keys.feed("foryou"));
      update(keys.feed("following"));
      update(keys.feed("institution"));
    },
  });
}

export function useToggleFollow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ username }: { username: string }) =>
      api<{ following: boolean }>(`/api/users/${username}/follow`, { method: "POST" }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: keys.profile(vars.username) });
      qc.invalidateQueries({ queryKey: keys.session });
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["explore"] });
      qc.invalidateQueries({ queryKey: keys.feed("following") });
    },
  });
}

export function useJoinInstitution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ handle }: { handle: string }) =>
      api<{ member: boolean }>(`/api/institutions/${handle}/join`, { method: "POST" }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: keys.institution(vars.handle) });
      qc.invalidateQueries({ queryKey: keys.institutionFeed(vars.handle) });
      qc.invalidateQueries({ queryKey: keys.session });
      qc.invalidateQueries({ queryKey: keys.feed("institution") });
      toast.success(_data.member ? "Joined institution feed" : "Left institution feed");
    },
  });
}

export function useSwitchUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ username }: { username: string }) =>
      api<{ user: User }>("/api/session", { method: "POST", body: JSON.stringify({ username }) }),
    onSuccess: () => {
      qc.invalidateQueries();
      toast.success("Switched account");
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

export { useApp } from "./store";
