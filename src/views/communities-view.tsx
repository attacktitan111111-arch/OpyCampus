"use client";

import { useState } from "react";
import { Plus, Search, Users, Lock, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp, useCommunitiesSearch, useCreateCommunity, useUploadFile, useSession } from "@/lib/hooks";
import { UserAvatar, VerifiedBadge } from "@/components/user-avatar";
import { LoadingState, EmptyState } from "@/components/view-helpers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "study", label: "Study group" },
  { value: "club", label: "Club" },
  { value: "hobby", label: "Hobby" },
  { value: "course", label: "Course" },
  { value: "project", label: "Project" },
  { value: "other", label: "Other" },
] as const;

export function CommunitiesView() {
  const { nav } = useApp();
  const { data: session } = useSession();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | "mine">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const all = useCommunitiesSearch(q, false);
  const mine = useCommunitiesSearch(q, true);
  const data = tab === "mine" ? mine : all;

  const communities = data.data?.communities ?? [];

  return (
    <div className="w-full">
      <div className="lg:sticky lg:top-0 lg:z-10 border-b border-border bg-background/80 backdrop-blur-md lg:top-0">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-[18px] font-bold">Groups</h1>
          <Button size="sm" className="rounded-full" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> Create
          </Button>
        </div>
        {/* search */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-2 focus-within:bg-background">
            <Search className="h-[18px] w-[18px] text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Find a group…"
              className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
            />
            {q && (
              <button onClick={() => setQ("")} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        {/* tabs */}
        <div className="flex">
          {(["all", "mine"] as const).map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "relative flex flex-1 items-center justify-center gap-1.5 py-3 text-[14px] font-semibold transition-colors",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t === "all" ? "Discover" : "My groups"}
                {active && <span className="absolute inset-x-0 -bottom-px mx-auto h-[3px] w-10 rounded-full bg-primary" />}
              </button>
            );
          })}
        </div>
      </div>

      {data.isLoading ? (
        <LoadingState />
      ) : communities.length === 0 ? (
        tab === "mine" ? (
          <EmptyState
            icon={Users}
            title="You haven't joined any groups yet"
            description="Discover study groups, clubs, and course communities — or create your own."
            action={
              <div className="flex gap-2">
                <Button variant="secondary" className="rounded-full" onClick={() => setTab("all")}>
                  Discover
                </Button>
                <Button className="rounded-full" onClick={() => setCreateOpen(true)}>
                  <Plus className="mr-1.5 h-4 w-4" /> Create
                </Button>
              </div>
            }
            className="py-16"
          />
        ) : (
          <EmptyState
            icon={Users}
            title="No groups found"
            description={q ? `No groups match "${q}".` : "Be the first to create a group."}
            action={
              <Button className="rounded-full" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" /> Create a group
              </Button>
            }
            className="py-16"
          />
        )
      ) : (
        <div className="divide-y divide-border">
          {communities.map((c) => (
            <CommunityRow key={c.id} community={c} onClick={() => nav({ name: "community", handle: c.handle })} />
          ))}
        </div>
      )}

      <div className="h-20" />

      <CreateCommunityDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function CommunityRow({ community, onClick }: { community: any; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted/40 sm:px-5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
        {community.iconUrl ? (
           
          <img src={community.iconUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <Users className="h-5 w-5 text-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 truncate">
          {community.isPrivate && <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
          <span className="truncate font-semibold text-[15px]">{community.name}</span>
        </div>
        {community.description && <p className="line-clamp-1 text-[13px] text-muted-foreground">{community.description}</p>}
        <p className="mt-0.5 text-[12px] text-muted-foreground capitalize">{community.category} · {community._counts.members} members</p>
      </div>
      <span className={cn("rounded-full px-3 py-1 text-[12px] font-medium", community.isMember ? "bg-secondary text-foreground" : "bg-primary text-primary-foreground")}>
        {community.isMember ? "Joined" : "View"}
      </span>
    </button>
  );
}

function CreateCommunityDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { nav } = useApp();
  const createMut = useCreateCommunity();
  const uploadMut = useUploadFile();
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("study");
  const [isPrivate, setIsPrivate] = useState(false);
  const [iconUrl, setIconUrl] = useState<string | null>(null);

  const reset = () => {
    setName("");
    setHandle("");
    setDescription("");
    setCategory("study");
    setIsPrivate(false);
    setIconUrl(null);
  };

  const submit = () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    createMut.mutate(
      {
        name: name.trim(),
        handle: handle.trim() || name.trim(),
        description: description.trim() || undefined,
        category,
        isPrivate,
        iconUrl,
      },
      {
        onSuccess: (data) => {
          toast.success("Group created");
          reset();
          onOpenChange(false);
          nav({ name: "community", handle: data.community.handle });
        },
        onError: (e) => toast.error(e.message || "Couldn't create group"),
      }
    );
  };

  const onPickIcon = async (file: File) => {
    try {
      const r = await uploadMut.mutateAsync(file);
      setIconUrl(r.url);
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent showCloseButton={false} className="max-w-md rounded-2xl border-border p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <DialogTitle className="text-[15px] font-semibold">Create a group</DialogTitle>
          <button onClick={() => onOpenChange(false)} className="rounded-full p-1.5 text-muted-foreground hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>
        <DialogDescription className="sr-only">Create a new community or study group</DialogDescription>
        <div className="max-h-[70vh] overflow-y-auto scrollbar-thin p-4">
          {/* icon picker */}
          <div className="mb-4 flex items-center gap-3">
            <label className="flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-secondary/40 transition hover:border-foreground/40">
              {iconUrl ? (
                 
                <img src={iconUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <Sparkles className="h-6 w-6 text-muted-foreground" />
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onPickIcon(f);
                  e.target.value = "";
                }}
              />
            </label>
            <div className="text-[13px] text-muted-foreground">
              <p className="font-medium text-foreground">Group icon</p>
              <p>Optional · JPG, PNG, WEBP</p>
            </div>
          </div>

          <label className="mb-1.5 block text-[13px] font-medium text-muted-foreground">Name</label>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!handle || handle === slugifyPrev(name)) setHandle(slugify(e.target.value));
            }}
            placeholder="Algorithms Study Group"
            className="auth-input mb-3"
          />

          <label className="mb-1.5 block text-[13px] font-medium text-muted-foreground">Handle</label>
          <div className="mb-1 flex items-center rounded-xl border border-border bg-background px-3">
            <span className="text-muted-foreground">@</span>
            <input
              value={handle}
              onChange={(e) => setHandle(slugify(e.target.value))}
              placeholder="algo-study"
              className="w-full bg-transparent py-2.5 text-[15px] outline-none"
            />
          </div>
          <p className="mb-3 text-[12px] text-muted-foreground">Lowercase letters and numbers only.</p>

          <label className="mb-1.5 block text-[13px] font-medium text-muted-foreground">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this group about?"
            rows={2}
            className="auth-input mb-3 resize-none"
          />

          <label className="mb-1.5 block text-[13px] font-medium text-muted-foreground">Category</label>
          <div className="mb-3 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[13px] font-medium transition",
                  category === c.value ? "border-foreground bg-secondary" : "border-border hover:bg-accent"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2.5 rounded-xl border border-border px-3 py-2.5">
            <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="h-4 w-4 accent-foreground" />
            <div>
              <p className="text-[14px] font-medium">Private group</p>
              <p className="text-[12px] text-muted-foreground">Only members can see posts</p>
            </div>
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
          <Button variant="secondary" className="rounded-full" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="rounded-full" disabled={createMut.isPending || !name.trim()} onClick={submit}>
            {createMut.isPending ? "Creating…" : "Create group"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "").slice(0, 24);
}
function slugifyPrev(s: string) {
  return slugify(s);
}
