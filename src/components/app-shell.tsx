"use client";

import { useEffect, useRef, useState } from "react";
import { Home, Plus, User as UserIcon, Bookmark, Settings as SettingsIcon, Search, ArrowLeft, Users, LogOut, Bell, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp, useSession, useNotifications, useLogout } from "@/lib/hooks";
import { OpyCampusLogo } from "./opycampus-logo";
import { ThemeToggle } from "./theme-toggle";
import { UserAvatar, VerifiedBadge } from "./user-avatar";
import { CommunityIcon } from "./custom-icons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ComposeBox } from "./compose-box";
import { AuthOverlay } from "./auth-overlay";

interface NavItem {
  key: string;
  label: string;
  icon: typeof Home | typeof CommunityIcon;
  view: Parameters<ReturnType<typeof useApp.getState>["nav"]>[0];
  match: (v: ReturnType<typeof useApp.getState>["view"]) => boolean;
  customIcon?: "community";
}

const NAV: NavItem[] = [
  { key: "home", label: "Home", icon: Home, view: { name: "home" }, match: (v) => v.name === "home" },
  { key: "explore", label: "Explore", icon: Search, view: { name: "explore" }, match: (v) => v.name === "explore" || v.name === "search" || v.name === "tag" },
  { key: "communities", label: "Groups", icon: CommunityIcon, view: { name: "communities" }, match: (v) => v.name === "community" || v.name === "communities", customIcon: "community" },
  { key: "messages", label: "Messages", icon: MessageCircle, view: { name: "messages" }, match: (v) => v.name === "messages" || v.name === "conversation" },
  { key: "profile", label: "Profile", icon: UserIcon, view: { name: "profile", username: "__me__" }, match: (v) => v.name === "profile" },
];

function NotificationBell({ onClick }: { onClick: () => void }) {
  const { data } = useNotifications();
  const count = data?.unreadCount ?? 0;
  return (
    <button onClick={onClick} className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground tap-highlight-none" aria-label="Notifications">
      <Bell className="h-[19px] w-[19px]" />
      {count > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{count > 9 ? "9+" : count}</span>}
    </button>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { view, nav, back, openCompose, canBack, openAuth } = useApp();
  const { data: session, isLoading } = useSession();
  const logoutMut = useLogout();
  const me = session?.user;
  const [fabVisible, setFabVisible] = useState(true);
  const [topBarVisible, setTopBarVisible] = useState(true);
  const [bottomNavVisible, setBottomNavVisible] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const activeItem = NAV.find((n) => n.match(view));

  // Double-click on Home = feed refresh (reload page), 5 clicks = full refresh
  const homeClicks = useRef(0);
  const homeClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleHomeClick = () => {
    homeClicks.current += 1;
    if (homeClickTimer.current) clearTimeout(homeClickTimer.current);
    homeClickTimer.current = setTimeout(() => {
      if (homeClicks.current >= 5) {
        // 5+ clicks — full page reload
        if (typeof window !== "undefined") window.location.reload();
      } else if (homeClicks.current >= 2) {
        // 2-4 clicks — refresh feed by reloading
        if (typeof window !== "undefined") window.location.reload();
      } else {
        // Single click — navigate home
        nav({ name: "home" });
      }
      homeClicks.current = 0;
    }, 300);
  };

  // Views where the bottom nav should be HIDDEN entirely (like Twitter DMs)
  const hideBottomNavViews = ["conversation"];
  const hideBottomNav = hideBottomNavViews.includes(view.name);
  // Also hide the mobile top bar in conversation view — the chat has its own header
  const hideTopBar = view.name === "conversation";

  const goProfile = (username: string) => {
    if (username === "__me__" && me) nav({ name: "profile", username: me.username });
    else if (username !== "__me__") nav({ name: "profile", username });
  };

  // Scroll-based shell show/hide (like Twitter/X)
  // - Scroll down → hide top bar + bottom nav + FAB
  // - Scroll up → show them again
  useEffect(() => {
    // In conversation view, always hide bottom nav — no scroll behavior
    if (hideBottomNav) {
      const t = setTimeout(() => { setBottomNavVisible(false); setFabVisible(false); }, 0);
      return () => clearTimeout(t);
    }

    // Don't do scroll-hide on these views (they need the nav always visible)
    const noHideViews = ["settings", "edit-profile", "legal", "onboarding", "messages", "conversation", "search", "follows"];
    if (noHideViews.includes(view.name)) {
      const t = setTimeout(() => { setBottomNavVisible(true); setTopBarVisible(true); setFabVisible(true); }, 0);
      return () => clearTimeout(t);
    }

    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY < 50) {
        // Near top — show everything
        setTopBarVisible(true);
        setBottomNavVisible(true);
        setFabVisible(true);
      } else if (currentY > lastScrollY && currentY > 120) {
        // Scrolling down — hide shells
        setTopBarVisible(false);
        setBottomNavVisible(false);
        setFabVisible(false);
      } else if (currentY < lastScrollY) {
        // Scrolling up — show shells
        setTopBarVisible(true);
        setBottomNavVisible(true);
        setFabVisible(true);
      }
      lastScrollY = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [view.name, hideBottomNav]);

  // ─── Desktop sidebar ───
  const desktopNav = (
    <aside className="sticky top-0 hidden h-[100dvh] w-[76px] shrink-0 flex-col border-r border-border px-2.5 py-5 lg:flex xl:w-[244px] xl:px-3">
      {me ? (
        <button onClick={() => goProfile("__me__")} className="mb-4 flex w-full items-center gap-3 rounded-full px-2 py-2 text-left transition hover:bg-accent tap-highlight-none" aria-label="Your profile">
          <UserAvatar name={me.name} username={me.username} avatarUrl={me.avatarUrl} size={36} />
          <div className="hidden min-w-0 flex-1 xl:block">
            <div className="flex items-center gap-1 truncate text-[14px] font-semibold">
              <span className="truncate">{me.name}</span>
              {me.verified && <VerifiedBadge className="h-3.5 w-3.5 text-primary" />}
            </div>
            <div className="truncate text-[13px] text-muted-foreground">@{me.username}</div>
          </div>
        </button>
      ) : (
        <div className="mb-4 flex flex-col gap-2 px-1">
          <Button variant="default" className="rounded-full" onClick={() => openAuth("login")}>Sign in</Button>
          <Button variant="secondary" className="rounded-full" onClick={() => openAuth("signup")}>Create account</Button>
        </div>
      )}
      <button onClick={() => nav({ name: "home" })} className="mb-6 flex items-center justify-center px-2 transition hover:opacity-80 lg:px-3" aria-label="OpyCampus home">
        <OpyCampusLogo size={28} />
      </button>
      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const active = !!activeItem && item.key === activeItem.key;
          return (
            <button key={item.key} onClick={() => (item.key === "profile" ? goProfile("__me__") : nav(item.view))} className={cn("group flex w-full items-center gap-4 rounded-full px-3 py-2.5 text-[15px] font-medium transition-colors tap-highlight-none", active ? "text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground")}>
              <span className="relative">
                {item.key === "profile" && me ? (
                  <UserAvatar name="me" avatarUrl={me.avatarUrl} size={26} className={cn("ring-2", active ? "ring-foreground" : "ring-transparent")} />
                ) : item.customIcon === "community" ? (
                  <CommunityIcon className="transition-transform group-active:scale-90" />
                ) : (
                  <item.icon className={cn("h-[26px] w-[26px] transition-transform group-active:scale-90", active && "fill-foreground/10")} />
                )}
              </span>
              <span className={cn("hidden lg:inline", active && "font-semibold")}>{item.label}</span>
            </button>
          );
        })}
      </nav>
      {me ? (
        <Button onClick={() => openCompose()} className="mt-5 h-12 rounded-full bg-primary text-[15px] font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 xl:px-0">
          <Plus className="h-5 w-5 xl:mr-1" /><span className="hidden xl:inline">New post</span>
        </Button>
      ) : null}
      <div className="mt-auto pt-4">
        <div className="mb-1 flex justify-end px-1 lg:hidden xl:flex"><ThemeToggle /></div>
        {isLoading ? (
          <div className="flex items-center gap-3 px-2"><Skeleton className="h-9 w-9 rounded-full" /><div className="hidden xl:block flex-1 space-y-1.5"><Skeleton className="h-3 w-20" /><Skeleton className="h-3 w-16" /></div></div>
        ) : me ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center justify-center rounded-full p-2 transition hover:bg-accent tap-highlight-none" aria-label="Settings menu"><SettingsIcon className="h-5 w-5 text-muted-foreground" /></button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="truncate">Signed in as @{me.username}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => nav({ name: "settings" })}><SettingsIcon className="mr-2 h-4 w-4" /> Settings</DropdownMenuItem>
              <DropdownMenuItem onClick={() => nav({ name: "bookmarks" })}><Bookmark className="mr-2 h-4 w-4" /> Saved posts</DropdownMenuItem>
              <DropdownMenuItem onClick={() => nav({ name: "communities" })}><Users className="mr-2 h-4 w-4" /> Groups</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => { logoutMut.mutate(); nav({ name: "home" }); }}><LogOut className="mr-2 h-4 w-4" /> Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </aside>
  );

  // ─── Mobile top bar — slides up/down on scroll (like Twitter) ───
  // ─── Mobile top bar — hidden in conversation view (chat has its own header) ───
  const mobileTop = !hideTopBar ? (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-md lg:hidden transition-transform duration-300",
        topBarVisible ? "translate-y-0" : "-translate-y-full"
      )}
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      {canBack() && view.name !== "home" ? (
        <button onClick={back} className="-ml-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground transition hover:bg-accent tap-highlight-none" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </button>
      ) : (
        <button onClick={() => nav({ name: "home" })} className="transition hover:opacity-80" aria-label="OpyCampus home">
          <OpyCampusLogo size={26} />
        </button>
      )}
      <div className="flex items-center gap-1">
        <button onClick={() => nav({ name: "search", query: "" })} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground tap-highlight-none" aria-label="Search"><Search className="h-[19px] w-[19px]" /></button>
        <NotificationBell onClick={() => nav({ name: "activity" })} />
        {me ? <button onClick={() => nav({ name: "settings" })} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground tap-highlight-none" aria-label="Settings"><SettingsIcon className="h-[19px] w-[19px]" /></button> : null}
        <ThemeToggle />
      </div>
    </header>
  ) : null;

  // ─── Mobile bottom nav — slides down/up on scroll, hidden in conversation ───
  const mobileBottom = !hideBottomNav ? (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-30 flex h-14 items-center justify-around border-t border-border bg-background/95 backdrop-blur-md lg:hidden transition-transform duration-300",
        bottomNavVisible ? "translate-y-0" : "translate-y-full"
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {NAV.map((item) => {
        const active = !!activeItem && item.key === activeItem.key;
        return (
          <button key={item.key} onClick={() => (item.key === "profile" ? goProfile("__me__") : item.key === "home" ? handleHomeClick() : nav(item.view))} className={cn("relative inline-flex h-11 w-11 items-center justify-center rounded-full transition tap-highlight-none", active ? "text-foreground" : "text-muted-foreground hover:text-foreground")} aria-label={item.label}>
            {item.customIcon === "community" ? <CommunityIcon className="h-[24px] w-[24px]" /> : <item.icon className={cn("h-[24px] w-[24px]", active && "fill-foreground/10")} />}
            {item.key === "profile" && me && <UserAvatar name="me" avatarUrl={me.avatarUrl} size={24} className={cn("absolute", active && "ring-2 ring-foreground")} />}
          </button>
        );
      })}
    </nav>
  ) : null;

  const showFab = me && ["home", "communities", "community"].includes(view.name) && fabVisible;
  const mobileFab = showFab ? (
    <button onClick={() => openCompose()} style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 5rem)" }} className={cn("fixed right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_24px_rgba(0,0,0,0.28),0_2px_8px_rgba(0,0,0,0.18)] transition-all duration-300 active:scale-95 tap-highlight-none lg:hidden", fabVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0")} aria-label="New post"><Plus className="h-6 w-6" /></button>
  ) : null;

  // ─── ROOT LAYOUT ───
  return (
    <div className="flex min-h-[100dvh] w-full bg-background">
      {desktopNav}
      <div className="flex min-h-[100dvh] w-full min-w-0 flex-1 flex-col">
        {mobileTop}
        {/* In conversation view, no bottom padding (bottom nav is hidden) */}
        <main className={cn("w-full min-w-0 flex-1", hideBottomNav ? "pb-0" : "pb-16 lg:pb-0")}>{children}</main>
        {mobileBottom}
        {mobileFab}
      </div>
      <ComposeBox />
      <AuthOverlay />
    </div>
  );
}
