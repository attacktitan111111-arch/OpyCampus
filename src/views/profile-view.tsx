"use client";

import { useState } from "react";
import { CalendarDays, ArrowLeft, MapPin, Heart, Grid3x3, Building2, Globe, Repeat2, Mail, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
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
import { EmptyState, SkeletonFeed, SkeletonProfile } from "@/components/view-helpers";
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

function roleBadgeClass(role: string) {
  switch (role) {
    case "teacher":
      // Teachers — amber (warm, authoritative)
      return "bg-amber-500/15 text-amber-600 dark:text-amber-300";
    case "institution_admin":
      // Admins — sky (trusted, official)
      return "bg-sky-500/15 text-sky-600 dark:text-sky-300";
    default:
      // Students — violet (creative, default role)
      return "bg-violet-500/15 text-violet-600 dark:text-violet-300";
  }
}

/**
 * Premium gradient cover — used when the user has no cover photo.
 * Picks a deterministic gradient based on the username so each user has a
 * unique-feeling cover. The gradient is animated (slow pan) for a hint of life.
 */
function GradientCover({ username }: { username?: string }) {
  const palettes = [
    "from-indigo-500/30 via-purple-500/20 to-fuchsia-500/30",
    "from-sky-500/30 via-cyan-500/20 to-emerald-500/25",
    "from-amber-400/30 via-orange-500/20 to-rose-500/25",
    "from-emerald-500/30 via-teal-500/20 to-cyan-500/25",
    "from-rose-500/30 via-pink-500/20 to-purple-500/25",
    "from-blue-500/30 via-indigo-500/20 to-violet-500/25",
  ];
  const seed = (username ?? "x").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const grad = palettes[seed % palettes.length];
  return (
    <div
      className={cn(
        "relative h-28 w-full bg-gradient-to-br sm:h-36 animate-gradient-pan",
        grad
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(0,0,0,0.08),transparent_60%)]" />
    </div>
  );
}

/**
 * Compute a profile completion percentage (0–100) based on which fields are set.
 * Used to show a "Your profile is X% complete" nudge for the signed-in user.
 */
function completionPct(user: {
  avatarUrl?: string | null;
  coverUrl?: string | null;
  bio?: string | null;
  department?: string | null;
  location?: string | null;
  website?: string | null;
  institution?: { id?: string } | null;
}): number {
  const fields = [
    !!user.avatarUrl,
    !!user.coverUrl,
    !!user.bio?.trim(),
    !!user.department?.trim(),
    !!user.location?.trim(),
    !!user.website?.trim(),
    !!user.institution?.id,
  ];
  const done = fields.filter(Boolean).length;
  return Math.round((done / fields.length) * 100);
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

  if (isLoading) return <SkeletonProfile />;
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

  const completion = isMe ? completionPct(user) : 0;
  const missingCover = !user.coverUrl;

  return (
    <div className="mx-auto w-full max-w-[640px] pb-4 animate-fade-in overflow-x-hidden">
      {/* Header — minimal context bar */}
      <div className="sticky top-14 z-20 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-2.5 backdrop-blur-md lg:top-0 lg:px-5">
        {canBack() && (
          <button onClick={back} className="hidden lg:inline-flex lg:h-9 lg:w-9 lg:items-center lg:justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground tap-highlight-none press-down" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold leading-tight text-foreground">@{user.username}</p>
          <p className="text-[12px] text-muted-foreground">{user._counts.posts} posts</p>
        </div>
      </div>

      {/* Cover photo (uploaded image, gradient choice, or animated fallback) */}
      <div className="relative overflow-hidden">
        {user.coverUrl && user.coverUrl.startsWith("grad://") ? (
          <div className={cn("h-28 w-full bg-gradient-to-br sm:h-36 animate-gradient-pan", user.coverUrl.slice("grad://".length))} />
        ) : user.coverUrl ? (
          <div className="h-28 w-full sm:h-36">
            <img src={user.coverUrl} alt="" className="h-full w-full object-cover" />
          </div>
        ) : (
          <GradientCover username={user.username} />
        )}
      </div>

      {/* Profile body — full name + verified badge + bio live here (single source of truth) */}
      <div className="px-4 pt-5 sm:px-5">
        <div className="flex items-start justify-between gap-4">
          <UserAvatar
            name={user.name}
            username={user.username}
            avatarUrl={user.avatarUrl}
            size={76}
            className={cn("ring-4 ring-background shadow-sm", user.coverUrl && "-mt-10")}
          />
          <div className="flex items-center gap-2">
            {isMe ? (
              <Button
                variant="secondary"
                className="rounded-full font-semibold press-down"
                onClick={() => nav({ name: "edit-profile" })}
              >
                Edit profile
              </Button>
            ) : (
              <>
                <button
                  onClick={handleMessage}
                  disabled={startConvMut.isPending}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-accent disabled:opacity-50 tap-highlight-none press-down"
                  aria-label="Message"
                  title="Message"
                >
                  <Mail className="h-4 w-4" />
                </button>
                <Button
                  variant={isFollowing ? "secondary" : "default"}
                  className="rounded-full px-6 font-semibold press-down"
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

        {/* Role + institution + department */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold capitalize", roleBadgeClass(user.role))}>
            {roleLabel(user.role)}
          </span>
          {user.department && (
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1">
              {user.department}
            </span>
          )}
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

        {/* Stats card — Following / Followers / Posts in a single rounded card */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <StatCell
            label="Posts"
            value={user._counts.posts}
            onClick={undefined}
          />
          <StatCell
            label="Following"
            value={user._counts.followsGiven}
            onClick={() => nav({ name: "follows", username, tab: "following" })}
          />
          <StatCell
            label="Followers"
            value={user._counts.followsRecv}
            onClick={() => nav({ name: "follows", username, tab: "followers" })}
          />
        </div>

        {/* Profile completion nudge — only for the signed-in user */}
        {isMe && completion < 100 && (
          <div className="mt-4 rounded-2xl border border-border bg-secondary/30 p-3.5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-[13px] font-medium text-foreground">
                Your profile is {completion}% complete
              </p>
              <span className="ml-auto text-[12px] text-muted-foreground">
                {missingCover ? "Add a cover photo" : "Add a bio"}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${completion}%` }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="sticky top-[6.5rem] z-10 mt-4 border-b border-border bg-background/80 backdrop-blur-md lg:top-0">
        <div className="relative flex">
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
                {active && (
                  <motion.span
                    layoutId="profile-tab-underline"
                    className="absolute inset-x-0 -bottom-px mx-auto h-[3px] w-10 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.7 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Posts / Reposts / Likes */}
      {activeLoading ? (
        <SkeletonFeed count={3} />
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

function StatCell({
  label,
  value,
  onClick,
}: {
  label: string;
  value: number;
  onClick?: () => void;
}) {
  const content = (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-border bg-secondary/20 px-2 py-2.5 transition",
        onClick && "cursor-pointer hover:bg-secondary/40 press-down"
      )}
    >
      <span className="text-[16px] font-bold leading-none tabular-nums text-foreground">{value}</span>
      <span className="mt-1 text-[12px] text-muted-foreground">{label}</span>
    </div>
  );
  return onClick ? (
    <button onClick={onClick} className="tap-highlight-none">
      {content}
    </button>
  ) : (
    content
  );
}
