"use client";

import { cn } from "@/lib/utils";
import type { Post } from "@/lib/hooks";
import { UserAvatar, VerifiedBadge } from "./user-avatar";
import { RelativeTime } from "./relative-time";

function renderContent(content: string) {
  const parts = content.split(/(\s+)/);
  return parts.map((part, i) => {
    if (part.startsWith("#")) {
      return (
        <span key={i} className="font-medium text-primary/90">
          {part.replace(/[#.,!?;]+$/g, "")}
        </span>
      );
    }
    if (part.startsWith("@")) {
      return (
        <span key={i} className="font-medium text-primary/90">
          {part.replace(/[^a-zA-Z0-9._-]/g, "")}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/**
 * Renders a quoted post — a compact, bordered, non-editable block that
 * previews the original post being quoted. Used inside PostCard (for quote
 * posts on the feed) and inside ComposeBox (so the user can see what they
 * are quoting while writing their commentary).
 *
 * Variants:
 *  - "card"   — full card with author header, media, etc. (used in feed)
 *  - "compact"— text-only preview, no media (used in compose dialog)
 */
export function QuotedPostBlock({
  post,
  variant = "card",
  onClick,
  className,
}: {
  post: Post | { id: string; content: string; author: { name: string; username: string; verified?: boolean; avatarUrl?: string | null }; createdAt?: string; media?: any[] };
  variant?: "card" | "compact";
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}) {
  const isCompact = variant === "compact";
  const media = (post as any).media ?? [];
  const createdAt = (post as any).createdAt;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-muted/30 transition-colors",
        onClick && "cursor-pointer hover:bg-muted/60 hover:border-foreground/20",
        isCompact && "px-3 py-2.5",
        className
      )}
    >
      {/* Author header (card variant only) */}
      {!isCompact && (
        <div className="flex items-center gap-2 px-3 pt-2.5 text-[13px] leading-tight">
          <UserAvatar
            name={post.author.name}
            username={post.author.username}
            avatarUrl={post.author.avatarUrl}
            size={20}
          />
          <span className="truncate font-semibold">{post.author.name}</span>
          {post.author.verified && <VerifiedBadge className="h-3 w-3 text-primary" />}
          <span className="truncate text-muted-foreground">@{post.author.username}</span>
          {createdAt && (
            <>
              <span className="text-muted-foreground">·</span>
              <span className="shrink-0 text-muted-foreground">
                <RelativeTime date={createdAt} />
              </span>
            </>
          )}
        </div>
      )}

      {/* Compact variant: author on one line */}
      {isCompact && (
        <div className="mb-1 flex items-center gap-1.5 text-[12px] leading-tight">
          <span className="truncate font-semibold">{post.author.name}</span>
          {post.author.verified && <VerifiedBadge className="h-3 w-3 text-primary" />}
          <span className="truncate text-muted-foreground">@{post.author.username}</span>
        </div>
      )}

      {/* Content */}
      <div
        className={cn(
          "whitespace-pre-wrap break-words text-foreground/90 text-pretty",
          isCompact ? "text-[13px] leading-snug line-clamp-3" : "px-3 pb-2.5 pt-1 text-[14px] leading-snug line-clamp-4"
        )}
      >
        {renderContent(post.content)}
      </div>

      {/* Media (card variant only) */}
      {!isCompact && media.length > 0 && (
        <div className="grid grid-cols-2 gap-0.5 border-t border-border">
          {media.slice(0, 4).map((m: any, i: number) => (
            <div key={i} className="relative aspect-square overflow-hidden bg-secondary">
              {m.type === "video" ? (
                <video src={m.url} className="h-full w-full object-cover" muted playsInline preload="metadata" />
              ) : (
                <img src={m.url} alt="" loading="lazy" className="h-full w-full object-cover" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
