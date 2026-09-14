"use client";

import { useState } from "react";
import { CalendarDays, ArrowLeft, MapPin, MessageCircle, Heart, Grid3x3, Building2, Globe, Repeat2, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useApp,
  useProfile,
  useUserPosts,
  useUserReposts,
  useToggleFollow,
  useStartConversation,
  useSession,
} from "@/lib/hooks";
import { UserAvatar, VerifiedBadge } from "@/components/user-avatar";
import { PostCard } from "@/components/post-card";
import { LoadingState, EmptyState } from "@/components/view-helpers";
import { Button } from "@/components/ui/button";
import { InstitutionPill } from "@/components/institution-pill";
import { format } from "date-fns";
import { toast } from "sonner";

type TabKey = "posts" | "reposts" | "likes";

const TABS: { key: TabKey; label: string; icon: typeof Grid3x3 }[] = [
  { key: "posts", label: "Posts", icon: Grid3x3 },
  { key: "reposts", label: "Reposts", icon: Repeat2 },
  { key: "likes", label: "Likes", icon: Heart },
];

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
  const { nav, back, canBack } = useApp();
  const { data, isLoading, isError } = useProfile(username);
  const [tab, setTab] = useState<TabKey>("posts");
  const posts = useUserPosts(username, tab === "likes" ? "likes" : "posts");
  const reposts = useUserReposts(username);
  const followMut = useToggleFollow();
  const startConvMut = useStartConversation();
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

  const handleMessage = () => {
    startConvMut.mutate(
      { username },
      {
        onSuccess: (d) => nav({ name: "conversation", id: d.conversationId }),
        onError: (e) => toast.error(e.message || "Couldn't start conversation"),
      }
    );
  };

  // Pick the active list to render
  const activeList = tab === "reposts" ? (reposts.data?.posts ?? []) : (posts.data?.posts ?? []);
  const activeLoading = tab === "reposts" ? reposts.isLoading : posts.isLoading;

  return (
    <div className="mx-auto w-full max-w-[640px] pb-4">
      {/* Header — minimal context bar (no duplicate of name). The body shows the full name + verified badge. */}
      <div className="sticky top-14 z-20 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-2.5 backdrop-blur-md lg:top-0 lg:px-5">
        {canBack() && (
          <button onClick={back} className="hidden lg:inline-flex lg:h-9 lg:w-9 lg:items-center lg:justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground tap-highlight-none" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold leading-tight text-foreground">@{user.username}</p>
          <p className="text-[12px] text-muted-foreground">{user._counts.posts} posts</p>
        </div>
      </div>

      {/* Cover photo (if any) */}
      {user.coverUrl ? (
        <div className="relative h-28 w-full bg-gradient-to-br from-primary/15 to-primary/5 sm:h-36">
          <img src={user.coverUrl} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}

      {/* Profile body — full name + verified badge + bio live here (single source of truth) */}
      <div className="px-4 pt-5 sm:px-5">
        <div className="flex items-start justify-between gap-4">
          <UserAvatar
            name={user.name}
            username={user.username}
            avatarUrl={user.avatarUrl}
            size={76}
            className={cn("ring-4 ring-background", user.coverUrl && "-mt-10")}
          />
          <div className="flex items-center gap-2">
            {isMe ? (
              <Button
                variant="secondary"
                className="rounded-full font-semibold"
                onClick={() => nav({ name: "edit-profile" })}
              >
                Edit profile
              </Button>
            ) : (
              <>
                <button
                  onClick={handleMessage}
                  disabled={startConvMut.isPending}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-accent disabled:opacity-50 tap-highlight-none"
                  aria-label="Message"
                  title="Message"
                >
                  <Mail className="h-4 w-4" />
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

        {user.bio && <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-pretty">{user.bio}</p>}

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

        {/* Meta — location, website, joined */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
          {user.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {user.location}
            </span>
          )}
          {user.website && (
            <a
              href={user.website.startsWith("http") ? user.website : `https://${user.website}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <Globe className="h-3.5 w-3.5" /> {user.website.replace(/^https?:\/\//, "")}
            </a>
          )}
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" /> Joined {format(new Date(user.createdAt), "MMMM yyyy")}
          </span>
          {user.institution?.name && (
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" /> {user.institution.name}
            </span>
          )}
        </div>

        {/* Counts — clickable */}
        <div className="mt-3 flex items-center gap-5 text-[14px]">
          <button
            onClick={() => nav({ name: "follows", username, tab: "following" })}
            className="hover:underline tap-highlight-none"
          >
            <span className="font-semibold">{user._counts.followsGiven}</span>{" "}
            <span className="text-muted-foreground">Following</span>
          </button>
          <button
            onClick={() => nav({ name: "follows", username, tab: "followers" })}
            className="hover:underline tap-highlight-none"
          >
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

      {/* Posts / Reposts / Likes */}
      {activeLoading ? (
        <LoadingState />
      ) : activeList.length === 0 ? (
        tab === "reposts" ? (
          <EmptyState icon={Repeat2} title="No reposts yet" description={`Posts ${isMe ? "you've" : `@${user.username} has`} reposted will appear here.`} />
        ) : tab === "likes" ? (
          <EmptyState icon={Heart} title="No likes yet" description={`Posts ${isMe ? "you've" : `@${user.username} has`} liked will appear here.`} />
        ) : (
          <EmptyState icon={Grid3x3} title="No posts yet" description={isMe ? "Share your first post." : `${user.name} hasn't posted yet.`} />
        )
      ) : (
        <div className="divide-y divide-border">
          {activeList.map((p, i) => (
            <PostCard
              key={p.id}
              post={p}
              showThreadLine={tab === "posts" && i < activeList.length - 1}
            />
          ))}
        </div>
      )}

      <div className="h-20" />
    </div>
  );
}
