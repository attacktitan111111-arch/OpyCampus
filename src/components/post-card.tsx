"use client";

import { cn } from "@/lib/utils";
import { useApp, useSession } from "@/lib/hooks";
import type { Post } from "@/lib/hooks";
import { UserAvatar, VerifiedBadge } from "./user-avatar";
import { RelativeTime } from "./relative-time";
import { EngagementBar } from "./engagement-bar";
import { InstitutionPill } from "./institution-pill";
import { CommunityIcon } from "./custom-icons";
import { QuotedPostBlock } from "./quoted-post-block";

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

export function PostCard({ post }: { post: Post }) {
  const { nav, openLightbox } = useApp();

  const onAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    nav({ name: "profile", username: post.author.username });
  };

  const onInstitutionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (post.institution) nav({ name: "institution", handle: post.institution.handle });
  };

  const openPost = () => nav({ name: "post", postId: post.id });

  const onQuotedPostClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (post.quoteOf) nav({ name: "post", postId: post.quoteOf.id });
  };

  // Open lightbox via store — renders at page.tsx level, completely outside this article
  const openLightboxAt = (e: React.MouseEvent, i: number) => {
    e.stopPropagation();
    e.preventDefault();
    openLightbox(post.media, i);
  };

  // Comment button navigates to the post detail (thread) page — like Threads app
  const onComment = () => {
    nav({ name: "post", postId: post.id });
  };

  return (
    <article
      onClick={openPost}
      className="group relative cursor-pointer px-4 py-3 transition-colors hover:bg-muted/40 active:scale-[0.995] sm:px-5 sm:py-3.5 tap-highlight-none"
    >
      <div className="flex gap-3">
        {/* Avatar — no thread line */}
        <div className="flex flex-col items-center">
          <UserAvatar
            name={post.author.name}
            username={post.author.username}
            avatarUrl={post.author.avatarUrl}
            size={44}
            onClick={onAuthorClick}
          />
        </div>

        {/* Body */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="flex items-center gap-1.5 text-[15px] leading-tight">
            <button
              onClick={onAuthorClick}
              className="flex min-w-0 items-center gap-1 font-semibold hover:underline"
            >
              <span className="truncate">{post.author.name}</span>
              {post.author.verified && <VerifiedBadge className="h-4 w-4 text-primary" />}
            </button>
            <span className="shrink-0 text-muted-foreground">@{post.author.username}</span>
            <span className="shrink-0 text-muted-foreground">·</span>
            <span className="shrink-0 text-[13px] text-muted-foreground hover:underline">
              <RelativeTime date={post.createdAt} />
            </span>
          </div>

          {/* Replying to / context */}
          {(post.institution || post.community || post.parent) && (
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground">
              {post.parent && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nav({ name: "post", postId: post.parent!.id });
                  }}
                  className="hover:underline"
                >
                  replying to @{post.parent.author.username}
                </button>
              )}
              {post.institution && (
                <button onClick={onInstitutionClick} className="inline-flex items-center">
                  <InstitutionPill institution={post.institution} />
                </button>
              )}
              {post.community && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nav({ name: "community", handle: post.community!.handle });
                  }}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-secondary"
                >
                  <CommunityIcon className="h-3 w-3" />
                  <span className="max-w-[120px] truncate">{post.community.name}</span>
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="mt-1 whitespace-pre-wrap break-words text-[15px] leading-[1.55] text-foreground text-pretty">
            {renderContent(post.content)}
          </div>

          {/* Quoted post (if this is a quote repost) */}
          {post.quoteOf && (
            <div className="mt-2.5">
              <QuotedPostBlock post={post.quoteOf} variant="card" onClick={onQuotedPostClick} />
            </div>
          )}

          {/* Media (images + videos) */}
          {post.media.length > 0 && (
            <div
              className={cn(
                "mt-2.5 grid gap-1 overflow-hidden rounded-2xl border border-border bg-secondary/30",
                post.media.length === 1 ? "grid-cols-1" : "grid-cols-2"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {post.media.slice(0, 4).map((m, i) => (
                <div key={i} className={cn("relative overflow-hidden bg-secondary", post.media.length === 1 ? "max-h-[460px]" : "aspect-square")}>
                  {m.type === "video" ? (
                    <video
                      src={m.url}
                      controls
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <img
                      src={m.url}
                      alt=""
                      loading="lazy"
                      onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); openLightbox(post.media, i); }}
                      className="h-full w-full cursor-pointer object-cover transition-opacity hover:opacity-95"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[13px] text-primary">
              {post.tags.map((t) => (
                <button
                  key={t}
                  onClick={(e) => {
                    e.stopPropagation();
                    nav({ name: "tag", tag: t });
                  }}
                  className="font-medium hover:underline"
                >
                  #{t}
                </button>
              ))}
            </div>
          )}

          {/* Engagement — Like, Comment, View, More */}
          <div className="mt-3 -ml-2">
            <EngagementBar post={post} onComment={onComment} />
          </div>
        </div>
      </div>
    </article>
  );
}
