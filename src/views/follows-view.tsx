"use client";

import { ArrowLeft, UserPlus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp, useFollowing, useFollowers } from "@/lib/hooks";
import { UserCard } from "@/components/user-card";
import { LoadingState, EmptyState } from "@/components/view-helpers";
import { Button } from "@/components/ui/button";

export function FollowsView({
  username,
  tab,
}: {
  username: string;
  tab: "following" | "followers";
}) {
  const { back, nav } = useApp();
  const following = useFollowing(username);
  const followers = useFollowers(username);

  const isFollowing = tab === "following";
  const q = isFollowing ? following : followers;
  const users = q.data?.users ?? [];
  const followingIds = new Set(q.data?.following ?? []);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="sticky top-14 z-20 lg:top-0 border-b border-border bg-background/85 backdrop-blur-md lg:top-0">
        <div className="flex items-center gap-3 px-4 py-2.5 lg:px-5">
          <button
            onClick={back}
            className="hidden lg:inline-flex lg:h-9 lg:w-9 lg:items-center lg:justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground tap-highlight-none"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[15px] font-semibold leading-tight">
              {isFollowing ? "Following" : "Followers"}
            </h1>
            <p className="text-[12px] text-muted-foreground">@{username}</p>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex">
          {(["following", "followers"] as const).map((t) => {
            const active = t === tab;
            return (
              <button
                key={t}
                onClick={() => nav({ name: "follows", username, tab: t })}
                className={cn(
                  "relative flex flex-1 items-center justify-center py-2.5 text-[14px] font-semibold capitalize transition-colors tap-highlight-none",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t}
                {active && (
                  <span className="absolute inset-x-0 -bottom-px mx-auto h-[3px] w-10 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      {q.isLoading ? (
        <LoadingState />
      ) : users.length === 0 ? (
        <EmptyState
          icon={isFollowing ? UserPlus : Users}
          title={isFollowing ? "Not following anyone yet" : "No followers yet"}
          description={
            isFollowing
              ? `When @${username} follows people, they'll appear here.`
              : `When people follow @${username}, they'll appear here.`
          }
          className="py-20"
          action={
            <Button variant="secondary" className="rounded-full" onClick={() => nav({ name: "explore" })}>
              Find people to follow
            </Button>
          }
        />
      ) : (
        <div className="divide-y divide-border">
          {users.map((u) => (
            <UserCard key={u.id} user={u} following={followingIds.has(u.id)} />
          ))}
        </div>
      )}

      <div className="h-20" />
    </div>
  );
}
