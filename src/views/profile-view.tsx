"use client";

import { useState } from "react";
import { CalendarDays, ArrowLeft, MapPin, MessageCircle, Heart, Grid3x3, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useApp,
  useProfile,
  useUserPosts,
  useToggleFollow,
  useSession,
} from "@/lib/hooks";
import { UserAvatar, VerifiedBadge } from "@/components/user-avatar";
import { RelativeTime } from "@/components/relative-time";
import { PostCard } from "@/components/post-card";
import { LoadingState, EmptyState } from "@/components/view-helpers";
import { Button } from "@/components/ui/button";
import { InstitutionPill } from "@/components/institution-pill";
import { format } from "date-fns";
import { toast } from "sonner";

const TABS = [
  { key: "posts", label: "Posts", icon: Grid3x3 },
  { key: "replies", label: "Replies", icon: MessageCircle },
  { key: "likes", label: "Likes", icon: Heart },
] as const;

function roleLabel(role: string) {
  switch (role) {
    case "teacher":
      return "Teacher";
    case "student":
      return "Student";
    case "institution_admin":
      return "Institution admin";
    default:
      return role;
  }
}

export function ProfileView({ username }: { username: string }) {
  const { nav, openCompose, back, canBack } = useApp();
  const { data, isLoading, isError } = useProfile(username);
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("posts");
  const posts = useUserPosts(username, tab);
  const followMut = useToggleFollow();
  const { data: session } = useSession();

  const user = data?.user;
  const isMe = data?.isMe;
  const isFollowing = data?.isFollowing;

  if (isLoading) return <LoadingState className="py-24" />;
  if (isError || !user)
    return (
      <EmptyState
        title="Profile not found"
        description="This account doesn't exist or has been removed."
        className="py-24"
        action={
          <Button variant="secondary" className="rounded-full" onClick={() => nav({ name: "home" })}>
            Back home
          </Button>
        }
      />
    );

  const handleFollow = () =>
    followMut.mutate(
      { username },
      {
        onSuccess: (d) => toast.success(d.following ? `Following @${username}` : `Unfollowed @${username}`),
      }
    );

  return (
    <div className="mx-auto w-full max-w-[640px] pb-4">
      {/* Header */}
      <div className="sticky top-14 z-20 flex items-center gap-3 border-b border-border bg-background/80 px-3 py-2.5 backdrop-blur-md lg:top-0">
        {canBack() && (
          <button onClick={back} className="rounded-full p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 truncate text-[16px] font-bold">
            <span className="truncate">{user.name}</span>
            {user.verified && <VerifiedBadge className="h-4 w-4 text-primary" />}
          </div>
          <p className="text-[13px] text-muted-foreground">{user._counts.posts} posts</p>
        </div>
      </div>

      {/* Profile body */}
      <div className="px-4 pt-4">
        <div className="flex items-start justify-between gap-4">
          <UserAvatar name={user.name} username={user.username} avatarUrl={user.avatarUrl} size={76} className="ring-4 ring-background" />
          <div className="flex items-center gap-2">
            {isMe ? (
              <Button variant="secondary" className="rounded-full font-semibold" onClick={() => nav({ name: "settings" })}>
                Edit profile
              </Button>
            ) : (
              <>
                <button
                  onClick={() =>
                    openCompose({ prefillText: `@${user.username} `, replyTo: null })
                  }
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-accent"
                  aria-label="Message"
                >
                  <MessageCircle className="h-4 w-4" />
                </button>
                <Button
                  variant={isFollowing ? "secondary" : "default"}
                  className="rounded-full px-6 font-semibold"
                  disabled={followMut.isPending}
                  onClick={handleFollow}
                >
                  {isFollowing ? "Following" : "Follow"}
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center gap-1.5">
            <h1 className="text-[20px] font-bold leading-tight">{user.name}</h1>
            {user.verified && <VerifiedBadge className="h-4 w-4 text-primary" />}
          </div>
          <p className="text-[15px] text-muted-foreground">@{user.username}</p>
        </div>

        {user.bio && <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed">{user.bio}</p>}

        {/* Role + institution */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 font-medium capitalize">
            {roleLabel(user.role)}
          </span>
          {user.department && <span className="inline-flex items-center gap-1">{user.department}</span>}
          {user.institution && (
            <button onClick={() => nav({ name: "institution", handle: user.institution!.handle })} className="inline-flex">
              <InstitutionPill institution={user.institution} />
            </button>
          )}
        </div>

        {/* Meta */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" /> Joined {format(new Date(user.createdAt), "MMMM yyyy")}
          </span>
          {user.institution?.name && (
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" /> {user.institution.name}
            </span>
          )}
        </div>

        {/* Counts */}
        <div className="mt-3 flex items-center gap-5 text-[14px]">
          <button
            onClick={() => nav({ name: "profile", username })}
            className="hover:underline"
          >
            <span className="font-semibold">{user._counts.followsGiven}</span>{" "}
            <span className="text-muted-foreground">Following</span>
          </button>
          <button className="hover:underline">
            <span className="font-semibold">{user._counts.followsRecv}</span>{" "}
            <span className="text-muted-foreground">Followers</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-[6.5rem] z-10 mt-4 border-b border-border bg-background/80 backdrop-blur-md lg:top-0">
        <div className="flex">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "relative flex flex-1 items-center justify-center gap-1.5 py-3 text-[14px] font-semibold transition-colors tap-highlight-none",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 lg:hidden" />
                <span>{t.label}</span>
                {active && <span className="absolute inset-x-0 -bottom-px mx-auto h-[3px] w-10 rounded-full bg-primary" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Posts */}
      {posts.isLoading ? (
        <LoadingState />
      ) : (posts.data?.posts ?? []).length === 0 ? (
        tab === "replies" ? (
          <EmptyState icon={MessageCircle} title="No replies yet" description={`@${user.username} hasn't replied to anything yet.`} />
        ) : tab === "likes" ? (
          <EmptyState icon={Heart} title="No likes yet" description={`Posts ${isMe ? "you've" : `@${user.username} has`} liked will appear here.`} />
        ) : (
          <EmptyState icon={Grid3x3} title="No posts yet" description={isMe ? "Share your first post." : `${user.name} hasn't posted yet.`} />
        )
      ) : (
        <div className="divide-y divide-border">
          {(posts.data?.posts ?? []).map((p, i) => (
            <PostCard key={p.id} post={p} showThreadLine={tab === "posts" && i < (posts.data?.posts.length ?? 0) - 1} />
          ))}
        </div>
      )}

      <div className="h-20" />
    </div>
  );
}
