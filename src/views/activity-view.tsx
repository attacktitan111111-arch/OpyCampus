"use client";

import { useEffect } from "react";
import { Heart, UserPlus, MessageCircle, Repeat2, Bell, Mail, PenSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useApp,
  useNotifications,
  useMarkNotificationsRead,
  useToggleFollow,
  useSession,
  type NotificationItem,
} from "@/lib/hooks";
import { UserAvatar, VerifiedBadge } from "@/components/user-avatar";
import { RelativeTime } from "@/components/relative-time";
import { EmptyState, SkeletonNotifications } from "@/components/view-helpers";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
      {/* Header — title + quick "Message" action on the right */}
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-2.5 backdrop-blur-md lg:top-0 lg:px-5">
        <h1 className="text-[15px] font-semibold">Activity</h1>
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto h-8 gap-1.5 rounded-full px-3 text-[13px] font-medium text-muted-foreground hover:text-foreground"
          onClick={() => nav({ name: "messages" })}
        >
          <Mail className="h-4 w-4" />
          <span className="hidden sm:inline">Messages</span>
        </Button>
      </div>

      {isLoading ? (
        <SkeletonNotifications count={5} />
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
            <NotifRow
              key={n.id}
              n={n}
              onClick={() =>
                n.post
                  ? nav({ name: "post", postId: n.post.id })
                  : n.actor
                  ? nav({ name: "profile", username: n.actor.username })
                  : undefined
              }
            />
          ))}
        </div>
      )}
      <div className="h-20" />
    </div>
  );
}

function NotifRow({ n, onClick }: { n: NotificationItem; onClick?: () => void }) {
  const { nav, openCompose } = useApp();
  const { data: session } = useSession();
  const followMut = useToggleFollow();
  const { Icon, color } = iconFor(n.type);
  const actor = n.actor;
  if (!actor) return null;

  const isMe = session?.user?.id === actor.id;
  const alreadyFollowing = !!session?.user?.followingIds?.includes(actor.id);

  // Quick-action button: only show on follow / reply types (per task spec).
  const renderAction = () => {
    if (isMe) return null;

    if (n.type === "follow") {
      // Show "Follow back" if we don't already follow them, else "Following".
      return (
        <Button
          size="sm"
          variant={alreadyFollowing ? "secondary" : "default"}
          className="h-8 shrink-0 rounded-full px-3.5 text-[12px] font-semibold"
          disabled={followMut.isPending || alreadyFollowing}
          onClick={(e) => {
            e.stopPropagation();
            followMut.mutate(
              { username: actor.username },
              {
                onSuccess: (d) =>
                  toast.success(d.following ? `Following @${actor.username}` : `Unfollowed @${actor.username}`),
              }
            );
          }}
        >
          {alreadyFollowing ? "Following" : "Follow back"}
        </Button>
      );
    }

    if (n.type === "reply" && n.post) {
      // Show "Reply" — opens the composer scoped to reply to this post.
      return (
        <Button
          size="sm"
          variant="secondary"
          className="h-8 shrink-0 gap-1.5 rounded-full px-3.5 text-[12px] font-semibold"
          onClick={(e) => {
            e.stopPropagation();
            openCompose({
              replyTo: {
                id: n.post!.id,
                authorName: actor.name,
                authorUsername: actor.username,
              },
            });
          }}
        >
          <PenSquare className="h-3.5 w-3.5" />
          Reply
        </Button>
      );
    }

    return null;
  };

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
          <button
            onClick={() => nav({ name: "profile", username: actor.username })}
            className="flex min-w-0 items-center gap-1 hover:underline"
          >
            <span className="truncate text-[14px] font-semibold">{actor.name}</span>
            {actor.verified && <VerifiedBadge className="h-3.5 w-3.5 text-primary" />}
          </button>
          <span className="truncate text-[14px] text-muted-foreground">{textFor(n.type)}</span>
        </div>
        {n.post && (
          <p className="mt-1.5 line-clamp-2 pl-[38px] text-[14px] text-muted-foreground">{n.post.content}</p>
        )}
        <div className="mt-1 flex items-center justify-between gap-2 pl-[38px]">
          <span className="text-[12px] text-muted-foreground">
            <RelativeTime date={n.createdAt} />
          </span>
          {renderAction()}
        </div>
      </div>
    </div>
  );
}
