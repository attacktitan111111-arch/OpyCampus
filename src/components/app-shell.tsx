"use client";

import { useEffect } from "react";
import { Home, Compass, Plus, Heart, User as UserIcon, Bookmark, Settings as SettingsIcon, Search, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp, useSession, useNotifications, useSwitchUser } from "@/lib/hooks";
import { ScholarLogo } from "./scholar-logo";
import { ThemeToggle } from "./theme-toggle";
import { UserAvatar, VerifiedBadge } from "./user-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ComposeBox } from "./compose-box";
import { Skeleton } from "@/components/ui/skeleton";

interface NavItem {
  key: string;
  label: string;
  icon: typeof Home;
  view: Parameters<ReturnType<typeof useApp.getState>["nav"]>[0];
  match: (v: ReturnType<typeof useApp.getState>["view"]) => boolean;
}

const NAV: NavItem[] = [
  { key: "home", label: "Home", icon: Home, view: { name: "home" }, match: (v) => v.name === "home" },
  { key: "explore", label: "Explore", icon: Compass, view: { name: "explore" }, match: (v) => v.name === "explore" || v.name === "search" || v.name === "tag" },
  { key: "activity", label: "Activity", icon: Heart, view: { name: "activity" }, match: (v) => v.name === "activity" },
  { key: "bookmarks", label: "Saved", icon: Bookmark, view: { name: "bookmarks" }, match: (v) => v.name === "bookmarks" },
  { key: "profile", label: "Profile", icon: UserIcon, view: { name: "profile", username: "__me__" }, match: (v) => v.name === "profile" },
];

const ACCOUNTS = [
  "aria.chen",
  "leo.mensah",
  "sana.k",
  "prof.nakamura",
  "marco.silva",
  "emma.l",
  "noah.b",
  "dr.owusu",
];

function NotificationDot() {
  const { data } = useNotifications();
  const count = data?.unreadCount ?? 0;
  if (count === 0) return null;
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}

function NavButton({
  item,
  active,
  onClick,
  avatar,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
  avatar?: string | null;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-4 rounded-full px-3 py-2.5 text-[15px] font-medium transition-colors tap-highlight-none",
        active ? "text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <span className="relative">
        {item.key === "profile" && avatar ? (
          <UserAvatar name="me" avatarUrl={avatar} size={26} className={cn("ring-2", active ? "ring-foreground" : "ring-transparent")} />
        ) : (
          <Icon className={cn("h-[26px] w-[26px] transition-transform group-active:scale-90", active && "fill-foreground/10")} />
        )}
        {item.key === "activity" && <NotificationDot />}
      </span>
      <span className={cn("hidden lg:inline", active && "font-semibold")}>{item.label}</span>
    </button>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { view, nav, back, openCompose, canBack } = useApp();
  const { data: session, isLoading } = useSession();
  const { data: notifData } = useNotifications();
  const switchMut = useSwitchUser();
  const me = session?.user;

  // Auto-mark notifications read when leaving the activity tab
  useEffect(() => {
    // intentionally minimal: notifications are marked read via the Activity view action
  }, [view]);

  const activeItem = NAV.find((n) => n.match(view));

  const goProfile = (username: string) => {
    if (username === "__me__" && me) {
      nav({ name: "profile", username: me.username });
    } else if (username !== "__me__") {
      nav({ name: "profile", username });
    }
  };

  const desktopNav = (
    <aside className="sticky top-0 hidden h-screen w-[76px] shrink-0 flex-col border-r border-border px-2.5 py-5 lg:flex xl:w-[244px] xl:px-3">
      <button onClick={() => nav({ name: "home" })} className="mb-6 flex items-center px-2 lg:px-3">
        <ScholarLogo size={28} />
      </button>

      <nav className="flex flex-col gap-1">
        {NAV.map((item) => (
          <NavButton
            key={item.key}
            item={item}
            active={!!activeItem && item.key === activeItem.key}
            onClick={() => (item.key === "profile" ? goProfile("__me__") : nav(item.view))}
            avatar={item.key === "profile" ? me?.avatarUrl : undefined}
          />
        ))}
      </nav>

      <Button
        onClick={() => openCompose()}
        className="mt-5 h-12 rounded-full bg-primary text-[15px] font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 xl:px-0"
      >
        <Plus className="h-5 w-5 xl:mr-1" />
        <span className="hidden xl:inline">New post</span>
      </Button>

      <div className="mt-auto pt-4">
        <div className="mb-1 flex justify-end px-1 lg:hidden xl:flex">
          <ThemeToggle />
        </div>
        {isLoading ? (
          <div className="flex items-center gap-3 px-2">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="hidden xl:block flex-1 space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ) : me ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-full px-2 py-2 text-left transition hover:bg-accent tap-highlight-none">
                <UserAvatar name={me.name} username={me.username} avatarUrl={me.avatarUrl} size={36} />
                <div className="hidden min-w-0 flex-1 xl:block">
                  <div className="flex items-center gap-1 truncate text-[14px] font-semibold">
                    <span className="truncate">{me.name}</span>
                    {me.verified && <VerifiedBadge className="h-3.5 w-3.5 text-primary" />}
                  </div>
                  <div className="truncate text-[13px] text-muted-foreground">@{me.username}</div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="truncate">Signed in as @{me.username}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => nav({ name: "settings" })}>
                <SettingsIcon className="mr-2 h-4 w-4" /> Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => nav({ name: "bookmarks" })}>
                <Bookmark className="mr-2 h-4 w-4" /> Saved posts
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-muted-foreground text-xs">Switch demo account</DropdownMenuLabel>
              {ACCOUNTS.filter((u) => u !== me.username).map((u) => (
                <DropdownMenuItem
                  key={u}
                  disabled={switchMut.isPending}
                  onClick={() => switchMut.mutate({ username: u })}
                >
                  <UserIcon className="mr-2 h-4 w-4" /> @{u}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </aside>
  );

  const mobileTop = (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md lg:hidden safe-top">
      {canBack() && view.name !== "home" ? (
        <button
          onClick={back}
          className="-ml-1 inline-flex items-center gap-1 rounded-full p-1.5 text-foreground transition hover:bg-accent"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      ) : (
        <button onClick={() => nav({ name: "home" })}>
          <ScholarLogo size={26} />
        </button>
      )}
      <div className="flex items-center gap-1">
        <button
          onClick={() => nav({ name: "search", query: "" })}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground"
          aria-label="Search"
        >
          <Search className="h-[19px] w-[19px]" />
        </button>
        <ThemeToggle />
      </div>
    </header>
  );

  const mobileBottom = (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-14 items-center justify-around border-t border-border bg-background/90 backdrop-blur-md lg:hidden safe-bottom">
      {NAV.filter((n) => ["home", "explore", "activity", "profile"].includes(n.key)).map((item) => {
        const Icon = item.icon;
        const active = !!activeItem && item.key === activeItem.key;
        return (
          <button
            key={item.key}
            onClick={() => (item.key === "profile" ? goProfile("__me__") : nav(item.view))}
            className={cn(
              "relative inline-flex h-11 w-11 items-center justify-center rounded-full transition tap-highlight-none",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
            aria-label={item.label}
          >
            <Icon className={cn("h-[24px] w-[24px]", active && item.key !== "activity" && "fill-foreground/10")} />
            {item.key === "activity" && <NotificationDot />}
            {item.key === "profile" && me && (
              <UserAvatar
                name="me"
                avatarUrl={me.avatarUrl}
                size={24}
                className={cn("absolute", active && "ring-2 ring-foreground")}
              />
            )}
          </button>
        );
      })}
      <button
        onClick={() => openCompose()}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition active:scale-95"
        aria-label="Compose"
      >
        <Plus className="h-6 w-6" />
      </button>
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {desktopNav}
      <div className="flex min-h-screen flex-1 flex-col">
        {mobileTop}
        <main className="flex-1 pb-16 lg:pb-0">{children}</main>
        {mobileBottom}
      </div>
      <ComposeBox />
    </div>
  );
}
