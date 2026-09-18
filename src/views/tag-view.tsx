"use client";

import { ArrowLeft, Hash } from "lucide-react";
import { useApp, useExplore } from "@/lib/hooks";
import { PostCard } from "@/components/post-card";
import { EmptyState, SkeletonFeed } from "@/components/view-helpers";
import { Button } from "@/components/ui/button";

export function TagView({ tag }: { tag: string }) {
  const { back } = useApp();
  // explore with the tag as the query won't match posts by tag though; we search posts containing the tag text
  // For simplicity, search posts containing "#tag" via the explore endpoint (which does a content contains query)
  const { data, isLoading } = useExplore(`#${tag}`);
  const posts = (data?.posts ?? []).filter((p) => p.content.toLowerCase().includes(`#${tag.toLowerCase()}`));

  return (
    <div className="mx-auto w-full max-w-[640px]">
      <div className="sticky top-14 z-20 flex items-center gap-3 border-b border-border bg-background/80 px-3 py-2.5 backdrop-blur-md lg:top-0">
        <button onClick={back} className="rounded-full p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="flex items-center gap-1 text-[17px] font-bold">
          <Hash className="h-5 w-5 text-muted-foreground" />
          {tag}
        </h1>
      </div>

      <div className="border-b border-border px-4 py-3">
        <p className="text-[14px] text-muted-foreground">Posts tagged with <span className="font-semibold text-foreground">#{tag}</span></p>
      </div>

      {isLoading ? (
        <SkeletonFeed count={4} />
      ) : posts.length === 0 ? (
        <EmptyState
          icon={Hash}
          title="No posts with this tag yet"
          description="Be the first to use this hashtag."
          className="py-20"
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
