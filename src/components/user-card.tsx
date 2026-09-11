"use client";

import { useApp, useToggleFollow, useSession } from "@/lib/hooks";
import type { User } from "@/lib/hooks";
import { UserAvatar, VerifiedBadge } from "./user-avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function roleLabel(role: string) {
  switch (role) {
    case "teacher":
      return "Teacher";
    case "institution_admin":
      return "Admin";
    case "student":
      return "Student";
    default:
      return null;
  }
}

export function UserCard({ user, following }: { user: User; following?: boolean }) {
  const { nav } = useApp();
  const { data: session } = useSession();
  const followMut = useToggleFollow();

  const isMe = session?.user?.id === user.id;
  const isFollowing = following ?? session?.user?.followingIds.includes(user.id) ?? false;

  return (
    <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40 sm:px-5">
      <UserAvatar
        name={user.name}
        username={user.username}
        avatarUrl={user.avatarUrl}
        size={44}
        onClick={() => nav({ name: "profile", username: user.username })}
      />
      <button
        onClick={() => nav({ name: "profile", username: user.username })}
        className="min-w-0 flex-1 text-left"
      >
        <div className="flex items-center gap-1 truncate">
          <span className="truncate font-semibold text-[15px]">{user.name}</span>
          {user.verified && <VerifiedBadge className="h-4 w-4 text-primary shrink-0" />}
        </div>
        <div className="truncate text-[13px] text-muted-foreground">@{user.username}</div>
        {user.bio && (
          <div className="mt-0.5 line-clamp-1 text-[13px] text-muted-foreground">{user.bio}</div>
        )}
      </button>
      {!isMe && (
        <Button
          size="sm"
          variant={isFollowing ? "secondary" : "default"}
          className="rounded-full px-4 h-9 text-[13px] font-semibold shrink-0"
          disabled={followMut.isPending}
          onClick={(e) => {
            e.stopPropagation();
            followMut.mutate(
              { username: user.username },
              {
                onSuccess: (data) => {
                  if (data.following) toast.success(`Following @${user.username}`);
                  else toast.success(`Unfollowed @${user.username}`);
                },
              }
            );
          }}
        >
          {isFollowing ? "Following" : "Follow"}
        </Button>
      )}
    </div>
  );
}
