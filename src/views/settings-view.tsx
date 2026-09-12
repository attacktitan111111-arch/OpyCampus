"use client";

import { ArrowLeft, Moon, Sun, ChevronRight, UserCircle, Building2, Info, LogOut, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp, useSession, useLogout } from "@/lib/hooks";
import { UserAvatar, VerifiedBadge } from "@/components/user-avatar";
import { LoadingState, EmptyState } from "@/components/view-helpers";
import { useTheme } from "next-themes";
import { toast } from "sonner";

export function SettingsView() {
  const { back, nav, openAuth } = useApp();
  const { data: session, isLoading } = useSession();
  const { theme, setTheme } = useTheme();
  const logoutMut = useLogout();

  if (isLoading) return <LoadingState className="py-24" />;
  const me = session?.user;

  if (!me) {
    return (
      <div className="mx-auto w-full max-w-[640px]">
        <div className="sticky top-14 z-20 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-2.5 backdrop-blur-md lg:top-0 lg:px-5">
          <button onClick={back} className="hidden lg:inline-flex lg:h-9 lg:w-9 lg:items-center lg:justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground tap-highlight-none" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-[15px] font-semibold">Settings</h1>
        </div>
        <EmptyState
          title="You're signed out"
          description="Sign in to manage your profile and preferences."
          className="py-20"
          action={
            <div className="flex gap-2">
              <button onClick={() => openAuth("login")} className="rounded-full bg-primary px-5 py-2.5 text-[14px] font-semibold text-primary-foreground">
                Sign in
              </button>
              <button onClick={() => openAuth("signup")} className="rounded-full border border-border px-5 py-2.5 text-[14px] font-semibold">
                Create account
              </button>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[640px]">
      <div className="sticky top-14 z-20 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-2.5 backdrop-blur-md lg:top-0 lg:px-5">
        <button onClick={back} className="hidden lg:inline-flex lg:h-9 lg:w-9 lg:items-center lg:justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground tap-highlight-none" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-[15px] font-semibold">Settings</h1>
      </div>

      {/* Profile card */}
      <button
        onClick={() => nav({ name: "profile", username: me.username })}
        className="flex w-full items-center gap-3 border-b border-border px-4 py-4 text-left transition hover:bg-muted/40"
      >
        <UserAvatar name={me.name} username={me.username} avatarUrl={me.avatarUrl} size={52} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 truncate">
            <span className="truncate text-[16px] font-semibold">{me.name}</span>
            {me.verified && <VerifiedBadge className="h-4 w-4 text-primary" />}
          </div>
          <p className="truncate text-[14px] text-muted-foreground">@{me.username}</p>
          {me.bio && <p className="mt-0.5 line-clamp-1 text-[13px] text-muted-foreground">{me.bio}</p>}
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </button>

      {/* Appearance */}
      <section className="border-b border-border">
        <h2 className="px-4 py-3 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Appearance</h2>
        <div className="px-4 pb-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setTheme("light")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl border py-3 text-[14px] font-medium transition",
                theme === "light" ? "border-foreground bg-secondary" : "border-border hover:bg-accent"
              )}
            >
              <Sun className="h-4 w-4" /> Light
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl border py-3 text-[14px] font-medium transition",
                theme === "dark" ? "border-foreground bg-secondary" : "border-border hover:bg-accent"
              )}
            >
              <Moon className="h-4 w-4" /> Dark
            </button>
          </div>
        </div>
      </section>

      {/* Account */}
      <section className="border-b border-border">
        <h2 className="px-4 py-3 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Account</h2>
        <button
          onClick={() => nav({ name: "profile", username: me.username })}
          className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted/40"
        >
          <UserCircle className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <div className="text-[15px] font-medium">Your profile</div>
            <p className="text-[13px] text-muted-foreground">@{me.username}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
        <button
          onClick={() => nav({ name: "bookmarks" })}
          className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted/40"
        >
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1 text-[15px] font-medium">Saved posts</div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
        <button
          onClick={() => nav({ name: "communities" })}
          className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted/40"
        >
          <Users className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1 text-[15px] font-medium">Groups & communities</div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      </section>

      {/* About */}
      <section className="border-b border-border">
        <h2 className="px-4 py-3 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">About</h2>
        <div className="px-4 pb-4">
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Scholar is a social space built for students, teachers, and institutions. Share thoughts, photos and videos; follow your classmates; join your school's private feed; and start study groups and clubs. Private feeds are visible only to members.
          </p>
        </div>
      </section>

      {/* Sign out */}
      <div className="px-4 py-5">
        <button
          onClick={() => {
            logoutMut.mutate();
            nav({ name: "home" });
            toast.success("Signed out");
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-[15px] font-semibold text-destructive transition hover:bg-destructive/5"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>

      <div className="h-20" />
    </div>
  );
}
