"use client";

import { useRef, useState } from "react";
import { ImagePlus, Hash, Globe, Lock, X, Loader2, Video, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp, useCreatePost, useSession, useUploadFile, useInstitutionsSearch, useCommunitiesSearch } from "@/lib/hooks";
import type { ComposeState } from "@/lib/store";
import type { MediaItem } from "@/lib/hooks";
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
const MAX_MEDIA = 4;

export function ComposeBox() {
  const { compose, closeCompose } = useApp();
  return (
    <Dialog open={compose.open} onOpenChange={(o) => !o && closeCompose()}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[92vh] w-full max-w-xl flex-col gap-0 overflow-hidden rounded-2xl border-border bg-background p-0 sm:rounded-3xl"
      >
        {compose.open && <ComposeBody key={(compose.replyTo?.id ?? "new") + (compose.scope?.kind ?? "")} compose={compose} onClose={closeCompose} />}
      </DialogContent>
    </Dialog>
  );
}

function ComposeBody({ compose, onClose }: { compose: ComposeState; onClose: () => void }) {
  const { data: session } = useSession();
  const createMut = useCreatePost();
  const uploadMut = useUploadFile();
  const instQuery = useInstitutionsSearch("");
  const commQuery = useCommunitiesSearch("", true);

  const [text, setText] = useState(compose.prefillText ?? "");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [scope, setScope] = useState<ComposeState["scope"]>(compose.scope ?? null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          kind: "institution" as const,
        },
      ]
    : [];

  const memberInstitutions =
    (instQuery.data?.institutions ?? [])
      .filter((i) => i.isMember && !myInstitutions.some((m) => m.id === i.id))
      .map((i) => ({ id: i.id, name: i.name, handle: i.handle, isPrivate: i.isPrivate, kind: "institution" as const })) ?? [];

  const myCommunities =
    (commQuery.data?.communities ?? [])
      .filter((c) => c.isMember)
      .map((c) => ({ id: c.id, name: c.name, handle: c.handle, isPrivate: c.isPrivate, kind: "community" as const })) ?? [];

  const allScopes = [...myInstitutions, ...memberInstitutions, ...myCommunities];
  const chosenScope = allScopes.find((s) => s.id === scope?.kind && scope?.kind === s.kind && (scope as any).id === s.id)
    ?? allScopes.find((s) => s.id === (scope as any)?.id);

  const handlePickFiles = () => fileInputRef.current?.click();

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const slots = MAX_MEDIA - media.length;
    if (slots <= 0) {
      toast.message(`Up to ${MAX_MEDIA} media items`);
      return;
    }
    const toUpload = Array.from(files).slice(0, slots);
    for (const file of toUpload) {
      try {
        const result = await uploadMut.mutateAsync(file);
        setMedia((prev) => [...prev, { url: result.url, type: result.type }]);
      } catch (e: any) {
        toast.error(e.message || `Couldn't upload ${file.name}`);
      }
    }
  };

  const handleSubmit = () => {
    if ((!text.trim() && media.length === 0) || createMut.isPending) return;
    const tags = (text.match(/#[\w]+/g) ?? []).map((t) => t.slice(1).toLowerCase());
    const institutionId = !isReply && scope?.kind === "institution" ? scope.id : null;
    const communityId = !isReply && scope?.kind === "community" ? scope.id : null;
    createMut.mutate(
      {
        content: text.trim(),
        media: media.length ? media : undefined,
        tags: tags.length ? Array.from(new Set(tags)).join(",") : null,
        institutionId,
        communityId,
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
  const uploading = uploadMut.isPending;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

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
          disabled={(!text.trim() && media.length === 0) || createMut.isPending}
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
      <div className="flex min-h-0 flex-1 gap-3 overflow-y-auto scrollbar-thin px-4 py-4 sm:px-5">
        <div className="shrink-0">
          <UserAvatar
            name={session?.user?.name ?? "You"}
            username={session?.user?.username}
            avatarUrl={session?.user?.avatarUrl}
            size={44}
          />
        </div>
        <div className="min-h-0 flex-1">
          <textarea
            ref={focusRef}
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX))}
            placeholder={isReply ? "Write your reply…" : "What's new?"}
            className="min-h-[140px] w-full resize-none bg-transparent text-[17px] leading-[1.5] outline-none placeholder:text-muted-foreground"
          />

          {media.length > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {media.map((m, i) => (
                <div key={i} className="group/media relative aspect-square overflow-hidden rounded-xl border border-border bg-secondary">
                  {m.type === "video" ? (
                    <video src={m.url} className="h-full w-full object-cover" muted playsInline />
                  ) : (
                    <img src={m.url} alt="" className="h-full w-full object-cover" />
                  )}
                  <button
                    onClick={() => setMedia((p) => p.filter((_, idx) => idx !== i))}
                    className="absolute right-1.5 top-1.5 rounded-full bg-background/85 p-1 text-foreground shadow-sm backdrop-blur transition hover:bg-background"
                    aria-label="Remove media"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  {m.type === "video" && (
                    <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full bg-background/85 px-1.5 py-0.5 text-[10px] font-medium text-foreground backdrop-blur">
                      <Film className="h-3 w-3" /> Video
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Empty drop area — clear affordance for uploads */}
          {media.length === 0 && (
            <button
              onClick={handlePickFiles}
              disabled={uploading}
              type="button"
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-secondary/30 px-4 py-5 text-[13px] font-medium text-muted-foreground transition hover:border-foreground/30 hover:bg-secondary hover:text-foreground"
            >
              {uploading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</>
              ) : (
                <><ImagePlus className="h-4 w-4" /> Add photo or video</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between border-t border-border px-3 py-2.5 sm:px-4">
        <div className="flex items-center gap-0.5">
          {/* Upload — only show the icon-button when media already exist (otherwise use the empty drop area above) */}
          {media.length > 0 && (
            <button
              onClick={handlePickFiles}
              disabled={uploading || media.length >= MAX_MEDIA}
              className="rounded-full p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:opacity-40"
              aria-label="Add image or video"
            >
              {uploading ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <ImagePlus className="h-[18px] w-[18px]" />}
            </button>
          )}
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
            className="rounded-full p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            aria-label="Add hashtag"
          >
            <Hash className="h-[18px] w-[18px]" />
          </button>

          {!isReply && allScopes.length > 0 && (
            <>
              <span className="mx-1 h-5 w-px bg-border" aria-hidden />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[13px] font-medium transition hover:bg-accent",
                      chosenScope ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {chosenScope ? (
                      <>
                        {chosenScope.isPrivate ? <Lock className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
                        <span className="max-w-[110px] truncate">{chosenScope.name}</span>
                      </>
                    ) : (
                      <>
                        <Globe className="h-3.5 w-3.5" /> Public
                      </>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setScope({ kind: "public" })}>
                    <Globe className="mr-2 h-4 w-4" /> Public timeline
                  </DropdownMenuItem>
                  {myInstitutions.map((s) => (
                    <DropdownMenuItem key={`i-${s.id}`} onClick={() => setScope({ kind: "institution", id: s.id })}>
                      {s.isPrivate ? <Lock className="mr-2 h-4 w-4" /> : <Globe className="mr-2 h-4 w-4" />}
                      <span className="truncate">{s.name}</span>
                    </DropdownMenuItem>
                  ))}
                  {memberInstitutions.map((s) => (
                    <DropdownMenuItem key={`im-${s.id}`} onClick={() => setScope({ kind: "institution", id: s.id })}>
                      {s.isPrivate ? <Lock className="mr-2 h-4 w-4" /> : <Globe className="mr-2 h-4 w-4" />}
                      <span className="truncate">{s.name}</span>
                    </DropdownMenuItem>
                  ))}
                  {myCommunities.map((s) => (
                    <DropdownMenuItem key={`c-${s.id}`} onClick={() => setScope({ kind: "community", id: s.id })}>
                      {s.isPrivate ? <Lock className="mr-2 h-4 w-4" /> : <Globe className="mr-2 h-4 w-4" />}
                      <span className="truncate">{s.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {media.length > 0 && (
            <span className="text-[12px] tabular-nums text-muted-foreground">{media.length}/{MAX_MEDIA}</span>
          )}
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
