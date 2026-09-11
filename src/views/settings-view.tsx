"use client";

import { useState } from "react";
import { ArrowLeft, Moon, Sun, ChevronRight, UserCircle, Building2, Info, LogOut, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp, useSession, useSwitchUser } from "@/lib/hooks";
import { UserAvatar, VerifiedBadge } from "@/components/user-avatar";
import { LoadingState, EmptyState } from "@/components/view-helpers";
import { useTheme } from "next-themes";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const ACCOUNTS = [
  "aria.chen",
  "leo.mensah",
  "sana.k",
  "prof.nakamura",
  "marco.silva",
  "emma.l",
  "noah.b",
  "dr.owusu",
  "yui.t",
  "ravi.p",
  "ms.fischer",
  "jay.r",
];

export function SettingsView() {
  const { back, nav } = useApp();
  const { data: session, isLoading } = useSession();
  const { theme, setTheme } = useTheme();
  const switchMut = useSwitchUser();
  const [accountOpen, setAccountOpen] = useState(false);

  if (isLoading) return <LoadingState className="py-24" />;
  const me = session?.user;

  if (!me)
    return (
      <EmptyState title="Not signed in" className="py-24" />
    );

  return (
    <div className="mx-auto w-full max-w-[640px]">
      <div className="sticky top-14 z-20 flex items-center gap-3 border-b border-border bg-background/80 px-3 py-2.5 backdrop-blur-md lg:top-0">
        <button onClick={back} className="rounded-full p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-[17px] font-bold">Settings</h1>
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
        <h2 className="px-4 py-3 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Demo account</h2>
        <button
          onClick={() => setAccountOpen(true)}
          className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted/40"
        >
          <UserCircle className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <div className="text-[15px] font-medium">Switch account</div>
            <p className="text-[13px] text-muted-foreground">View Scholar as a different student or teacher</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      </section>

      {/* Quick links */}
      <section className="border-b border-border">
        <h2 className="px-4 py-3 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Discover</h2>
        <button
          onClick={() => nav({ name: "bookmarks" })}
          className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted/40"
        >
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1 text-[15px] font-medium">Saved posts</div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
        <button
          onClick={() => nav({ name: "explore" })}
          className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted/40"
        >
          <Info className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1 text-[15px] font-medium">Explore schools & topics</div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      </section>

      <div className="px-4 py-6">
        <p className="text-[12px] leading-relaxed text-muted-foreground">
          Scholar is a Threads-style social space designed for students, teachers, and institutions. Posts to a school's private feed are only visible to its members. This is a demo — no real sign-in is required.
        </p>
      </div>

      <div className="h-20" />

      {/* Account switcher modal */}
      <Dialog open={accountOpen} onOpenChange={setAccountOpen}>
        <DialogContent showCloseButton={false} className="max-w-sm rounded-2xl border-border p-0">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <DialogTitle className="text-[15px] font-semibold">Switch demo account</DialogTitle>
          </div>
          <DialogDescription className="sr-only">Choose a demo account to view as</DialogDescription>
          <div className="max-h-[60vh] overflow-y-auto scrollbar-thin">
            {ACCOUNTS.map((u) => (
              <button
                key={u}
                disabled={switchMut.isPending}
                onClick={() => {
                  switchMut.mutate(
                    { username: u },
                    {
                      onSuccess: () => {
                        setAccountOpen(false);
                        nav({ name: "home" });
                      },
                    }
                  );
                }}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted/40",
                  u === me.username && "bg-secondary/50"
                )}
              >
                <UserAvatar name={u} username={u} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="truncate text-[14px] font-medium">@{u}</div>
                </div>
                {u === me.username && <Check className="h-4 w-4 text-foreground" />}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
