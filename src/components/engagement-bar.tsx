"use client";

import { useState } from "react";
import { Heart, MessageCircle, Repeat2, Bookmark, Share } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp, useToggleLike, useToggleBookmark, useToggleRepost } from "@/lib/hooks";
import type { Post } from "@/lib/hooks";
import { toast } from "sonner";

function Counter({ value }: { value: number }) {
  if (value <= 0) return null;
  return <span className="tabular-nums">{value > 999 ? `${(value / 1000).toFixed(1)}k` : value}</span>;
}

export function EngagementBar({ post, onReply }: { post: Post; onReply?: () => void }) {
  const likeMut = useToggleLike();
  const bmMut = useToggleBookmark();
  const rpMut = useToggleRepost();
  const [animLike, setAnimLike] = useState(false);

  const toggleLike = () => {
    if (likeMut.isPending) return;
    if (!post.liked) {
      setAnimLike(true);
      setTimeout(() => setAnimLike(false), 450);
    }
    likeMut.mutate({ id: post.id, liked: post.liked });
  };

  const toggleBookmark = () => {
    bmMut.mutate({ id: post.id, bookmarked: post.bookmarked });
  };

  const toggleRepost = () => {
    rpMut.mutate({ id: post.id, reposted: post.reposted });
  };

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "Scholar post", text: post.content });
      } else {
        await navigator.clipboard.writeText(post.content);
        toast.success("Copied to clipboard");
      }
    } catch {
      /* user cancelled */
    }
  };

  return (
    <div className="flex items-center justify-between gap-1 sm:max-w-[420px]">
      <button
        onClick={onReply}
        className="group flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-label="Reply"
      >
        <MessageCircle className="h-[18px] w-[18px] transition-transform group-active:scale-90" />
        <span className="text-[12px] tabular-nums leading-none"><Counter value={post._counts.replies} /></span>
      </button>

      <button
        onClick={toggleRepost}
        disabled={rpMut.isPending}
        className={cn(
          "group flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-colors",
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
          "group flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-colors",
          post.liked ? "text-rose-500" : "text-muted-foreground hover:bg-accent hover:text-rose-500"
        )}
        aria-label="Like"
      >
        <Heart className={cn("h-[18px] w-[18px] transition-transform group-active:scale-90", post.liked && "fill-current", animLike && "animate-like-pop")} />
        <span className="text-[12px] tabular-nums leading-none"><Counter value={post._counts.likes} /></span>
      </button>

      <div className="flex items-center">
        <button
          onClick={toggleBookmark}
          disabled={bmMut.isPending}
          className={cn(
            "group flex items-center rounded-full px-2.5 py-1.5 transition-colors",
            post.bookmarked ? "text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
          aria-label="Save"
        >
          <Bookmark className={cn("h-[17px] w-[17px] transition-transform group-active:scale-90", post.bookmarked && "fill-current")} />
        </button>
        <button
          onClick={share}
          className="group flex items-center rounded-full px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Share"
        >
          <Share className="h-[17px] w-[17px] transition-transform group-active:scale-90" />
        </button>
      </div>
    </div>
  );
}
