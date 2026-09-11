"use client";

import { create } from "zustand";

export type View =
  | { name: "home" }
  | { name: "explore" }
  | { name: "search"; query?: string }
  | { name: "activity" }
  | { name: "profile"; username: string; tab?: "posts" | "replies" | "likes" }
  | { name: "post"; postId: string }
  | { name: "institution"; handle: string }
  | { name: "settings" }
  | { name: "bookmarks" }
  | { name: "tag"; tag: string };

interface ComposeState {
  open: boolean;
  replyTo?: { id: string; authorName: string; authorUsername: string } | null;
  institutionId?: string | null;
  prefillText?: string;
}

interface AppState {
  view: View;
  history: View[];
  compose: ComposeState;
  nav: (v: View) => void;
  back: () => void;
  canBack: () => boolean;
  openCompose: (opts?: Partial<ComposeState>) => void;
  closeCompose: () => void;
}

export const useApp = create<AppState>((set, get) => ({
  view: { name: "home" },
  history: [],
  compose: { open: false },
  nav: (v) => {
    const { view, history } = get();
    if (view.name === v.name && JSON.stringify(view) === JSON.stringify(v)) return;
    set({ view: v, history: [...history, view].slice(-30) });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  },
  back: () => {
    const { history } = get();
    if (history.length === 0) {
      set({ view: { name: "home" } });
      return;
    }
    const prev = history[history.length - 1];
    set({ view: prev, history: history.slice(0, -1) });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  },
  canBack: () => get().history.length > 0,
  openCompose: (opts) =>
    set({ compose: { open: true, replyTo: opts?.replyTo ?? null, institutionId: opts?.institutionId ?? null, prefillText: opts?.prefillText ?? "" } }),
  closeCompose: () => set({ compose: { open: false, replyTo: null, institutionId: null, prefillText: "" } }),
}));
