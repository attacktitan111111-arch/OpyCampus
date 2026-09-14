"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp, useConversationMessages, useSendMessage } from "@/lib/hooks";
import { UserAvatar, VerifiedBadge } from "@/components/user-avatar";
import { LoadingState, EmptyState } from "@/components/view-helpers";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ConversationView({ id }: { id: string }) {
  const { back, nav } = useApp();
  const { data, isLoading, isError } = useConversationMessages(id);
  const sendMut = useSendMessage();
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const other = data?.conversation.other ?? null;
  const messages = data?.messages ?? [];

  // Auto-scroll on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, id]);

  const handleSend = () => {
    const content = text.trim();
    if (!content || sendMut.isPending) return;
    setText("");
    sendMut.mutate(
      { id, content },
      {
        onError: (e) => {
          // Restore the unsent text on error
          setText(content);
          toast.error(e.message || "Couldn't send message");
        },
      }
    );
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[640px]">
        <HeaderSkeleton back={back} />
        <LoadingState className="py-24" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto w-full max-w-[640px]">
        <HeaderSkeleton back={back} />
        <EmptyState
          icon={MessageCircle}
          title="Conversation not found"
          description="This conversation may have been removed."
          className="py-20"
          action={
            <Button variant="secondary" className="rounded-full" onClick={() => nav({ name: "messages" })}>
              Back to messages
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-7.5rem)] w-full max-w-[640px] flex-col lg:h-screen">
      {/* Header */}
      <div className="sticky top-14 z-20 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-2.5 backdrop-blur-md lg:top-0 lg:px-5">
        <button
          onClick={back}
          className="hidden lg:inline-flex lg:h-9 lg:w-9 lg:items-center lg:justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground tap-highlight-none"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        {other ? (
          <button
            onClick={() => nav({ name: "profile", username: other.username })}
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
          >
            <UserAvatar
              name={other.name}
              username={other.username}
              avatarUrl={other.avatarUrl}
              size={36}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1 truncate">
                <span className="truncate text-[15px] font-semibold leading-tight">{other.name}</span>
                {other.verified && <VerifiedBadge className="h-4 w-4 text-primary shrink-0" />}
              </div>
              <p className="truncate text-[12px] text-muted-foreground">@{other.username}</p>
            </div>
          </button>
        ) : (
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold leading-tight">Conversation</p>
          </div>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 sm:px-5">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[15px] font-semibold">This is the start of your conversation</p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Send the first message{other ? ` to ${other.name}` : ""}.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((m, i) => {
              const prev = messages[i - 1];
              const grouped = prev && prev.senderId === m.senderId && (new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60 * 1000);
              return (
                <MessageBubble key={m.id} content={m.content} isMe={m.isMe} createdAt={m.createdAt} grouped={!!grouped} />
              );
            })}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-border bg-background/85 px-3 py-2.5 backdrop-blur-md safe-bottom sm:px-5">
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKey}
            rows={1}
            placeholder={`Message ${other?.name ?? ""}…`}
            className="max-h-32 min-h-[40px] flex-1 resize-none rounded-2xl border border-border bg-background px-3.5 py-2.5 text-[15px] outline-none transition placeholder:text-muted-foreground focus:border-foreground/30"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sendMut.isPending}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed tap-highlight-none"
            aria-label="Send"
          >
            <Send className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  content,
  isMe,
  createdAt,
  grouped,
}: {
  content: string;
  isMe: boolean;
  createdAt: string;
  grouped: boolean;
}) {
  return (
    <div className={cn("flex w-full", isMe ? "justify-end" : "justify-start", grouped ? "mt-0.5" : "mt-2.5")}>
      <div
        className={cn(
          "max-w-[78%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[15px] leading-[1.4] text-pretty",
          isMe
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md bg-secondary text-secondary-foreground"
        )}
      >
        {content}
      </div>
    </div>
  );
}

function HeaderSkeleton({ back }: { back: () => void }) {
  return (
    <div className="sticky top-14 z-20 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-2.5 backdrop-blur-md lg:top-0 lg:px-5">
      <button
        onClick={back}
        className="hidden lg:inline-flex lg:h-9 lg:w-9 lg:items-center lg:justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground tap-highlight-none"
        aria-label="Back"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <p className="text-[15px] font-semibold">Loading…</p>
    </div>
  );
}
