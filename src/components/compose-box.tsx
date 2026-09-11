"use client";

import { useRef, useState } from "react";
import { ImagePlus, Hash, Globe, Lock, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp, useCreatePost, useSession, useInstitutionsSearch } from "@/lib/hooks";
import type { ComposeState } from "@/lib/store";
import { UserAvatar } from "./user-avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const MAX = 500;

const sampleImages = [
  "https://picsum.photos/seed/scholar-a/800/800",
  "https://picsum.photos/seed/scholar-b/800/800",
  "https://picsum.photos/seed/scholar-c/800/800",
  "https://picsum.photos/seed/scholar-d/800/800",
];

export function ComposeBox() {
  const { compose, closeCompose } = useApp();
  return (
    <Dialog open={compose.open} onOpenChange={(o) => !o && closeCompose()}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[92vh] w-full max-w-xl flex-col gap-0 overflow-hidden rounded-2xl border-border bg-background p-0 sm:rounded-3xl"
      >
        {/* Remount the body each open so useState initializers run fresh */}
        {compose.open && <ComposeBody key={compose.replyTo?.id ?? "new"} compose={compose} onClose={closeCompose} />}
      </DialogContent>
    </Dialog>
  );
}

function ComposeBody({ compose, onClose }: { compose: ComposeState; onClose: () => void }) {
  const { data: session } = useSession();
  const createMut = useCreatePost();
  const instQuery = useInstitutionsSearch("");

  // Initialize from the compose payload (runs once per mount — we remount on each open)
  const [text, setText] = useState(compose.prefillText ?? "");
  const [images, setImages] = useState<string[]>([]);
  const [institutionId, setInstitutionId] = useState<string | null>(compose.institutionId ?? null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Autofocus via callback ref (no effect needed)
  const focusRef = (el: HTMLTextAreaElement | null) => {
    textareaRef.current = el;
    if (el) {
      requestAnimationFrame(() => {
        el.focus();
        const len = el.value.length;
        el.setSelectionRange(len, len);
      });
    }
  };

  const isReply = !!compose.replyTo;

  const myInstitutions = session?.user?.institution
    ? [
        {
          id: session.user.institution.id,
          name: session.user.institution.name,
          handle: session.user.institution.handle,
          isPrivate: session.user.institution.isPrivate,
        },
      ]
    : [];

  const memberInstitutions =
    (instQuery.data?.institutions ?? [])
      .filter((i) => i.isMember)
      .map((i) => ({ id: i.id, name: i.name, handle: i.handle, isPrivate: i.isPrivate })) ?? [];

  const allInstitutions = [...myInstitutions, ...memberInstitutions];
  const chosenInstitution = allInstitutions.find((i) => i.id === institutionId);

  const handleAddImage = () => {
    if (images.length >= 4) {
      toast.message("Up to 4 images");
      return;
    }
    const next = sampleImages[images.length % sampleImages.length];
    setImages((prev) => [...prev, `${next}?r=${Math.random().toString(36).slice(2, 6)}`]);
  };

  const handleSubmit = () => {
    if (!text.trim() || createMut.isPending) return;
    const tags = (text.match(/#[\w]+/g) ?? []).map((t) => t.slice(1).toLowerCase());
    createMut.mutate(
      {
        content: text.trim(),
        images: images.length ? images : undefined,
        tags: tags.length ? Array.from(new Set(tags)).join(",") : null,
        institutionId: isReply ? null : institutionId,
        parentId: compose.replyTo?.id ?? null,
      },
      {
        onSuccess: () => {
          toast.success(isReply ? "Reply posted" : "Post published");
          onClose();
        },
        onError: () => toast.error("Couldn't post. Try again."),
      }
    );
  };

  const remaining = MAX - text.length;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <button
          onClick={onClose}
          className="rounded-full p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <DialogTitle className="text-center text-[15px] font-semibold">
          {isReply ? "Reply" : "New post"}
        </DialogTitle>
        <Button
          onClick={handleSubmit}
          disabled={!text.trim() || createMut.isPending}
          size="sm"
          className="h-9 rounded-full bg-primary px-5 text-[13px] font-semibold text-primary-foreground disabled:opacity-40"
        >
          {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
        </Button>
      </div>
      <DialogDescription className="sr-only">
        {isReply ? "Write a reply" : "Write a new post"}
      </DialogDescription>

      {/* Reply context */}
      {isReply && compose.replyTo && (
        <div className="border-b border-border bg-muted/30 px-4 py-2 text-[13px] text-muted-foreground">
          Replying to <span className="font-medium text-primary">@{compose.replyTo.authorUsername}</span>
        </div>
      )}

      {/* Body */}
      <div className="flex min-h-0 flex-1 gap-3 overflow-y-auto scrollbar-thin px-4 py-4">
        <div className="shrink-0">
          <UserAvatar
            name={session?.user?.name ?? "You"}
            username={session?.user?.username}
            avatarUrl={session?.user?.avatarUrl}
            size={40}
          />
        </div>
        <div className="min-h-0 flex-1">
          <textarea
            ref={focusRef}
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX))}
            placeholder={isReply ? "Write your reply…" : "What's new?"}
            className="min-h-[160px] w-full resize-none bg-transparent text-[17px] leading-relaxed outline-none placeholder:text-muted-foreground"
          />

          {images.length > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {images.map((src, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-xl border border-border">
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <button
                    onClick={() => setImages((p) => p.filter((_, idx) => idx !== i))}
                    className="absolute right-1.5 top-1.5 rounded-full bg-background/80 p-1 backdrop-blur transition hover:bg-background"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between border-t border-border px-3 py-2.5">
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleAddImage}
            className="rounded-full p-2 text-muted-foreground transition hover:bg-accent hover:text-primary"
            aria-label="Add image"
          >
            <ImagePlus className="h-[18px] w-[18px]" />
          </button>
          <button
            onClick={() => {
              const t = textareaRef.current;
              if (!t) return;
              const start = t.selectionStart;
              const next = text.slice(0, start) + "#" + text.slice(start);
              setText(next);
              requestAnimationFrame(() => {
                t.focus();
                t.setSelectionRange(start + 1, start + 1);
              });
            }}
            className="rounded-full p-2 text-muted-foreground transition hover:bg-accent hover:text-primary"
            aria-label="Add hashtag"
          >
            <Hash className="h-[18px] w-[18px]" />
          </button>

          {!isReply && allInstitutions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "ml-1 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[13px] font-medium transition hover:bg-accent",
                    chosenInstitution ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {chosenInstitution ? (
                    <>
                      {chosenInstitution.isPrivate ? <Lock className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
                      <span className="max-w-[120px] truncate">{chosenInstitution.name}</span>
                    </>
                  ) : (
                    <>
                      <Globe className="h-3.5 w-3.5" /> Public
                    </>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setInstitutionId(null)}>
                  <Globe className="mr-2 h-4 w-4" /> Public timeline
                </DropdownMenuItem>
                {allInstitutions.map((i) => (
                  <DropdownMenuItem key={i.id} onClick={() => setInstitutionId(i.id)}>
                    {i.isPrivate ? <Lock className="mr-2 h-4 w-4" /> : <Globe className="mr-2 h-4 w-4" />}
                    <span className="truncate">{i.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="flex items-center gap-2">
          {text.length > 0 && (
            <div className="relative h-5 w-5">
              <svg viewBox="0 0 24 24" className="h-5 w-5 -rotate-90">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-border" />
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className={remaining < 20 ? "text-destructive" : "text-primary"}
                  strokeDasharray={2 * Math.PI * 10}
                  strokeDashoffset={2 * Math.PI * 10 * (1 - Math.min(text.length / MAX, 1))}
                />
              </svg>
            </div>
          )}
          {remaining < 40 && (
            <span className={cn("text-[13px] tabular-nums", remaining < 0 ? "text-destructive" : "text-muted-foreground")}>
              {remaining}
            </span>
          )}
        </div>
      </div>
    </>
  );
}
