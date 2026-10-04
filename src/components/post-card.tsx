"use client";

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Repeat2, Quote, Bookmark, Share2, Copy, Trash2, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp, useSession, useToggleBookmark, useToggleRepost, useDeletePost } from "@/lib/hooks";
import type { Post } from "@/lib/hooks";
import { UserAvatar, VerifiedBadge } from "./user-avatar";
import { RelativeTime } from "./relative-time";
import { EngagementBar } from "./engagement-bar";
import { InstitutionPill } from "./institution-pill";
import { CommunityIcon } from "./custom-icons";
import { QuotedPostBlock } from "./quoted-post-block";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";

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
            {/* 3-dot menu — top-right of post, opens bottom sheet */}
            <div className="ml-auto">
              <PostMenu post={post} />
            </div>
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
            >
              {post.media.slice(0, 4).map((m, i) => (
                <div key={i} className={cn("relative overflow-hidden bg-secondary", post.media.length === 1 ? "max-h-[460px]" : "aspect-square")}>
                  {m.type === "video" ? (
                    <LazyVideo src={m.url} />
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); e.preventDefault(); openLightbox(post.media, i); }}
                      className="h-full w-full cursor-pointer p-0 border-0 bg-transparent"
                      aria-label={`View image ${i + 1}`}
                    >
                      <img
                        src={m.url}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-opacity hover:opacity-95"
                      />
                    </button>
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

// ─── LazyVideo: pauses when scrolled away, no unmount (prevents blinking) ───
function LazyVideo({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            if (video && !video.paused) video.pause();
          }
        });
      },
      { threshold: 0.1, rootMargin: "100px" }
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="relative h-full w-full bg-secondary">
      <video ref={videoRef} src={src} controls playsInline preload="metadata" className="h-full w-full object-cover" />
    </div>
  );
}

// ─── PostMenu: 3-dot button in top-right, opens bottom sheet (like Twitter/Threads) ───
function PostMenu({ post }: { post: Post }) {
  const [open, setOpen] = useState(false);
  const bmMut = useToggleBookmark();
  const rpMut = useToggleRepost();
  const delMut = useDeletePost();
  const { data: session } = useSession();
  const isOwn = session?.user?.id === post.author.id;

  const toggleBookmark = (e: React.MouseEvent) => { e.stopPropagation(); bmMut.mutate({ id: post.id, bookmarked: post.bookmarked }); setOpen(false); };
  const toggleRepost = (e: React.MouseEvent) => { e.stopPropagation(); rpMut.mutate({ id: post.id, reposted: post.reposted }); setOpen(false); };
  const copyText = async (e: React.MouseEvent) => { e.stopPropagation(); await navigator.clipboard.writeText(post.content); toast.success("Copied post text"); setOpen(false); };
  const share = async (e: React.MouseEvent) => { e.stopPropagation(); try { await navigator.clipboard.writeText(post.content); toast.success("Copied to clipboard"); } catch { /* ignore */ } setOpen(false); };

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="rounded-full p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground tap-highlight-none"
        aria-label="More options"
      >
        <MoreHorizontal className="h-[18px] w-[18px]" />
      </button>
      <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) {} }}>
        <SheetContent side="bottom" className="mx-auto w-full max-w-[640px] rounded-t-2xl border-border bg-background p-0">
          <SheetHeader className="px-4 pt-3 pb-2">
            <SheetTitle className="text-center text-[15px] font-semibold text-muted-foreground">Post options</SheetTitle>
          </SheetHeader>
          <div className="px-2 pb-6" onClick={(e) => e.stopPropagation()}>
            <MenuItem icon={Repeat2} label={post.reposted ? "Undo repost" : "Repost"} onClick={toggleRepost} active={post.reposted} activeColor="text-emerald-500" />
            <MenuItem icon={Quote} label="Quote" onClick={(e) => { e.stopPropagation(); toast.info("Quote coming soon"); setOpen(false); }} />
            <MenuItem icon={Bookmark} label={post.bookmarked ? "Remove from saved" : "Save"} onClick={toggleBookmark} active={post.bookmarked} activeColor="text-amber-500" />
            <MenuItem icon={Share2} label="Share" onClick={share} />
            <MenuItem icon={Copy} label="Copy text" onClick={copyText} />
            {isOwn ? (
              <MenuItem icon={Trash2} label="Delete" onClick={(e) => { e.stopPropagation(); delMut.mutate(post.id); setOpen(false); }} activeColor="text-destructive" />
            ) : (
              <MenuItem icon={Flag} label="Report" onClick={(e) => { e.stopPropagation(); toast.success("Reported"); setOpen(false); }} activeColor="text-destructive" />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function MenuItem({ icon: Icon, label, onClick, active, activeColor }: { icon: any; label: string; onClick: (e: React.MouseEvent) => void; active?: boolean; activeColor?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-[16px] font-medium transition hover:bg-accent tap-highlight-none", active && activeColor)}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
}
