"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Send, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp, useReplies, useCreatePost, useSession } from "@/lib/hooks";
import type { Post } from "@/lib/hooks";
import { UserAvatar, VerifiedBadge } from "./user-avatar";
import { RelativeTime } from "./relative-time";
import { toast } from "sonner";

/**
 * Facebook/TikTok-style comment row: avatar (32px) on the left, author name +
 * relative time + comment text in a rounded bubble on the right. Clicking the
 * author's name navigates to their profile. No threading, no expand/show-less
 * — see it, type, press Enter, done.
 */
function CommentRow({ reply }: { reply: Post }) {
  const { nav } = useApp();
  const authorClick = () => nav({ name: "profile", username: reply.author.username });

  return (
    <div className="flex items-start gap-2.5 py-2">
      <UserAvatar
        name={reply.author.name}
        username={reply.author.username}
        avatarUrl={reply.author.avatarUrl}
        size={32}
        className="mt-0.5"
        onClick={authorClick}
      />
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl rounded-tl-sm bg-muted/50 px-3 py-2 transition-colors">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <button
              onClick={authorClick}
              className="truncate text-[13px] font-semibold text-foreground hover:underline"
            >
              {reply.author.name}
            </button>
            {reply.author.verified && <VerifiedBadge className="h-3 w-3 text-primary" />}
            <span className="text-[11px] text-muted-foreground">
              <RelativeTime date={reply.createdAt} />
            </span>
          </div>
          <p className="mt-0.5 whitespace-pre-wrap break-words text-[14px] leading-snug text-foreground text-pretty">
            {reply.content}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Facebook/TikTok-style comment section for a post.
 *
 * Collapsed by default: shows a "N comments" toggle. Click it (or the comment
 * count in the engagement bar) to expand. When expanded, shows ALL comments
 * vertically (newest at the bottom) with the input box always visible at the
 * bottom of the section. Pressing Enter posts a comment via the existing
 * /api/posts endpoint with parentId = post.id.
 *
 * The whole section stops click propagation so expanding/commenting on a
 * PostCard never navigates to the post detail page.
 */
export function CommentSection({ post }: { post: Post }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  // Only fetch replies when the section is expanded — avoids one request per
  // post in the feed. The collapsed "N comments" label uses the post's
  // already-fetched `_counts.replies` so no extra request is needed there.
  const { data, isLoading } = useReplies(open ? post.id : null);
  const createMut = useCreatePost();
  const { data: session } = useSession();
  const me = session?.user;

  const replies = data?.replies ?? [];
  const count = post._counts.replies;

  // Auto-scroll to bottom when new comments arrive or when the section opens.
  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [replies.length, open]);

  const submit = () => {
    const content = text.trim();
    if (!content) return;
    if (!me) {
      toast.error("Sign in to comment");
      return;
    }
    createMut.mutate(
      { content, parentId: post.id },
      {
        onSuccess: () => setText(""),
        onError: (e) => toast.error(e.message || "Couldn't post comment"),
      }
    );
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div
      className="mt-1"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Collapsed: "N comments" toggle (always shown — even with 0 comments,
          users can click to expand and add the first one). */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground hover:underline tap-highlight-none"
        aria-expanded={open}
      >
        <MessageCircle className="h-3.5 w-3.5" />
        {count === 0 ? "No comments" : `${count} ${count === 1 ? "comment" : "comments"}`}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-2">
              {/* Comments list — scrolls within itself when there are many.
                  Newest at the bottom (matches the API's createdAt asc order). */}
              <div
                ref={listRef}
                className="max-h-[340px] overflow-y-auto scrollbar-thin pr-1"
              >
                {isLoading ? (
                  <p className="py-3 text-center text-[13px] text-muted-foreground">
                    Loading comments…
                  </p>
                ) : replies.length === 0 ? (
                  <p className="py-3 text-center text-[13px] text-muted-foreground">
                    Be the first to comment.
                  </p>
                ) : (
                  replies.map((r) => <CommentRow key={r.id} reply={r} />)
                )}
              </div>

              {/* Input — always visible at the bottom of the section when
                  signed in. Press Enter to post; Shift+Enter for newline. */}
              {me && (
                <div className="sticky bottom-0 mt-1 flex items-end gap-2 border-t border-border bg-background/95 px-1 py-2 backdrop-blur-sm">
                  <UserAvatar
                    name={me.name}
                    username={me.username}
                    avatarUrl={me.avatarUrl}
                    size={32}
                    className="shrink-0"
                  />
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={onKey}
                    rows={1}
                    placeholder="Write a comment…"
                    className="max-h-24 min-h-[36px] flex-1 resize-none rounded-full border border-border bg-secondary/40 px-3.5 py-2 text-[14px] outline-none transition placeholder:text-muted-foreground focus:border-foreground/30 focus:bg-background"
                  />
                  <button
                    onClick={submit}
                    disabled={!text.trim() || createMut.isPending}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 tap-highlight-none press-down"
                    aria-label="Send comment"
                  >
                    <Send className="h-[16px] w-[16px]" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
