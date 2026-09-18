"use client";

import { Bookmark, ArrowLeft } from "lucide-react";
import { useApp, useBookmarks } from "@/lib/hooks";
import { PostCard } from "@/components/post-card";
import { SkeletonFeed, EmptyState } from "@/components/view-helpers";
import { Button } from "@/components/ui/button";

export function BookmarksView() {
  const { nav, back } = useApp();
  const { data, isLoading } = useBookmarks();
  const posts = data?.posts ?? [];

  return (
    <div className="mx-auto w-full max-w-[640px]">
      <div className="sticky top-14 z-20 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-2.5 backdrop-blur-md lg:top-0 lg:px-5">
        <button onClick={back} className="hidden lg:inline-flex lg:h-9 lg:w-9 lg:items-center lg:justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground tap-highlight-none" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-[15px] font-semibold">Saved</h1>
      </div>

      {isLoading ? (
        <SkeletonFeed count={4} />
      ) : posts.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No saved posts"
          description="Bookmark posts to read them later — they'll show up here."
          className="py-20"
          action={
            <Button variant="secondary" className="rounded-full" onClick={() => nav({ name: "home" })}>
              Browse the feed
            </Button>
          }
        />
      ) : (
        <div className="divide-y divide-border">
          {posts.map((p, i) => (
            <PostCard key={p.id} post={p} showThreadLine={i < posts.length - 1} />
          ))}
        </div>
      )}
      <div className="h-20" />
    </div>
  );
}
