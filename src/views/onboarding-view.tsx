"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  Camera,
  Check,
  GraduationCap,
  Loader2,
  PartyPopper,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useApp,
  useSession,
  useUpdateProfile,
  useUploadFile,
  useInstitutionsSearch,
  useJoinInstitution,
  useExplore,
  useToggleFollow,
} from "@/lib/hooks";
import type { User } from "@/lib/hooks";
import { UserAvatar } from "@/components/user-avatar";
import { InstitutionCard } from "@/components/institution-card";
import { UserCard } from "@/components/user-card";
import { LoadingState, EmptyState } from "@/components/view-helpers";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const BIO_MAX = 160;
const TOTAL_STEPS = 5;

export function OnboardingView() {
  const { nav, openAuth } = useApp();
  const { data: session, isLoading } = useSession();
  const me = session?.user;

  if (isLoading) return <LoadingState className="py-24" />;
  if (!me) {
    return (
      <div className="mx-auto w-full max-w-[640px] px-4 py-16">
        <EmptyState
          icon={Sparkles}
          title="Sign in to continue"
          description="Create your account or sign in to set up your profile."
          action={
            <div className="flex gap-2">
              <Button className="rounded-full" onClick={() => openAuth("login")}>Sign in</Button>
              <Button variant="secondary" className="rounded-full" onClick={() => openAuth("signup")}>Create account</Button>
            </div>
          }
        />
      </div>
    );
  }

  return <OnboardingFlow key={me.id} me={me} navHome={() => nav({ name: "home" })} />;
}

function OnboardingFlow({ me, navHome }: { me: User; navHome: () => void }) {
  const updateMut = useUpdateProfile();
  const uploadMut = useUploadFile();
  const [step, setStep] = useState(0); // 0-indexed
  const [avatarUrl, setAvatarUrl] = useState<string | null>(me.avatarUrl ?? null);
  const [bio, setBio] = useState(me.bio ?? "");
  const [department, setDepartment] = useState(me.department ?? "");
  const [institutionHandle, setInstitutionHandle] = useState<string | null>(me.institution?.handle ?? null);
  const [followed, setFollowed] = useState<Set<string>>(new Set());

  const uploadAvatar = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Avatar must be an image");
      return;
    }
    try {
      const r = await uploadMut.mutateAsync(file);
      setAvatarUrl(r.url);
      await updateMut.mutateAsync({ avatarUrl: r.url });
      toast.success("Avatar updated");
    } catch (e: any) {
      toast.error(e.message || "Couldn't upload avatar");
    }
  };

  const finishBio = async () => {
    try {
      await updateMut.mutateAsync({
        bio: bio.trim(),
        department: department.trim(),
      });
    } catch (e: any) {
      toast.error(e.message || "Couldn't save");
      return;
    }
    setStep(2);
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-[640px] flex-col lg:min-h-screen">
      {/* Progress dots + skip */}
      <div className="flex items-center justify-between border-b border-border bg-background/85 px-4 py-3 backdrop-blur-md lg:px-5">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === step ? "w-6 bg-foreground" : i < step ? "w-1.5 bg-foreground/60" : "w-1.5 bg-border"
              )}
            />
          ))}
        </div>
        {step < TOTAL_STEPS - 1 && step !== 4 ? (
          <button
            onClick={() => setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1))}
            className="rounded-full px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            Skip
          </button>
        ) : (
          <span className="text-[12px] text-muted-foreground">
            Step {step + 1} of {TOTAL_STEPS}
          </span>
        )}
      </div>

      <div className="flex-1 px-4 py-8 sm:px-5">
        {step === 0 && (
          <StepWelcome
            me={me}
            avatarUrl={avatarUrl}
            uploadingAvatar={uploadMut.isPending || updateMut.isPending}
            onUpload={uploadAvatar}
            onNext={() => setStep(1)}
          />
        )}
        {step === 1 && (
          <StepBio
            bio={bio}
            setBio={setBio}
            department={department}
            setDepartment={setDepartment}
            saving={updateMut.isPending}
            onNext={finishBio}
          />
        )}
        {step === 2 && (
          <StepSchool
            institutionHandle={institutionHandle}
            onPick={setInstitutionHandle}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <StepFollow
            followed={followed}
            onToggle={setFollowed}
            onNext={() => setStep(4)}
          />
        )}
        {step === 4 && (
          <StepDone
            me={me}
            avatarUrl={avatarUrl}
            followedCount={followed.size}
            onDone={navHome}
          />
        )}
      </div>
    </div>
  );
}

// ---------- Step 1: Welcome + Avatar ----------
function StepWelcome({
  me,
  avatarUrl,
  uploadingAvatar,
  onUpload,
  onNext,
}: {
  me: any;
  avatarUrl: string | null;
  uploadingAvatar: boolean;
  onUpload: (f: File) => void;
  onNext: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 text-center animate-fade-in">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <Sparkles className="h-7 w-7 text-primary" />
      </div>
      <div>
        <h1 className="text-[24px] font-bold tracking-tight">
          Welcome{me?.name ? `, ${me.name.split(" ")[0]}` : ""}!
        </h1>
        <p className="mt-2 text-[15px] text-muted-foreground text-pretty">
          Let's set up your profile so classmates can recognize you. You can change any of this later.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <UserAvatar
            name={me?.name ?? "You"}
            username={me?.username}
            avatarUrl={avatarUrl}
            size={112}
            className="ring-4 ring-background"
          />
          <label className="absolute -bottom-1 -right-1 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition hover:bg-accent">
            {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        <p className="text-[13px] text-muted-foreground">
          {avatarUrl ? "Looking good. You can change it later." : "Tap the camera to add a photo."}
        </p>
      </div>

      <Button
        onClick={onNext}
        className="mt-2 w-full rounded-full py-3 text-[15px] font-semibold"
        size="lg"
      >
        Continue <ArrowRight className="ml-1.5 h-4 w-4" />
      </Button>
    </div>
  );
}

// ---------- Step 2: Bio + Department ----------
function StepBio({
  bio,
  setBio,
  department,
  setDepartment,
  saving,
  onNext,
}: {
  bio: string;
  setBio: (v: string) => void;
  department: string;
  setDepartment: (v: string) => void;
  saving: boolean;
  onNext: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 animate-fade-in">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight">Tell us about you</h1>
        <p className="mt-1.5 text-[14px] text-muted-foreground">
          A short bio helps classmates and teachers get to know you.
        </p>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-[13px] font-medium text-muted-foreground">Bio</label>
          <span className="text-[12px] text-muted-foreground tabular-nums">{bio.length}/{BIO_MAX}</span>
        </div>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
          placeholder="e.g. CS junior @ Northbridge · coffee enthusiast"
          rows={3}
          className="auth-input resize-none"
          maxLength={BIO_MAX}
          autoFocus
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[13px] font-medium text-muted-foreground">Department</label>
        <input
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          placeholder="e.g. Computer Science"
          className="auth-input"
        />
      </div>

      <Button
        onClick={onNext}
        disabled={saving}
        className="mt-2 w-full rounded-full py-3 text-[15px] font-semibold"
        size="lg"
      >
        {saving ? (
          <>
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Saving…
          </>
        ) : (
          <>
            Continue <ArrowRight className="ml-1.5 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
}

// ---------- Step 3: Pick your school ----------
function StepSchool({
  institutionHandle,
  onPick,
  onNext,
}: {
  institutionHandle: string | null;
  onPick: (handle: string | null) => void;
  onNext: () => void;
}) {
  const [q, setQ] = useState("");
  const list = useInstitutionsSearch(q);
  const joinMut = useJoinInstitution();
  const institutions = list.data?.institutions ?? [];

  const picked = useMemo(
    () => institutions.find((i) => i.handle === institutionHandle) ?? null,
    [institutions, institutionHandle]
  );

  const toggleJoin = (i: any) => {
    if (i.isMember) {
      onPick(i.handle);
      return;
    }
    joinMut.mutate(
      { handle: i.handle },
      {
        onSuccess: () => {
          onPick(i.handle);
          toast.success(`Joined ${i.name}`);
        },
        onError: (e) => toast.error(e.message || "Couldn't join"),
      }
    );
  };

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 animate-fade-in">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight">Find your school</h1>
        <p className="mt-1.5 text-[14px] text-muted-foreground">
          Join your school or university to see its feed and connect with classmates.
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-2.5 focus-within:bg-background">
        <Search className="h-[18px] w-[18px] text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search schools, colleges, universities…"
          className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
          autoFocus
        />
        {q && (
          <button onClick={() => setQ("")} className="text-muted-foreground hover:text-foreground" aria-label="Clear">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="max-h-[50vh] overflow-y-auto rounded-2xl border border-border scrollbar-thin">
        {list.isLoading ? (
          <LoadingState label="Searching" className="py-10" />
        ) : institutions.length === 0 ? (
          <p className="px-4 py-10 text-center text-[13px] text-muted-foreground">
            {q ? `No schools match "${q}".` : "No schools yet — you can add yours later."}
          </p>
        ) : (
          <div className="divide-y divide-border">
            {institutions.map((i) => (
              <div key={i.id} className="relative">
                <InstitutionCard
                  institution={i}
                  showJoin
                  onClick={() => onPick(i.handle)}
                />
                {(institutionHandle === i.handle || i.isMember) && (
                  <div className="pointer-events-none absolute right-4 top-3 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    <Check className="h-3 w-3" /> Selected
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Button
        onClick={onNext}
        className="mt-2 w-full rounded-full py-3 text-[15px] font-semibold"
        size="lg"
      >
        {picked ? "Continue" : institutionHandle ? "Continue" : "Skip for now"}{" "}
        <ArrowRight className="ml-1.5 h-4 w-4" />
      </Button>
    </div>
  );
}

// ---------- Step 4: Follow suggested people ----------
function StepFollow({
  followed,
  onToggle,
  onNext,
}: {
  followed: Set<string>;
  onToggle: (s: Set<string>) => void;
  onNext: () => void;
}) {
  const explore = useExplore("");
  const followMut = useToggleFollow();
  const suggested = explore.data?.suggestedUsers ?? [];

  const toggle = (u: any) => {
    const isFollowing = followed.has(u.id);
    followMut.mutate(
      { username: u.username },
      {
        onSuccess: () => {
          const next = new Set(followed);
          if (isFollowing) next.delete(u.id);
          else next.add(u.id);
          onToggle(next);
        },
        onError: (e) => toast.error(e.message || "Couldn't follow"),
      }
    );
  };

  const target = 3;
  const reached = followed.size >= target;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 animate-fade-in">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight">Follow some people</h1>
        <p className="mt-1.5 text-[14px] text-muted-foreground">
          Following {target}+ people helps your feed come alive. You can change this anytime.
        </p>
      </div>

      {explore.isLoading ? (
        <LoadingState label="Finding people" />
      ) : suggested.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">
          No suggestions right now. Try exploring later.
        </p>
      ) : (
        <div className="max-h-[55vh] overflow-y-auto rounded-2xl border border-border scrollbar-thin">
          <div className="divide-y divide-border">
            {suggested.slice(0, 12).map((u) => (
              <div key={u.id} className="relative">
                <UserCard user={u} following={followed.has(u.id)} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] text-muted-foreground">
          {followed.size} / {target}+ followed
        </p>
        <Button
          onClick={onNext}
          disabled={followMut.isPending}
          className="rounded-full px-6 py-3 text-[15px] font-semibold"
          size="lg"
        >
          {reached ? "Continue" : "Skip for now"} <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ---------- Step 5: Done ----------
function StepDone({
  me,
  avatarUrl,
  followedCount,
  onDone,
}: {
  me: any;
  avatarUrl: string | null;
  followedCount: number;
  onDone: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 text-center animate-fade-in">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <PartyPopper className="h-8 w-8 text-primary" />
      </div>
      <div>
        <h1 className="text-[24px] font-bold tracking-tight">You're all set!</h1>
        <p className="mt-2 text-[15px] text-muted-foreground text-pretty">
          Your profile is ready. Jump into the feed, post your first thought, or explore your school.
        </p>
      </div>

      <div className="flex w-full flex-col gap-3 rounded-2xl border border-border bg-secondary/30 p-4">
        <div className="flex items-center gap-3">
          <UserAvatar
            name={me?.name ?? "You"}
            username={me?.username}
            avatarUrl={avatarUrl}
            size={48}
          />
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate font-semibold text-[15px]">{me?.name}</p>
            <p className="truncate text-[13px] text-muted-foreground">@{me?.username}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-left text-[13px]">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
              <Check className="h-3.5 w-3.5 text-primary" />
            </span>
            Profile set up
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
              <GraduationCap className="h-3.5 w-3.5 text-primary" />
            </span>
            School selected
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-3.5 w-3.5 text-primary" />
            </span>
            {followedCount} people followed
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
              <Check className="h-3.5 w-3.5 text-primary" />
            </span>
            Ready to post
          </div>
        </div>
      </div>

      <Button
        onClick={onDone}
        className="mt-2 w-full rounded-full py-3 text-[15px] font-semibold"
        size="lg"
      >
        Go to feed <ArrowRight className="ml-1.5 h-4 w-4" />
      </Button>
    </div>
  );
}
