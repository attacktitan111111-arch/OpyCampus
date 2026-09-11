"use client";

import { useEffect } from "react";
import { Heart, UserPlus, MessageCircle, Repeat2, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp, useNotifications, useMarkNotificationsRead, type NotificationItem } from "@/lib/hooks";
import { UserAvatar, VerifiedBadge } from "@/components/user-avatar";
import { RelativeTime } from "@/components/relative-time";
import { LoadingState, EmptyState } from "@/components/view-helpers";

function iconFor(type: string) {
  switch (type) {
    case "like":
      return { Icon: Heart, color: "text-rose-500 bg-rose-500/10" };
    case "follow":
      return { Icon: UserPlus, color: "text-emerald-500 bg-emerald-500/10" };
    case "reply":
      return { Icon: MessageCircle, color: "text-sky-500 bg-sky-500/10" };
    case "repost":
      return { Icon: Repeat2, color: "text-emerald-500 bg-emerald-500/10" };
    default:
      return { Icon: Bell, color: "text-foreground bg-secondary" };
  }
}

function textFor(type: string) {
  switch (type) {
    case "like":
      return "liked your post";
    case "follow":
      return "started following you";
    case "reply":
      return "replied to your post";
    case "repost":
      return "reposted your post";
    default:
      return "interacted with you";
  }
}

export function ActivityView() {
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationsRead();
  const { nav } = useApp();

  useEffect(() => {
    if (data && data.unreadCount > 0) {
      const t = setTimeout(() => markRead.mutate(), 1200);
      return () => clearTimeout(t);
    }
  }, [data?.unreadCount]);  

  const items = data?.notifications ?? [];

  return (
    <div className="mx-auto w-full max-w-[640px]">
      <div className="sticky top-0 z-20 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-md lg:top-0">
        <h1 className="text-[18px] font-bold">Activity</h1>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No activity yet"
          description="When someone likes, replies, or follows you, it'll show up here."
          className="py-20"
        />
      ) : (
        <div className="divide-y divide-border">
          {items.map((n) => (
            <NotifRow key={n.id} n={n} onClick={() => n.post ? nav({ name: "post", postId: n.post.id }) : n.actor ? nav({ name: "profile", username: n.actor.username }) : undefined} />
          ))}
        </div>
      )}
      <div className="h-20" />
    </div>
  );
}

function NotifRow({ n, onClick }: { n: NotificationItem; onClick?: () => void }) {
  const { nav } = useApp();
  const { Icon, color } = iconFor(n.type);
  const actor = n.actor;
  if (!actor) return null;

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 px-4 py-3.5 transition-colors sm:px-5",
        onClick && "cursor-pointer hover:bg-muted/40"
      )}
    >
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <UserAvatar
            name={actor.name}
            username={actor.username}
            avatarUrl={actor.avatarUrl}
            size={28}
            onClick={() => nav({ name: "profile", username: actor.username })}
          />
          <button onClick={() => nav({ name: "profile", username: actor.username })} className="flex min-w-0 items-center gap-1 hover:underline">
            <span className="truncate text-[14px] font-semibold">{actor.name}</span>
            {actor.verified && <VerifiedBadge className="h-3.5 w-3.5 text-primary" />}
          </button>
          <span className="text-[14px] text-muted-foreground">{textFor(n.type)}</span>
        </div>
        {n.post && (
          <p className="mt-1.5 line-clamp-2 pl-[38px] text-[14px] text-muted-foreground">
            {n.post.content}
          </p>
        )}
        <div className="mt-1 pl-[38px] text-[12px] text-muted-foreground">
          <RelativeTime date={n.createdAt} />
        </div>
      </div>
    </div>
  );
}
