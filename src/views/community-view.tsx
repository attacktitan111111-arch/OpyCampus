"use client";

import { ArrowLeft, Lock, Globe, Users, PenSquare, ShieldCheck, Plus, X } from "lucide-react";
import { useApp, useCommunity, useCommunityFeed, useJoinCommunity, useSession } from "@/lib/hooks";
import { UserAvatar, VerifiedBadge } from "@/components/user-avatar";
import { PostCard } from "@/components/post-card";
import { LoadingState, SkeletonFeed, EmptyState } from "@/components/view-helpers";
import { Button } from "@/components/ui/button";
import { CommunityIcon } from "@/components/custom-icons";

const categoryLabel: Record<string, string> = {
  study: "Study group",
  club: "Club",
  hobby: "Hobby",
  course: "Course",
  project: "Project",
  other: "Community",
};

export function CommunityView({ handle }: { handle: string }) {
  const { back, nav, openCompose } = useApp();
  const { data, isLoading, isError } = useInstitutionOrCommunity(handle);
  const feed = useCommunityFeed(handle);
  const joinMut = useJoinCommunity();
  const { data: session } = useSession();

  const community = data?.community;

  if (isLoading) return <LoadingState className="py-24" />;
  if (isError || !community)
    return (
      <EmptyState
        title="Group not found"
        description="This community doesn't exist."
        className="py-24"
        action={
          <Button variant="secondary" className="rounded-full" onClick={() => nav({ name: "communities" })}>
            Browse groups
          </Button>
        }
      />
    );

  const isMember = community.isMember;
  const isPrivate = community.isPrivate;
  const gated = isPrivate && !isMember && feed.data?.gated;

  return (
    <div className="w-full">
      {/* Header — minimal context bar (no duplicate of name). Body shows full name + verified badge. */}
      <div className="sticky top-14 z-20 lg:top-0 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-2.5 backdrop-blur-md lg:top-0 lg:px-5">
        <button onClick={back} className="hidden lg:inline-flex lg:h-9 lg:w-9 lg:items-center lg:justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground tap-highlight-none" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 truncate text-[15px] font-semibold leading-tight">
            {isPrivate && <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
            <span className="truncate">@{community.handle}</span>
          </div>
          <p className="text-[12px] text-muted-foreground">{community._counts.posts} posts · {community._counts.members} members</p>
        </div>
      </div>

      {/* Banner */}
      <div className="relative h-28 w-full bg-gradient-to-br from-primary/15 to-primary/5 sm:h-36">
        {community.coverUrl && (
          <img src={community.coverUrl} alt="" className="h-full w-full object-cover" />
        )}
      </div>

      {/* Icon + actions — icon overlaps banner bottom by half */}
      <div className="relative px-4 sm:px-5">
        <div className="-mt-9 flex items-end justify-between">
          <div className="flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-background bg-background shadow-sm" style={{ width: 72, height: 72 }}>
            {community.iconUrl ? (
              <img src={community.iconUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <CommunityIcon className="h-8 w-8" />
            )}
          </div>
          <div className="mb-1">
            {community.isOwner ? (
              <Button variant="secondary" className="rounded-full font-semibold" disabled>
                Owner
              </Button>
            ) : (
              <Button
                variant={isMember ? "secondary" : "default"}
                className="rounded-full font-semibold"
                disabled={joinMut.isPending}
                onClick={() => joinMut.mutate({ handle })}
              >
                {isMember ? "Joined" : isPrivate ? "Request to join" : "Join"}
              </Button>
            )}
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center gap-1.5">
            {isPrivate ? <Lock className="h-4 w-4 text-muted-foreground" /> : <Globe className="h-4 w-4 text-muted-foreground" />}
            <h1 className="text-[20px] font-bold leading-tight">{community.name}</h1>
          </div>
          <p className="text-[14px] text-muted-foreground">@{community.handle} · {categoryLabel[community.category] ?? community.category}</p>
        </div>

        {community.description && <p className="mt-3 text-[15px] leading-[1.55] text-pretty">{community.description}</p>}

        <div className="mt-3 flex items-center gap-4 text-[13px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> {community._counts.members} members
          </span>
        </div>

        {/* Members preview */}
        <div className="mt-4 border-t border-border pt-3">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Members</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {community.members.slice(0, 12).map((m) => (
              <button
                key={m.id}
                onClick={() => nav({ name: "profile", username: m.user.username })}
                title={`${m.user.name} · ${m.role}`}
                className="transition hover:opacity-80"
              >
                <UserAvatar name={m.user.name} username={m.user.username} avatarUrl={m.user.avatarUrl} size={40} />
              </button>
            ))}
            {community.members.length > 12 && (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-[12px] font-medium text-muted-foreground">
                +{community.members.length - 12}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="mt-4 border-t border-border">
        <div className="flex items-center justify-between px-4 py-3 sm:px-5">
          <h2 className="flex items-center gap-1.5 text-[15px] font-semibold">
            {isPrivate ? <Lock className="h-4 w-4 text-muted-foreground" /> : <ShieldCheck className="h-4 w-4 text-muted-foreground" />}
            {isPrivate ? "Private feed" : "Feed"}
          </h2>
          {isMember && (
            <Button size="sm" variant="secondary" className="rounded-full" onClick={() => openCompose({ scope: { kind: "community", id: community.id } })}>
              <PenSquare className="mr-1.5 h-3.5 w-3.5" /> Post here
            </Button>
          )}
        </div>

        {gated ? (
          <EmptyState
            icon={Lock}
            title="This is a private group"
            description={`Only members of ${community.name} can view and post here. Join to see what's being shared.`}
            action={
              <Button className="rounded-full" disabled={joinMut.isPending} onClick={() => joinMut.mutate({ handle })}>
                {isPrivate ? "Request to join" : "Join"}
              </Button>
            }
            className="py-16"
          />
        ) : feed.isLoading ? (
          <SkeletonFeed count={4} />
        ) : (feed.data?.posts ?? []).length === 0 ? (
          isMember ? (
            <EmptyState
              icon={PenSquare}
              title="No posts yet"
              description="Start the conversation in this group."
              action={
                <Button className="rounded-full" onClick={() => openCompose({ scope: { kind: "community", id: community.id } })}>
                  <PenSquare className="mr-2 h-4 w-4" /> Write a post
                </Button>
              }
            />
          ) : (
            <EmptyState icon={PenSquare} title="No posts yet" description="Check back later." />
          )
        ) : (
          <div className="divide-y divide-border">
            {(feed.data?.posts ?? []).map((p, i) => (
              <PostCard key={p.id} post={p} showThreadLine={i < (feed.data?.posts.length ?? 0) - 1} />
            ))}
          </div>
        )}
      </div>

      <div className="h-20" />
    </div>
  );
}

// Helper hook to keep community shape consistent (community detail endpoint)
function useInstitutionOrCommunity(handle: string) {
  return useCommunity(handle);
}
