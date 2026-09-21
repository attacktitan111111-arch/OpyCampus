"use client";

import { useState } from "react";
import { Heart, MessageCircle, Eye, MoreHorizontal, Repeat2, Bookmark, Share2, Quote, Flag, Copy, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToggleLike, useToggleBookmark, useToggleRepost, useDeletePost, useSession } from "@/lib/hooks";
import type { Post } from "@/lib/hooks";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function Counter({ value }: { value: number }) {
  if (value <= 0) return null;
  return <span className="text-[12px] tabular-nums leading-none font-medium">{value > 999 ? `${(value / 1000).toFixed(1)}k` : value}</span>;
}

export function EngagementBar({ post, onComment }: { post: Post; onComment?: () => void }) {
  const likeMut = useToggleLike();
  const bmMut = useToggleBookmark();
  const rpMut = useToggleRepost();
  const delMut = useDeletePost();
  const { data: session } = useSession();
  const [animLike, setAnimLike] = useState(false);
  const isOwn = session?.user?.id === post.author.id;

  const toggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (likeMut.isPending) return;
    if (!post.liked) {
      setAnimLike(true);
      setTimeout(() => setAnimLike(false), 500);
    }
    likeMut.mutate({ id: post.id, liked: post.liked });
  };

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    onComment?.();
  };

  const toggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    bmMut.mutate({ id: post.id, bookmarked: post.bookmarked });
  };

  const toggleRepost = (e: React.MouseEvent) => {
    e.stopPropagation();
    rpMut.mutate({ id: post.id, reposted: post.reposted });
  };

  const share = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(post.content);
      toast.success("Copied to clipboard");
    } catch { /* ignore */ }
  };

  const copyText = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(post.content);
    toast.success("Copied post text");
  };

  return (
    <div className="flex items-center justify-between gap-0.5 sm:max-w-[360px]" onClick={(e) => e.stopPropagation()}>
      {/* Like — FIRST (left), bigger */}
      <button
        onClick={toggleLike}
        disabled={likeMut.isPending}
        className={cn(
          "group flex items-center gap-1.5 rounded-full px-3 py-2 transition-colors tap-highlight-none",
          post.liked ? "text-rose-500" : "text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500"
        )}
        aria-label="Like"
      >
        <div className="relative">
          <Heart className={cn("h-[22px] w-[22px] transition-transform group-active:scale-90", post.liked && "fill-current", animLike && "animate-like-pop")} />
          {animLike && (
            <span className="pointer-events-none absolute inset-0 -m-2 animate-ping rounded-full bg-rose-500/20" />
          )}
        </div>
        <Counter value={post._counts.likes} />
      </button>

      {/* Comment — second */}
      <button
        onClick={handleComment}
        className="group flex items-center gap-1.5 rounded-full px-3 py-2 text-muted-foreground transition-colors hover:bg-sky-500/10 hover:text-sky-500 tap-highlight-none"
        aria-label="Comments"
      >
        <MessageCircle className="h-[21px] w-[21px] transition-transform group-active:scale-90" />
        <Counter value={post._counts.replies} />
      </button>

      {/* Views — third (display only) */}
      <button
        className="group flex items-center gap-1.5 rounded-full px-3 py-2 text-muted-foreground transition-colors hover:bg-violet-500/10 hover:text-violet-500 tap-highlight-none"
        aria-label="Views"
      >
        <Eye className="h-[20px] w-[20px]" />
        <Counter value={post._counts.likes + post._counts.replies + post._counts.reposts} />
      </button>

      {/* 3-dot menu — right side */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="group flex items-center gap-1.5 rounded-full px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground tap-highlight-none"
            aria-label="More options"
          >
            <MoreHorizontal className="h-[21px] w-[21px] transition-transform group-active:scale-90" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={toggleRepost} className={cn(post.reposted && "text-emerald-500")}>
            <Repeat2 className="mr-2 h-4 w-4" /> {post.reposted ? "Undo repost" : "Repost"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => { /* quote handled by parent */ toast.info("Quote repost coming soon"); }}>
            <Quote className="mr-2 h-4 w-4" /> Quote
          </DropdownMenuItem>
          <DropdownMenuItem onClick={toggleBookmark} className={cn(post.bookmarked && "text-amber-500")}>
            <Bookmark className="mr-2 h-4 w-4" /> {post.bookmarked ? "Remove from saved" : "Save"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={share}>
            <Share2 className="mr-2 h-4 w-4" /> Share
          </DropdownMenuItem>
          <DropdownMenuItem onClick={copyText}>
            <Copy className="mr-2 h-4 w-4" /> Copy text
          </DropdownMenuItem>
          {isOwn ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => delMut.mutate(post.id)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <Flag className="mr-2 h-4 w-4" /> Report
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
