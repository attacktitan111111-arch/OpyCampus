"use client";

import { ArrowLeft, Lock, Globe, Users, ExternalLink, MapPin, PenSquare, ShieldCheck, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp, useInstitution, useInstitutionFeed, useJoinInstitution, useSession } from "@/lib/hooks";
import { UserAvatar, VerifiedBadge } from "@/components/user-avatar";
import { PostCard } from "@/components/post-card";
import { LoadingState, EmptyState } from "@/components/view-helpers";
import { Button } from "@/components/ui/button";

const typeLabel: Record<string, string> = {
  school: "School",
  college: "College",
  university: "University",
  institute: "Institute",
};

export function InstitutionView({ handle }: { handle: string }) {
  const { back, nav, openCompose } = useApp();
  const { data, isLoading, isError } = useInstitution(handle);
  const feed = useInstitutionFeed(handle);
  const joinMut = useJoinInstitution();
  const { data: session } = useSession();

  const inst = data?.institution;

  if (isLoading) return <LoadingState className="py-24" />;
  if (isError || !inst)
    return (
      <EmptyState
        title="Institution not found"
        description="This school or institution doesn't exist."
        className="py-24"
        action={
          <Button variant="secondary" className="rounded-full" onClick={() => nav({ name: "explore" })}>
            Explore schools
          </Button>
        }
      />
    );

  const isMember = inst.isMember;
  const isPrivate = inst.isPrivate;
  const gated = isPrivate && !isMember && feed.data?.gated;

  return (
    <div className="mx-auto w-full max-w-[640px]">
      {/* Header — minimal context bar (no duplicate of name). Body shows full name + verified badge. */}
      <div className="sticky top-14 z-20 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-2.5 backdrop-blur-md lg:top-0 lg:px-5">
        <button onClick={back} className="hidden lg:inline-flex lg:h-9 lg:w-9 lg:items-center lg:justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground tap-highlight-none" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 truncate text-[15px] font-semibold leading-tight">
            {isPrivate && <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
            <span className="truncate">@{inst.handle}</span>
            {inst.verified && <VerifiedBadge className="h-4 w-4 text-primary" />}
          </div>
          <p className="text-[12px] text-muted-foreground">{inst._counts.posts} posts · {inst._counts.members} members</p>
        </div>
      </div>

      {/* Banner */}
      <div className="relative h-32 w-full bg-gradient-to-br from-primary/15 to-primary/5 sm:h-40">
        {inst.coverUrl && (
          <img src={inst.coverUrl} alt="" className="h-full w-full object-cover" />
        )}
      </div>

      {/* Logo + actions */}
      <div className="px-4 sm:px-5">
        <div className="-mt-10 flex items-end justify-between">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-4 border-background bg-background">
            {inst.logoUrl ? (
              <img src={inst.logoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <GraduationCap className="h-9 w-9 text-foreground" />
            )}
          </div>
          <div className="mb-1 flex items-center gap-2">
            <Button
              variant={isMember ? "secondary" : "default"}
              className="rounded-full font-semibold"
              disabled={joinMut.isPending}
              onClick={() => joinMut.mutate({ handle })}
            >
              {isMember ? (inst.memberRole === "admin" ? "Admin" : "Joined") : isPrivate ? "Request to join" : "Join"}
            </Button>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center gap-1.5">
            {isPrivate ? <Lock className="h-4 w-4 text-muted-foreground" /> : <Globe className="h-4 w-4 text-muted-foreground" />}
            <h1 className="text-[20px] font-bold leading-tight">{inst.name}</h1>
            {inst.verified && <VerifiedBadge className="h-5 w-5 text-primary" />}
          </div>
          <p className="text-[14px] text-muted-foreground">@{inst.handle} · {typeLabel[inst.type] ?? inst.type}</p>
        </div>

        {inst.bio && <p className="mt-3 text-[15px] leading-[1.55] text-pretty">{inst.bio}</p>}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
          {inst.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {inst.location}
            </span>
          )}
          {inst.website && (
            <a href={inst.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
              <ExternalLink className="h-3.5 w-3.5" /> {inst.website.replace(/^https?:\/\//, "")}
            </a>
          )}
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> {inst._counts.members} members
          </span>
        </div>

        {/* Members preview */}
        <div className="mt-4 border-t border-border pt-3">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Members</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {inst.members.slice(0, 12).map((m) => (
              <button
                key={m.id}
                onClick={() => nav({ name: "profile", username: m.user.username })}
                title={`${m.user.name} · ${m.role}`}
                className="transition hover:opacity-80"
              >
                <UserAvatar name={m.user.name} username={m.user.username} avatarUrl={m.user.avatarUrl} size={40} />
              </button>
            ))}
            {inst.members.length > 12 && (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-[12px] font-medium text-muted-foreground">
                +{inst.members.length - 12}
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
            <Button
              size="sm"
              variant="secondary"
              className="rounded-full"
              onClick={() => openCompose({ institutionId: inst.id })}
            >
              <PenSquare className="mr-1.5 h-3.5 w-3.5" /> Post here
            </Button>
          )}
        </div>

        {gated ? (
          <EmptyState
            icon={Lock}
            title="This is a private feed"
            description={`Only members of ${inst.name} can view and post here. Join to see what's being shared.`}
            action={
              <Button
                className="rounded-full"
                disabled={joinMut.isPending}
                onClick={() => joinMut.mutate({ handle })}
              >
                {isPrivate ? "Request to join" : "Join"}
              </Button>
            }
            className="py-16"
          />
        ) : feed.isLoading ? (
          <LoadingState />
        ) : (feed.data?.posts ?? []).length === 0 ? (
          isMember ? (
            <EmptyState
              icon={PenSquare}
              title="No posts in this feed yet"
              description="Start the conversation in your school feed."
              action={
                <Button className="rounded-full" onClick={() => openCompose({ institutionId: inst.id })}>
                  <PenSquare className="mr-2 h-4 w-4" /> Write a post
                </Button>
              }
            />
          ) : (
            <EmptyState icon={PenSquare} title="No posts yet" description="Check back later for updates." />
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
