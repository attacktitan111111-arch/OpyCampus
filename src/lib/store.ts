"use client";

import { create } from "zustand";

export type View =
  | { name: "home" }
  | { name: "explore" }
  | { name: "search"; query?: string }
  | { name: "activity" }
  | { name: "profile"; username: string; tab?: "posts" | "replies" | "likes" | "reposts" }
  | { name: "post"; postId: string }
  | { name: "institution"; handle: string }
  | { name: "community"; handle: string }
  | { name: "communities" }
  | { name: "institutions" }
  | { name: "settings" }
  | { name: "bookmarks" }
  | { name: "tag"; tag: string }
  | { name: "messages" }
  | { name: "conversation"; id: string }
  | { name: "edit-profile" }
  | { name: "onboarding" }
  | { name: "legal"; page: string }
  | { name: "follows"; username: string; tab: "following" | "followers" };

interface ComposeState {
  open: boolean;
  replyTo?: { id: string; authorName: string; authorUsername: string } | null;
  // Quote-repost mode: the original post being quoted. When set, the compose
  // dialog shows the quoted post as a non-editable block above the text area
  // and the submit button calls /api/posts/[id]/quote instead of /api/posts.
  quoteOf?: {
    id: string;
    authorName: string;
    authorUsername: string;
    content: string;
    createdAt?: string;
  } | null;
  scope?: { kind: "public" } | { kind: "institution"; id: string } | { kind: "community"; id: string } | null;
  prefillText?: string;
}

interface AppState {
  view: View;
  history: View[];
  compose: ComposeState;
  authOpen: "login" | "signup" | null;
  nav: (v: View) => void;
  back: () => void;
  canBack: () => boolean;
  openCompose: (opts?: Partial<ComposeState>) => void;
  closeCompose: () => void;
  openAuth: (mode: "login" | "signup") => void;
  closeAuth: () => void;
}

// Flag to prevent popstate from re-pushing during programmatic back
let suppressPush = false;

// Set up browser history integration once
if (typeof window !== "undefined") {
  window.addEventListener("popstate", (e) => {
    suppressPush = true;
    const state = e.state as View | null;
    if (state && state.name) {
      const { history } = useApp.getState();
      useApp.setState({
        view: state,
        history: history.slice(0, -1),
      });
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    } else {
      // No state — go to home
      useApp.setState({ view: { name: "home" }, history: [] });
    }
    setTimeout(() => { suppressPush = false; }, 50);
  });
}

export const useApp = create<AppState>((set, get) => ({
  view: { name: "home" },
  history: [],
  compose: { open: false },
  authOpen: null,
  nav: (v) => {
    const { view, history } = get();
    if (view.name === v.name && JSON.stringify(view) === JSON.stringify(v)) return;
    set({ view: v, history: [...history, view].slice(-30) });
    if (typeof window !== "undefined") {
      // Push to browser history so the back button works within the app
      if (!suppressPush) {
        window.history.pushState(v, "", window.location.href);
      }
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  },
  back: () => {
    const { history } = get();
    if (history.length === 0) {
      // No internal history — use browser back (exits app if at root)
      if (typeof window !== "undefined") {
        window.history.back();
      }
      return;
    }
    // Use browser history back — popstate listener will update state
    if (typeof window !== "undefined") {
      window.history.back();
    } else {
      // Fallback for SSR
      const prev = history[history.length - 1];
      set({ view: prev, history: history.slice(0, -1) });
    }
  },
  canBack: () => get().history.length > 0,
  openCompose: (opts) =>
    set({
      compose: {
        open: true,
        replyTo: opts?.replyTo ?? null,
        quoteOf: opts?.quoteOf ?? null,
        scope: opts?.scope ?? null,
        prefillText: opts?.prefillText ?? "",
      },
    }),
  closeCompose: () => set({ compose: { open: false, replyTo: null, quoteOf: null, scope: null, prefillText: "" } }),
  openAuth: (mode) => set({ authOpen: mode }),
  closeAuth: () => set({ authOpen: null }),
}));

// Replace the initial history state with our home view
if (typeof window !== "undefined") {
  window.history.replaceState({ name: "home" } as View, "", window.location.href);
}
