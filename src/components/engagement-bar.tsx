"use client";

import { useState } from "react";
import { Heart, MessageCircle, Repeat2, Bookmark, Share } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToggleLike, useToggleBookmark, useToggleRepost } from "@/lib/hooks";
import type { Post } from "@/lib/hooks";
import { toast } from "sonner";
import { LikeBurst } from "./like-burst";

function Counter({ value }: { value: number }) {
  if (value <= 0) return null;
  return <span className="tabular-nums">{value > 999 ? `${(value / 1000).toFixed(1)}k` : value}</span>;
}

export function EngagementBar({ post, onReply }: { post: Post; onReply?: () => void }) {
  const likeMut = useToggleLike();
  const bmMut = useToggleBookmark();
  const rpMut = useToggleRepost();
  const [animLike, setAnimLike] = useState(false);
  const [likeBurstTick, setLikeBurstTick] = useState(0);

  const toggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (likeMut.isPending) return;
    if (!post.liked) {
      setAnimLike(true);
      setLikeBurstTick((t) => t + 1);
      setTimeout(() => setAnimLike(false), 450);
    }
    likeMut.mutate({ id: post.id, liked: post.liked });
  };

  const toggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    bmMut.mutate({ id: post.id, bookmarked: post.bookmarked });
  };

  const toggleRepost = (e: React.MouseEvent) => {
    e.stopPropagation();
    rpMut.mutate({ id: post.id, reposted: post.reposted });
  };

  const handleReply = (e: React.MouseEvent) => {
    e.stopPropagation();
    onReply?.();
  };

  const share = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator.share) {
        await navigator.share({ title: "OpyCampus post", text: post.content });
      } else {
        await navigator.clipboard.writeText(post.content);
        toast.success("Copied to clipboard");
      }
    } catch {
      /* user cancelled */
    }
  };

  return (
    // Stop ALL clicks inside the engagement bar from bubbling to the parent article
    <div
      className="flex items-center justify-between gap-1 sm:max-w-[420px]"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={handleReply}
        className="group relative flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-sky-500/10 hover:text-sky-500 tap-highlight-none press-down"
        aria-label="Reply"
      >
        <MessageCircle className="h-[18px] w-[18px] transition-transform group-active:scale-90" />
        <span className="text-[12px] tabular-nums leading-none"><Counter value={post._counts.replies} /></span>
      </button>

      <button
        onClick={toggleRepost}
        disabled={rpMut.isPending}
        className={cn(
          "group relative flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-colors tap-highlight-none press-down",
          post.reposted ? "text-emerald-500" : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
        aria-label="Repost"
      >
        <Repeat2 className="h-[19px] w-[19px] transition-transform group-active:scale-90" />
        <span className="text-[12px] tabular-nums leading-none"><Counter value={post._counts.reposts} /></span>
      </button>

      <button
        onClick={toggleLike}
        disabled={likeMut.isPending}
        className={cn(
          "group relative flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-colors tap-highlight-none press-down",
          post.liked ? "text-rose-500" : "text-muted-foreground hover:bg-accent hover:text-rose-500"
        )}
        aria-label="Like"
      >
        <span className="relative inline-flex items-center justify-center">
          <Heart className={cn("h-[18px] w-[18px] transition-transform group-active:scale-90", post.liked && "fill-current", animLike && "animate-like-pop")} />
          {/* particle burst radiates from the heart on like */}
          <LikeBurst trigger={likeBurstTick} />
        </span>
        <span className="text-[12px] tabular-nums leading-none"><Counter value={post._counts.likes} /></span>
      </button>

      <div className="flex items-center">
        <button
          onClick={toggleBookmark}
          disabled={bmMut.isPending}
          className={cn(
            "group relative flex items-center rounded-full px-2.5 py-1.5 transition-colors tap-highlight-none press-down",
            post.bookmarked
              ? "text-amber-500"
              : "text-muted-foreground hover:bg-amber-500/10 hover:text-amber-500"
          )}
          aria-label="Save"
        >
          <Bookmark className={cn("h-[17px] w-[17px] transition-transform group-active:scale-90", post.bookmarked && "fill-current")} />
        </button>
        <button
          onClick={share}
          className="group relative flex items-center rounded-full px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-violet-500/10 hover:text-violet-500 tap-highlight-none press-down"
          aria-label="Share"
        >
          <Share className="h-[17px] w-[17px] transition-transform group-active:scale-90" />
        </button>
      </div>
    </div>
  );
}
