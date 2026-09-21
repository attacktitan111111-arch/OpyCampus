"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send, MessageCircle, Phone, Video, Paperclip, Image as ImageIcon, Smile, X, Mic, FileText, Play, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp, useConversationMessages, useSendMessage, useUploadFile, type MessageItem } from "@/lib/hooks";
import { UserAvatar, VerifiedBadge } from "@/components/user-avatar";
import { EmptyState, InlineSpinner } from "@/components/view-helpers";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const EMOJIS = ["😀","😂","🥰","😍","😎","🤔","😢","😡","👍","👎","❤️","🔥","✨","🎉","💯","🙏","👋","💪","🤝","📚","✏️","🎓","💡","⭐","🌟","💫","📝","✅","❌","💭","💬","📷","🎥","🎵","🎮","⚽","🏀","🎨","🔬","🧮"];

export function ConversationView({ id }: { id: string }) {
  const { back, nav } = useApp();
  const { data, isLoading, isError } = useConversationMessages(id);
  const sendMut = useSendMessage();
  const uploadMut = useUploadFile();
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<{ url: string; type: string; name?: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const other = data?.conversation.other ?? null;
  const messages = data?.messages ?? [];

  // Auto-scroll on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, id]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 100) + "px";
  }, [text]);

  const handleSend = useCallback(() => {
    const content = text.trim();
    if ((!content && pendingMedia.length === 0) || sendMut.isPending) return;
    setText("");
    setPendingMedia([]);
    setShowEmoji(false);
    sendMut.mutate(
      { id, content, media: pendingMedia.length ? pendingMedia : undefined },
      {
        onError: (e) => {
          setText(content);
          setPendingMedia(pendingMedia);
          toast.error(e.message || "Couldn't send message");
        },
      }
    );
  }, [text, pendingMedia, sendMut, id]);

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFiles = async (files: FileList | null, type: "image" | "file") => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const slots = 4 - pendingMedia.length;
    const toUpload = Array.from(files).slice(0, slots);
    for (const file of toUpload) {
      try {
        const result = await uploadMut.mutateAsync(file);
        const mediaType = result.type === "video" ? "video" : type === "file" && file.type.startsWith("audio/") ? "audio" : type === "file" ? "file" : "image";
        setPendingMedia((prev) => [...prev, { url: result.url, type: mediaType, name: file.name }]);
      } catch (e: any) {
        toast.error(e.message || `Couldn't upload ${file.name}`);
      }
    }
    setUploading(false);
  };

  const insertEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <ConvHeader other={null} back={back} nav={nav} loading />
        <div className="flex-1 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-foreground" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <ConvHeader other={null} back={back} nav={nav} />
        <EmptyState icon={MessageCircle} title="Conversation not found" description="This conversation may have been removed." className="py-20" action={<Button variant="secondary" className="rounded-full" onClick={() => nav({ name: "messages" })}>Back to messages</Button>} />
      </div>
    );
  }

  return (
    // ─── WhatsApp-style layout ───
    // Full-screen fixed overlay — starts from top:0, includes safe area padding in the header
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* ─── HEADER: always fixed at top, never moves ─── */}
      <ConvHeader other={other} back={back} nav={nav} />

      {/* ─── MESSAGES: flex-1, scrolls internally ─── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin px-3 py-3">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[15px] font-semibold">Start messaging</p>
              <p className="mt-1 text-[13px] text-muted-foreground">Send a message{other ? ` to ${other.name}` : ""}.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {messages.map((m, i) => {
              const prev = messages[i - 1];
              const grouped = prev && prev.senderId === m.senderId && (new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60 * 1000);
              return <MessageBubble key={m.id} message={m} grouped={!!grouped} otherAvatar={other?.avatarUrl} otherName={other?.name ?? ""} otherUsername={other?.username ?? ""} />;
            })}
          </div>
        )}
      </div>

      {/* ─── PENDING MEDIA PREVIEW ─── */}
      {pendingMedia.length > 0 && (
        <div className="shrink-0 border-t border-border bg-secondary/30 px-3 py-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {pendingMedia.map((m, i) => (
              <div key={i} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-background">
                {m.type === "image" ? <img src={m.url} alt="" className="h-full w-full object-cover" />
                : m.type === "video" ? <div className="flex h-full w-full items-center justify-center bg-secondary"><Play className="h-5 w-5" /></div>
                : m.type === "audio" ? <div className="flex h-full w-full items-center justify-center bg-secondary"><Mic className="h-5 w-5" /></div>
                : <div className="flex h-full w-full items-center justify-center bg-secondary"><FileText className="h-5 w-5" /></div>}
                <button onClick={() => setPendingMedia((prev) => prev.filter((_, idx) => idx !== i))} className="absolute right-0.5 top-0.5 rounded-full bg-background/80 p-0.5"><X className="h-3 w-3" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── EMOJI PICKER ─── */}
      {showEmoji && (
        <div className="shrink-0 border-t border-border bg-background p-2">
          <div className="grid grid-cols-8 gap-1">
            {EMOJIS.map((e, i) => (
              <button key={i} onClick={() => insertEmoji(e)} className="rounded-lg p-1.5 text-xl transition hover:bg-accent tap-highlight-none">{e}</button>
            ))}
          </div>
        </div>
      )}

      {/* Hidden file inputs */}
      <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" multiple className="hidden" onChange={(e) => { handleFiles(e.target.files, "image"); e.target.value = ""; }} />
      <input ref={fileInputRef} type="file" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt" multiple className="hidden" onChange={(e) => { handleFiles(e.target.files, "file"); e.target.value = ""; }} />

      {/* ─── COMPOSER: fixed at the very bottom, always visible ─── */}
      <div className="shrink-0 border-t border-border bg-background px-2 py-2" style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom, 0px))" }}>
        <div className="flex items-end gap-1.5">
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading || pendingMedia.length >= 4} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:opacity-40 tap-highlight-none" aria-label="Attach file">
            {uploading ? <InlineSpinner className="h-5 w-5" /> : <Paperclip className="h-[19px] w-[19px]" />}
          </button>
          <button onClick={() => imageInputRef.current?.click()} disabled={uploading || pendingMedia.length >= 4} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:opacity-40 tap-highlight-none" aria-label="Attach photo or video">
            <ImageIcon className="h-[19px] w-[19px]" />
          </button>
          <div className="flex flex-1 items-end gap-1 rounded-2xl border border-border bg-secondary/50 px-3 py-1.5">
            <textarea ref={textareaRef} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKey} rows={1} placeholder="Message…" className="max-h-[100px] min-h-[24px] flex-1 resize-none bg-transparent text-[15px] leading-[1.4] outline-none placeholder:text-muted-foreground" />
            <button onClick={() => setShowEmoji((s) => !s)} className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground tap-highlight-none" aria-label="Emoji"><Smile className="h-[18px] w-[18px]" /></button>
          </div>
          <button onClick={handleSend} disabled={(!text.trim() && pendingMedia.length === 0) || sendMut.isPending} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed tap-highlight-none" aria-label="Send"><Send className="h-[18px] w-[18px]" /></button>
        </div>
      </div>
    </div>
  );
}

// ─── Header — fixed at top, never moves ───
function ConvHeader({ other, back, nav, loading }: { other: any; back: () => void; nav: any; loading?: boolean }) {
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-border bg-background px-2 py-2" style={{ paddingTop: "calc(0.5rem + env(safe-area-inset-top, 0px))" }}>
      {/* Back button — always visible */}
      <button onClick={back} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground transition hover:bg-accent tap-highlight-none" aria-label="Back">
        <ArrowLeft className="h-5 w-5" />
      </button>
      {other ? (
        <button onClick={() => nav({ name: "profile", username: other.username })} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
          <UserAvatar name={other.name} username={other.username} avatarUrl={other.avatarUrl} size={36} />
          <div className="min-w-0">
            <div className="flex items-center gap-1 truncate">
              <span className="truncate text-[15px] font-semibold leading-tight">{other.name}</span>
              {other.verified && <VerifiedBadge className="h-4 w-4 text-primary shrink-0" />}
            </div>
            <p className="truncate text-[12px] text-muted-foreground">@{other.username}</p>
          </div>
        </button>
      ) : (
        <div className="min-w-0 flex-1"><p className="truncate text-[15px] font-semibold leading-tight">{loading ? "Loading…" : "Conversation"}</p></div>
      )}
      <div className="flex shrink-0 items-center gap-0.5">
        <button onClick={() => toast.info("Audio calling coming soon")} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-emerald-500 tap-highlight-none" aria-label="Audio call"><Phone className="h-[18px] w-[18px]" /></button>
        <button onClick={() => toast.info("Video calling coming soon")} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-sky-500 tap-highlight-none" aria-label="Video call"><Video className="h-[19px] w-[19px]" /></button>
      </div>
    </div>
  );
}

// ─── Message bubble ───
function MessageBubble({ message, grouped, otherAvatar, otherName, otherUsername }: { message: MessageItem; grouped: boolean; otherAvatar?: string | null; otherName: string; otherUsername: string }) {
  const { isMe, content, media } = message;
  const hasMedia = media && media.length > 0;
  const hasText = content.trim().length > 0;

  return (
    <div className={cn("flex w-full items-end gap-1.5", isMe ? "justify-end" : "justify-start", grouped ? "mt-0.5" : "mt-2")}>
      {!isMe && !grouped && <UserAvatar name={otherName} username={otherUsername} avatarUrl={otherAvatar} size={28} className="mb-0.5 shrink-0" />}
      {!isMe && grouped && <div className="w-7 shrink-0" />}
      <div className={cn("flex min-w-0 max-w-[78%] flex-col gap-1", isMe ? "items-end" : "items-start")}>
        {hasMedia && (
          <div className={cn("grid gap-1 overflow-hidden rounded-2xl", media.length === 1 ? "grid-cols-1" : "grid-cols-2")}>
            {media.map((m, i) => (
              <div key={i} className={cn("overflow-hidden rounded-xl", media.length === 1 ? "max-w-[260px]" : "")}>
                {m.type === "image" ? <img src={m.url} alt="" className="max-h-[240px] w-full object-cover" loading="lazy" />
                : m.type === "video" ? <video src={m.url} controls playsInline preload="metadata" className="max-h-[240px] w-full object-cover" />
                : m.type === "audio" ? (
                  <div className="flex items-center gap-2 rounded-xl bg-secondary p-3">
                    <button className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"><Play className="h-4 w-4" /></button>
                    <div className="flex-1"><div className="h-1 rounded-full bg-border"><div className="h-1 w-1/3 rounded-full bg-primary" /></div><p className="mt-1 text-[11px] text-muted-foreground">{m.name ?? "Audio message"}</p></div>
                  </div>
                ) : (
                  <a href={m.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl bg-secondary p-3 transition hover:bg-accent">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-medium">{m.name ?? "File"}</p><p className="text-[11px] text-muted-foreground">Tap to download</p></div>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
        {hasText && (
          <div className={cn("whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[15px] leading-[1.4] text-pretty", isMe ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground", hasMedia && "rounded-lg text-[14px]")}>
            {content}
          </div>
        )}
      </div>
    </div>
  );
}
