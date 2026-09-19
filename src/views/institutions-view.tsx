"use client";

import { useState } from "react";
import { Plus, Search, Building2, Lock, X, Sparkles, MapPin, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp, useInstitutionsSearch, useCreateInstitution, useUploadFile, useSession } from "@/lib/hooks";
import { InstitutionCard } from "@/components/institution-card";
import { LoadingState, EmptyState } from "@/components/view-helpers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const TYPES = [
  { value: "school", label: "School" },
  { value: "college", label: "College" },
  { value: "university", label: "University" },
  { value: "institute", label: "Institute" },
] as const;

export function InstitutionsView() {
  const { nav } = useApp();
  const { data: session } = useSession();
  const [q, setQ] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const list = useInstitutionsSearch(q);
  const institutions = list.data?.institutions ?? [];

  return (
    <div className="w-full">
      <div className="sticky top-14 z-20 lg:top-0 border-b border-border bg-background/80 backdrop-blur-md lg:top-0">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-[18px] font-bold">Schools</h1>
          <Button size="sm" className="rounded-full" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> Add school
          </Button>
        </div>
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-2 focus-within:bg-background">
            <Search className="h-[18px] w-[18px] text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search schools, colleges, universities…"
              className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
            />
            {q && (
              <button onClick={() => setQ("")} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {list.isLoading ? (
        <LoadingState />
      ) : institutions.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={q ? "No schools found" : "No schools yet"}
          description={q ? `No schools match "${q}".` : "Add your school so classmates can find and join it."}
          action={
            <Button className="rounded-full" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Add your school
            </Button>
          }
          className="py-16"
        />
      ) : (
        <div className="divide-y divide-border">
          {institutions.map((i) => (
            <InstitutionCard key={i.id} institution={i} onClick={() => nav({ name: "institution", handle: i.handle })} showJoin />
          ))}
        </div>
      )}

      <div className="h-20" />

      <CreateInstitutionDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function CreateInstitutionDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { nav } = useApp();
  const createMut = useCreateInstitution();
  const uploadMut = useUploadFile();
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [type, setType] = useState<string>("university");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  const reset = () => {
    setName(""); setHandle(""); setType("university"); setBio(""); setLocation(""); setWebsite(""); setIsPrivate(false); setLogoUrl(null); setCoverUrl(null);
  };

  const upload = async (file: File, setter: (u: string) => void) => {
    try {
      const r = await uploadMut.mutateAsync(file);
      setter(r.url);
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    }
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
        type,
        bio: bio.trim() || undefined,
        location: location.trim() || undefined,
        website: website.trim() || undefined,
        isPrivate,
        logoUrl,
        coverUrl,
      },
      {
        onSuccess: (data) => {
          toast.success("School added");
          reset();
          onOpenChange(false);
          nav({ name: "institution", handle: data.institution.handle });
        },
        onError: (e) => toast.error(e.message || "Couldn't create institution"),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent showCloseButton={false} className="max-w-md rounded-2xl border-border p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <DialogTitle className="text-[15px] font-semibold">Add your school</DialogTitle>
          <button onClick={() => onOpenChange(false)} className="rounded-full p-1.5 text-muted-foreground hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>
        <DialogDescription className="sr-only">Create a new school, college, or university</DialogDescription>
        <div className="max-h-[72vh] overflow-y-auto scrollbar-thin p-4">
          {/* Cover */}
          <label className="mb-3 block cursor-pointer">
            <div className="relative h-24 w-full overflow-hidden rounded-xl border-2 border-dashed border-border bg-secondary/40 transition hover:border-foreground/40">
              {coverUrl ? (
                 
                <img src={coverUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">Cover image (optional)</div>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, setCoverUrl); e.target.value = ""; }}
              />
            </div>
          </label>

          {/* Logo */}
          <div className="mb-4 flex items-center gap-3">
            <label className="flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-secondary/40 transition hover:border-foreground/40">
              {logoUrl ? (
                 
                <img src={logoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <Building2 className="h-6 w-6 text-muted-foreground" />
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, setLogoUrl); e.target.value = ""; }}
              />
            </label>
            <div className="text-[13px] text-muted-foreground">
              <p className="font-medium text-foreground">Logo</p>
              <p>Optional · square image</p>
            </div>
          </div>

          <label className="mb-1.5 block text-[13px] font-medium text-muted-foreground">Name</label>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!handle || handle === slugifyPrev(name)) setHandle(slugify(e.target.value));
            }}
            placeholder="Northbridge University"
            className="auth-input mb-3"
          />

          <label className="mb-1.5 block text-[13px] font-medium text-muted-foreground">Handle</label>
          <div className="mb-1 flex items-center rounded-xl border border-border bg-background px-3">
            <span className="text-muted-foreground">@</span>
            <input
              value={handle}
              onChange={(e) => setHandle(slugify(e.target.value))}
              placeholder="northbridge"
              className="w-full bg-transparent py-2.5 text-[15px] outline-none"
            />
          </div>
          <p className="mb-3 text-[12px] text-muted-foreground">Lowercase letters and numbers only.</p>

          <label className="mb-1.5 block text-[13px] font-medium text-muted-foreground">Type</label>
          <div className="mb-3 flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={cn("rounded-full border px-3 py-1.5 text-[13px] font-medium transition", type === t.value ? "border-foreground bg-secondary" : "border-border hover:bg-accent")}
              >
                {t.label}
              </button>
            ))}
          </div>

          <label className="mb-1.5 block text-[13px] font-medium text-muted-foreground">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A short description of the school"
            rows={2}
            className="auth-input mb-3 resize-none"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-muted-foreground">Location</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Boston, MA" className="auth-input" />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-muted-foreground">Website</label>
              <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="school.edu" className="auth-input" />
            </div>
          </div>

          <label className="mt-3 flex items-center gap-2.5 rounded-xl border border-border px-3 py-2.5">
            <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="h-4 w-4 accent-foreground" />
            <div>
              <p className="text-[14px] font-medium">Private school feed</p>
              <p className="text-[12px] text-muted-foreground">Only members can see posts</p>
            </div>
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
          <Button variant="secondary" className="rounded-full" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="rounded-full" disabled={createMut.isPending || !name.trim()} onClick={submit}>
            {createMut.isPending ? "Creating…" : "Create"}
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
