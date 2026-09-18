"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useApp, useReplies } from "@/lib/hooks";
import type { Post } from "@/lib/hooks";
import { UserAvatar, VerifiedBadge } from "./user-avatar";
import { RelativeTime } from "./relative-time";

function truncate(text: string, max = 140) {
  const t = text.trim();
  if (t.length <= max) return t;
  return t.slice(0, max).trimEnd() + "…";
}

function ReplyRow({ reply, onNavigate }: { reply: Post; onNavigate: () => void }) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onNavigate();
      }}
      className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent/60"
    >
      <UserAvatar
        name={reply.author.name}
        username={reply.author.username}
        avatarUrl={reply.author.avatarUrl}
        size={24}
        className="mt-0.5"
      />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-snug text-foreground/90">
          <span className="font-semibold text-foreground">{reply.author.name}</span>
          {reply.author.verified && (
            <VerifiedBadge className="ml-1 inline-block h-3 w-3 text-primary" />
          )}{" "}
          <span className="text-muted-foreground">{truncate(reply.content)}</span>
        </p>
      </div>
      <span className="shrink-0 text-[11px] text-muted-foreground/80">
        <RelativeTime date={reply.createdAt} />
      </span>
    </div>
  );
}

/**
 * Comments preview shown below a PostCard on the feed. Fetches the first
 * few replies (default 2) and renders them as compact rows with avatars. A
 * "View all N replies" button expands the preview inline OR navigates to
 * the post detail page when the count exceeds the preview cap.
 */
export function CommentsPreview({ post }: { post: Post }) {
  const { nav } = useApp();
  const totalReplies = post._counts.replies;
  const PREVIEW_CAP = 2;

  // Only fetch if the post actually has replies.
  const { data, isLoading } = useReplies(
    totalReplies > 0 ? post.id : null,
    PREVIEW_CAP + 1 // fetch one extra to know whether to show "view all"
  );

  const [expanded, setExpanded] = useState(false);

  if (totalReplies === 0) return null;

  const allReplies = data?.replies ?? [];
  const previewReplies = expanded ? allReplies.slice(0, 6) : allReplies.slice(0, PREVIEW_CAP);
  const hasMore = totalReplies > previewReplies.length;

  const goToPost = () => nav({ name: "post", postId: post.id });

  if (isLoading) {
    return (
      <div className="mt-2 ml-2 rounded-xl bg-muted/40 px-3 py-2">
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <MessageCircle className="h-3 w-3 animate-pulse" />
          <span>Loading comments…</span>
        </div>
      </div>
    );
  }

  if (allReplies.length === 0) return null;

  return (
    <div
      className="mt-2 ml-2"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="overflow-hidden rounded-xl bg-muted/40 px-1.5 py-1">
        {/* Vertical thread line connecting replies */}
        <div className="relative">
          <div className="absolute left-[20px] top-0 bottom-0 w-px bg-border/70" aria-hidden />

          <AnimatePresence initial={false}>
            <motion.div
              key={expanded ? "expanded" : "collapsed"}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-0.5"
            >
              {previewReplies.map((r) => (
                <ReplyRow key={r.id} reply={r} onNavigate={goToPost} />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer actions: view all / expand */}
        <div className="flex items-center gap-2 px-2 pb-1 pt-0.5">
          {hasMore && (
            <button
              onClick={goToPost}
              className="text-[12px] font-medium text-primary transition-colors hover:underline"
            >
              View all {totalReplies} {totalReplies === 1 ? "reply" : "replies"}
            </button>
          )}
          {allReplies.length > PREVIEW_CAP && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="ml-auto inline-flex items-center gap-1 text-[12px] text-muted-foreground transition-colors hover:text-foreground hover:underline"
            >
              {expanded ? (
                <>
                  Show less <ChevronUp className="h-3 w-3" />
                </>
              ) : (
                <>
                  Expand <ChevronDown className="h-3 w-3" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
