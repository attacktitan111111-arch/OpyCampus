"use client";

import { Home, Plus, Heart, User as UserIcon, Bookmark, Settings as SettingsIcon, Search, ArrowLeft, Users, LogOut, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp, useSession, useNotifications, useLogout } from "@/lib/hooks";
import { OpyCampusLogo } from "./opycampus-logo";
import { ThemeToggle } from "./theme-toggle";
import { UserAvatar, VerifiedBadge } from "./user-avatar";
import { SparkIcon, CommunityIcon } from "./custom-icons";
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
  icon: typeof Home | typeof SparkIcon | typeof CommunityIcon;
  view: Parameters<ReturnType<typeof useApp.getState>["nav"]>[0];
  match: (v: ReturnType<typeof useApp.getState>["view"]) => boolean;
  customIcon?: "spark" | "community";
}

const NAV: NavItem[] = [
  { key: "home", label: "Home", icon: Home, view: { name: "home" }, match: (v) => v.name === "home" },
  { key: "explore", label: "Explore", icon: Search, view: { name: "explore" }, match: (v) => v.name === "explore" || v.name === "search" || v.name === "tag" },
  { key: "communities", label: "Groups", icon: CommunityIcon, view: { name: "communities" }, match: (v) => v.name === "community" || v.name === "communities", customIcon: "community" },
  { key: "activity", label: "Activity", icon: Heart, view: { name: "activity" }, match: (v) => v.name === "activity" },
  { key: "profile", label: "Profile", icon: UserIcon, view: { name: "profile", username: "__me__" }, match: (v) => v.name === "profile" },
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
        ) : item.customIcon === "spark" ? (
          <SparkIcon filled={active} className="transition-transform group-active:scale-90" />
        ) : item.customIcon === "community" ? (
          <CommunityIcon className="transition-transform group-active:scale-90" />
        ) : (
          <item.icon className={cn("h-[26px] w-[26px] transition-transform group-active:scale-90", active && item.key !== "activity" && "fill-foreground/10")} />
        )}
        {item.key === "activity" && <NotificationDot />}
      </span>
      <span className={cn("hidden lg:inline", active && "font-semibold")}>{item.label}</span>
    </button>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { view, nav, back, openCompose, canBack, openAuth, authOpen } = useApp();
  const { data: session, isLoading } = useSession();
  const logoutMut = useLogout();
  const me = session?.user;

  const activeItem = NAV.find((n) => n.match(view));

  const goProfile = (username: string) => {
    if (username === "__me__" && me) {
      nav({ name: "profile", username: me.username });
    } else if (username !== "__me__") {
      nav({ name: "profile", username });
    }
  };

  const desktopNav = (
    <aside className="sticky top-0 hidden h-[100dvh] w-[76px] shrink-0 flex-col border-r border-border px-2.5 py-5 lg:flex xl:w-[244px] xl:px-3">
      <button onClick={() => nav({ name: "home" })} className="mb-6 flex items-center px-2 transition hover:opacity-80 lg:px-3" aria-label="OpyCampus home">
        <OpyCampusLogo size={28} />
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

      {me ? (
        <Button
          onClick={() => openCompose()}
          className="mt-5 h-12 rounded-full bg-primary text-[15px] font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 xl:px-0"
        >
          <Plus className="h-5 w-5 xl:mr-1" />
          <span className="hidden xl:inline">New post</span>
        </Button>
      ) : (
        <Button
          onClick={() => openAuth("signup")}
          className="mt-5 h-12 rounded-full bg-primary text-[15px] font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 xl:px-0"
        >
          <span className="xl:mx-auto">Get started</span>
        </Button>
      )}

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
              <button className="flex w-full items-center gap-3 rounded-full px-2 py-2 text-left transition hover:bg-accent tap-highlight-none" aria-label="Account menu">
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
              <DropdownMenuItem onClick={() => nav({ name: "messages" })}>
                <Mail className="mr-2 h-4 w-4" /> Messages
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => nav({ name: "bookmarks" })}>
                <Bookmark className="mr-2 h-4 w-4" /> Saved posts
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => nav({ name: "communities" })}>
                <Users className="mr-2 h-4 w-4" /> Groups & communities
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => {
                  logoutMut.mutate();
                  nav({ name: "home" });
                }}
              >
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex flex-col gap-2 px-1">
            <Button variant="default" className="rounded-full" onClick={() => openAuth("login")}>
              Sign in
            </Button>
            <Button variant="secondary" className="rounded-full" onClick={() => openAuth("signup")}>
              Create account
            </Button>
          </div>
        )}
      </div>
    </aside>
  );

  const mobileTop = (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur-md lg:hidden safe-top">
      {canBack() && view.name !== "home" ? (
        <button
          onClick={back}
          className="-ml-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground transition hover:bg-accent tap-highlight-none"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      ) : (
        <button onClick={() => nav({ name: "home" })} className="transition hover:opacity-80" aria-label="OpyCampus home">
          <OpyCampusLogo size={26} />
        </button>
      )}
      <div className="flex items-center gap-1">
        <button
          onClick={() => nav({ name: "search", query: "" })}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground tap-highlight-none"
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
      {NAV.filter((n) => ["home", "explore", "communities", "activity", "profile"].includes(n.key)).map((item) => {
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
            {item.customIcon === "spark" ? (
              <SparkIcon filled={active} className="h-[24px] w-[24px]" />
            ) : item.customIcon === "community" ? (
              <CommunityIcon className="h-[24px] w-[24px]" />
            ) : (
              <item.icon className={cn("h-[24px] w-[24px]", active && item.key !== "activity" && "fill-foreground/10")} />
            )}
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
    </nav>
  );

  // Floating Action Button (FAB) — mobile only, sits above the bottom nav.
  // Twitter/X/Instagram-style: centered-right circular button with a Plus.
  // Uses `calc(env(safe-area-inset-bottom) + 5rem)` so it clears the bottom
  // nav bar (and the iOS home indicator) on every device.
  const mobileFab = me ? (
    <button
      onClick={() => openCompose()}
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 5rem)" }}
      className="fixed right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_24px_rgba(0,0,0,0.28),0_2px_8px_rgba(0,0,0,0.18)] transition-transform active:scale-95 tap-highlight-none press-down lg:hidden"
      aria-label="New post"
    >
      <Plus className="h-6 w-6" />
    </button>
  ) : null;

  return (
    <div className="flex min-h-[100dvh] w-full bg-background overflow-x-hidden">
      {desktopNav}
      <div className="flex min-h-[100dvh] w-full min-w-0 flex-1 flex-col overflow-x-hidden">
        {mobileTop}
        <main className="w-full min-w-0 flex-1 overflow-x-hidden">{children}</main>
        {mobileBottom}
        {mobileFab}
      </div>
      <ComposeBox />
      <AuthOverlay />
    </div>
  );
}
