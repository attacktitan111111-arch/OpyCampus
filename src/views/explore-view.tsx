"use client";

import { useState, useEffect } from "react";
import { Search, TrendingUp, Hash, X, Sparkles, Building2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp, useExplore, useUsersSearch, useInstitutionsSearch } from "@/lib/hooks";
import { UserCard } from "@/components/user-card";
import { PostCard } from "@/components/post-card";
import { LoadingState, EmptyState, SkeletonExploreCard, SkeletonFeed, Shimmer } from "@/components/view-helpers";
import { InstitutionCard } from "@/components/institution-card";

export function ExploreView({ initialQuery }: { initialQuery?: string }) {
  const { nav } = useApp();
  const [q, setQ] = useState(initialQuery ?? "");
  const [debounced, setDebounced] = useState(initialQuery ?? "");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 280);
    return () => clearTimeout(t);
  }, [q]);

  const explore = useExplore(debounced);
  const users = useUsersSearch(debounced);
  const institutions = useInstitutionsSearch(debounced);
  const isSearching = debounced.length > 0;

  return (
    <div className="mx-auto w-full max-w-[640px]">
      {/* Search header */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/85 px-4 py-3 backdrop-blur-md lg:top-0 lg:px-5">
        <div className="flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-2.5 transition focus-within:border-foreground/30 focus-within:bg-background">
          <Search className="h-[18px] w-[18px] text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search people, schools, posts…"
            className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
          />
          {q && (
            <button onClick={() => setQ("")} className="rounded-full p-1 text-muted-foreground hover:text-foreground" aria-label="Clear">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {isSearching ? (
        <SearchResults
          users={users.data?.users ?? []}
          following={users.data?.isFollowing ?? []}
          institutions={institutions.data?.institutions ?? []}
          posts={explore.data?.posts ?? []}
          loading={users.isLoading || explore.isLoading}
        />
      ) : (
        <ExploreHome
          trending={explore.data?.trending ?? []}
          suggested={explore.data?.suggestedUsers ?? []}
          loading={explore.isLoading}
          onTag={(t) => nav({ name: "tag", tag: t })}
        />
      )}

      <div className="h-20" />
    </div>
  );
}

function ExploreHome({
  trending,
  suggested,
  loading,
  onTag,
}: {
  trending: { tag: string; count: number }[];
  suggested: any[];
  loading: boolean;
  onTag: (t: string) => void;
}) {
  const { nav } = useApp();
  return (
    <div className="animate-fade-in">
      {loading ? (
        <>
          <section className="border-b border-border">
            <SkeletonExploreCard />
          </section>
          <section className="border-b border-border px-4 py-3">
            <div className="grid grid-cols-2 gap-3">
              <SkeletonExploreCard />
              <SkeletonExploreCard />
            </div>
          </section>
          <section>
            <div className="px-4 py-3">
              <Shimmer className="h-4 w-32" />
            </div>
            <SkeletonFeed count={3} />
          </section>
        </>
      ) : (
        <>
          {/* Trending topics */}
          <section className="border-b border-border">
            <div className="flex items-center gap-2 px-4 py-3">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-[15px] font-semibold">Trending topics</h2>
            </div>
            <div className="px-4 pb-3">
              <div className="flex flex-wrap gap-2">
                {trending.length === 0 && (
                  <p className="text-sm text-muted-foreground">No trending topics yet.</p>
                )}
                {trending.map((t) => (
                  <button
                    key={t.tag}
                    onClick={() => onTag(t.tag)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-[13px] font-medium transition hover:bg-secondary"
                  >
                    <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                    {t.tag}
                    <span className="text-muted-foreground">· {t.count}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Quick access */}
          <section className="border-b border-border">
            <div className="px-4 py-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => nav({ name: "institutions" })}
                  className="flex flex-col gap-2 rounded-2xl border border-border bg-secondary/30 p-4 text-left transition hover:bg-secondary"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-background">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold">Schools</p>
                    <p className="text-[13px] text-muted-foreground">Find or add your school</p>
                  </div>
                </button>
                <button
                  onClick={() => nav({ name: "communities" })}
                  className="flex flex-col gap-2 rounded-2xl border border-border bg-secondary/30 p-4 text-left transition hover:bg-secondary"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-background">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold">Groups</p>
                    <p className="text-[13px] text-muted-foreground">Study groups & clubs</p>
                  </div>
                </button>
              </div>
            </div>
          </section>

          {/* Suggested people */}
          <section>
            <div className="flex items-center gap-2 px-4 py-3">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-[15px] font-semibold">Suggested for you</h2>
            </div>
            {suggested.length === 0 ? (
              <p className="px-4 pb-4 text-sm text-muted-foreground">You're all caught up.</p>
            ) : (
              <div className="divide-y divide-border">
                {suggested.map((u) => (
                  <UserCard key={u.id} user={u} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function SearchResults({
  users,
  following,
  institutions,
  posts,
  loading,
}: {
  users: any[];
  following: string[];
  institutions: any[];
  posts: any[];
  loading: boolean;
}) {
  const { nav } = useApp();
  const empty = users.length === 0 && institutions.length === 0 && posts.length === 0;

  if (loading) return <LoadingState label="Searching" />;
  if (empty)
    return (
      <EmptyState
        icon={Search}
        title="No results found"
        description="Try a different name, school, or topic."
        className="py-20"
      />
    );

  return (
    <div className="animate-fade-in">
      {users.length > 0 && (
        <section className="border-b border-border">
          <h2 className="px-4 py-3 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">People</h2>
          <div className="divide-y divide-border">
            {users.slice(0, 6).map((u) => (
              <UserCard key={u.id} user={u} following={following.includes(u.id)} />
            ))}
          </div>
        </section>
      )}
      {institutions.length > 0 && (
        <section className="border-b border-border">
          <h2 className="px-4 py-3 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Schools & institutions</h2>
          <div className="divide-y divide-border">
            {institutions.slice(0, 4).map((i) => (
              <InstitutionCard key={i.id} institution={i} onClick={() => nav({ name: "institution", handle: i.handle })} />
            ))}
          </div>
        </section>
      )}
      {posts.length > 0 && (
        <section>
          <h2 className="px-4 py-3 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Posts</h2>
          <div className="divide-y divide-border">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
