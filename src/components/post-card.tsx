"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal, Trash2, Copy, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp, useDeletePost, useSession } from "@/lib/hooks";
import type { Post } from "@/lib/hooks";
import { UserAvatar, VerifiedBadge } from "./user-avatar";
import { RelativeTime } from "./relative-time";
import { EngagementBar } from "./engagement-bar";
import { InstitutionPill } from "./institution-pill";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

function renderContent(content: string) {
  // Highlight hashtags and @mentions
  const parts = content.split(/(\s+)/);
  return parts.map((part, i) => {
    if (part.startsWith("#")) {
      const tag = part.replace(/[#.,!?;]+$/g, "");
      return (
        <span key={i} className="text-primary font-medium hover:underline cursor-pointer">
          {tag}
        </span>
      );
    }
    if (part.startsWith("@")) {
      const mention = part.replace(/[^a-zA-Z0-9._-]/g, "").slice(1);
      return (
        <span key={i} className="text-primary font-medium hover:underline cursor-pointer">
          @{mention}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function PostCard({ post, showThreadLine = false }: { post: Post; showThreadLine?: boolean }) {
  const { nav, openCompose } = useApp();
  const { data: session } = useSession();
  const delMut = useDeletePost();
  const [menuOpen, setMenuOpen] = useState(false);

  const isOwn = session?.user?.id === post.author.id;

  const onAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    nav({ name: "profile", username: post.author.username });
  };

  const onInstitutionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (post.institution) nav({ name: "institution", handle: post.institution.handle });
  };

  const openPost = () => nav({ name: "post", postId: post.id });

  const onReply = (e: React.MouseEvent) => {
    e.stopPropagation();
    openCompose({
      replyTo: { id: post.id, authorName: post.author.name, authorUsername: post.author.username },
    });
  };

  const copyText = async () => {
    await navigator.clipboard.writeText(post.content);
    toast.success("Copied post text");
  };

  return (
    <article
      onClick={openPost}
      className="group relative cursor-pointer px-4 py-3 transition-colors hover:bg-muted/40 sm:px-5 sm:py-3.5 animate-fade-up"
    >
      <div className="flex gap-3">
        {/* Avatar + thread line */}
        <div className="flex flex-col items-center">
          <UserAvatar
            name={post.author.name}
            username={post.author.username}
            avatarUrl={post.author.avatarUrl}
            size={44}
            onClick={onAuthorClick}
          />
          {showThreadLine && <div className="mt-1 w-px flex-1 bg-border" />}
        </div>

        {/* Body */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="flex items-center gap-1.5 text-[15px] leading-tight">
            <button
              onClick={onAuthorClick}
              className="flex items-center gap-1 min-w-0 font-semibold hover:underline truncate"
            >
              <span className="truncate">{post.author.name}</span>
              {post.author.verified && <VerifiedBadge className="h-4 w-4 text-primary" />}
            </button>
            <span className="text-muted-foreground shrink-0">@{post.author.username}</span>
            <span className="text-muted-foreground shrink-0">·</span>
            <span className="text-muted-foreground shrink-0 text-sm hover:underline">
              <RelativeTime date={post.createdAt} />
            </span>

            <div className="ml-auto">
              <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="rounded-full p-1.5 text-muted-foreground opacity-0 transition hover:bg-accent hover:text-foreground group-hover:opacity-100 focus:opacity-100 data-[state=open]:opacity-100"
                    aria-label="Post options"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={copyText}>
                    <Copy className="mr-2 h-4 w-4" /> Copy text
                  </DropdownMenuItem>
                  {isOwn ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => delMut.mutate(post.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem className="text-destructive focus:text-destructive">
                      <Flag className="mr-2 h-4 w-4" /> Report
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Replying to / institution context */}
          {(post.institution || post.parent) && (
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
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
            </div>
          )}

          {/* Content */}
          <div className="mt-1 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-foreground">
            {renderContent(post.content)}
          </div>

          {/* Images */}
          {post.images.length > 0 && (
            <div
              className={cn(
                "mt-2.5 grid gap-1 overflow-hidden rounded-2xl border border-border",
                post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"
              )}
            >
              {post.images.slice(0, 4).map((src, i) => (
                 
                <img
                  key={i}
                  src={src}
                  alt=""
                  loading="lazy"
                  className={cn(
                    "w-full object-cover",
                    post.images.length === 1 ? "max-h-[460px]" : "aspect-square"
                  )}
                />
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

          {/* Engagement */}
          <div className="mt-2 -ml-1.5">
            <EngagementBar post={post} onReply={onReply} />
          </div>
        </div>
      </div>
    </article>
  );
}
