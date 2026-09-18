"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Camera,
  Check,
  GraduationCap,
  Heart,
  Loader2,
  PartyPopper,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useApp,
  useSession,
  useUpdateProfile,
  useUploadFile,
  useExplore,
  useToggleFollow,
} from "@/lib/hooks";
import type { User } from "@/lib/hooks";
import { UserAvatar } from "@/components/user-avatar";
import { UserCard } from "@/components/user-card";
import { LoadingState, EmptyState } from "@/components/view-helpers";
import { GraduationMark } from "@/components/graduation-mark";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const BIO_MAX = 160;
const TOTAL_STEPS = 6; // welcome → avatar → bio → interests → follow → done

const INTEREST_TOPICS = [
  { label: "Computer Science", emoji: "💻" },
  { label: "Design", emoji: "🎨" },
  { label: "Math", emoji: "📐" },
  { label: "Literature", emoji: "📚" },
  { label: "Engineering", emoji: "⚙️" },
  { label: "Biology", emoji: "🧬" },
  { label: "Physics", emoji: "🔭" },
  { label: "Music", emoji: "🎵" },
  { label: "Photography", emoji: "📷" },
  { label: "Business", emoji: "📈" },
  { label: "Psychology", emoji: "🧠" },
  { label: "Sports", emoji: "🏀" },
  { label: "Film", emoji: "🎬" },
  { label: "Languages", emoji: "🗣️" },
  { label: "Cooking", emoji: "🍳" },
  { label: "Gaming", emoji: "🎮" },
];

const BIO_SUGGESTIONS = [
  "CS junior · coffee enthusiast",
  "Design student, lifelong learner",
  "Aspiring mathematician + chess nerd",
  "Loves photography and late-night coding",
];

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
  const [direction, setDirection] = useState<1 | -1>(1);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(me.avatarUrl ?? null);
  const [bio, setBio] = useState(me.bio ?? "");
  const [department, setDepartment] = useState(me.department ?? "");
  const [interests, setInterests] = useState<Set<string>>(new Set());
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
    goNext();
  };

  const toggleInterest = (label: string) => {
    setInterests((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const goNext = () => {
    setDirection(1);
    setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1));
  };
  const goPrev = () => {
    setDirection(-1);
    setStep((s) => Math.max(0, s - 1));
  };
  const skip = () => goNext();

  const slideVariants = {
    enter: (dir: 1 | -1) => ({ opacity: 0, x: dir === 1 ? 40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: 1 | -1) => ({ opacity: 0, x: dir === 1 ? -40 : 40 }),
  };

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-[640px] flex-col lg:min-h-[100dvh]">
      {/* Progress bar at top */}
      <div className="border-b border-border bg-background/85 px-4 py-3 backdrop-blur-md lg:px-5">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationMark size={20} className="text-foreground" />
            <span className="text-[12px] font-medium text-muted-foreground">
              Step {step + 1} of {TOTAL_STEPS}
            </span>
          </div>
          {step < TOTAL_STEPS - 1 ? (
            <button
              onClick={skip}
              className="rounded-full px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground press-down"
            >
              Skip
            </button>
          ) : (
            <button
              onClick={goPrev}
              disabled={step === 0}
              className="rounded-full px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:opacity-30 press-down"
            >
              Back
            </button>
          )}
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={false}
            animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
            transition={{ type: "spring", stiffness: 320, damping: 32, mass: 0.8 }}
          />
        </div>
      </div>

      <div className="flex-1 px-4 py-8 sm:px-5 relative">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            {step === 0 && <StepWelcome me={me} onNext={goNext} />}
            {step === 1 && (
              <StepAvatar
                me={me}
                avatarUrl={avatarUrl}
                uploadingAvatar={uploadMut.isPending || updateMut.isPending}
                onUpload={uploadAvatar}
                onNext={goNext}
              />
            )}
            {step === 2 && (
              <StepBio
                bio={bio}
                setBio={setBio}
                department={department}
                setDepartment={setDepartment}
                saving={updateMut.isPending}
                onNext={finishBio}
              />
            )}
            {step === 3 && (
              <StepInterests
                interests={interests}
                onToggle={toggleInterest}
                onNext={goNext}
              />
            )}
            {step === 4 && (
              <StepFollow
                followed={followed}
                onToggle={setFollowed}
                onNext={goNext}
              />
            )}
            {step === 5 && (
              <StepDone
                me={me}
                avatarUrl={avatarUrl}
                followedCount={followed.size}
                interestsCount={interests.size}
                onDone={navHome}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---------- Step 1: Welcome with animated logo ----------
function StepWelcome({ me, onNext }: { me: User; onNext: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 text-center">
      {/* Animated logo draw-in with sparkles */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex h-24 w-24 items-center justify-center"
      >
        <span className="absolute inset-0 -m-2 animate-ring-pulse rounded-full" />
        <GraduationMark
          size={64}
          variant="stroke"
          strokeAnimate
          className="text-foreground"
        />
        {/* Sparkles around the cap */}
        {[0, 1, 2, 3].map((i) => {
          const angle = (Math.PI * 2 * i) / 4;
          const dist = 50;
          const x = Math.cos(angle) * dist;
          const y = Math.sin(angle) * dist;
          return (
            <motion.span
              key={i}
              className="absolute"
              style={{ x, y }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
            >
              <Sparkles className="h-4 w-4 text-primary" />
            </motion.span>
          );
        })}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <h1 className="text-[28px] font-bold tracking-tight">
          Welcome{me?.name ? `, ${me.name.split(" ")[0]}` : ""}!
        </h1>
        <p className="mt-2 text-[15px] text-muted-foreground text-pretty">
          Welcome to OpyCampus — campus social, reimagined. Let's set up your profile so classmates can recognize you.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.4 }}
        className="w-full"
      >
        <Button
          onClick={onNext}
          className="mt-2 w-full rounded-full py-3 text-[15px] font-semibold press-down"
          size="lg"
        >
          Let's get started <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  );
}

// ---------- Step 2: Avatar upload with fun prompt ----------
function StepAvatar({
  me,
  avatarUrl,
  uploadingAvatar,
  onUpload,
  onNext,
}: {
  me: User;
  avatarUrl: string | null;
  uploadingAvatar: boolean;
  onUpload: (f: File) => void;
  onNext: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 text-center">
      <div>
        <h1 className="text-[24px] font-bold tracking-tight">Show your face to classmates 👋</h1>
        <p className="mt-2 text-[15px] text-muted-foreground text-pretty">
          A friendly photo helps classmates and teachers recognize you in the feed and in DMs.
        </p>
      </div>

      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.18 }}
        className="flex flex-col items-center gap-3"
      >
        <div className="relative">
          <UserAvatar
            name={me?.name ?? "You"}
            username={me?.username}
            avatarUrl={avatarUrl}
            size={140}
            className="ring-4 ring-background shadow-md"
          />
          <label className="absolute -bottom-1 -right-1 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-foreground shadow-md transition hover:bg-accent press-down">
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
          {avatarUrl ? "Looking good! You can change it later." : "Tap the camera to add a photo."}
        </p>
      </motion.div>

      <Button
        onClick={onNext}
        className="mt-2 w-full rounded-full py-3 text-[15px] font-semibold press-down"
        size="lg"
      >
        {avatarUrl ? "Continue" : "Skip for now"} <ArrowRight className="ml-1.5 h-4 w-4" />
      </Button>
    </div>
  );
}

// ---------- Step 3: Bio + Department with suggestions ----------
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
    <div className="mx-auto flex max-w-md flex-col gap-5">
      <div>
        <h1 className="text-[24px] font-bold tracking-tight">Tell us about you</h1>
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
        {bio.length === 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {BIO_SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setBio(s)}
                className="rounded-full border border-border bg-secondary/40 px-2.5 py-1 text-[12px] text-muted-foreground transition hover:bg-secondary hover:text-foreground tap-highlight-none press-down"
              >
                {s}
              </button>
            ))}
          </div>
        )}
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
        className="mt-2 w-full rounded-full py-3 text-[15px] font-semibold press-down"
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

// ---------- Step 4: Pick interests / topics ----------
function StepInterests({
  interests,
  onToggle,
  onNext,
}: {
  interests: Set<string>;
  onToggle: (label: string) => void;
  onNext: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-5">
      <div>
        <h1 className="text-[24px] font-bold tracking-tight">What are you into?</h1>
        <p className="mt-1.5 text-[14px] text-muted-foreground">
          Pick a few interests. We'll use them to suggest people and posts to follow.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {INTEREST_TOPICS.map((t) => {
          const active = interests.has(t.label);
          return (
            <motion.button
              key={t.label}
              whileTap={{ scale: 0.94 }}
              onClick={() => onToggle(t.label)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[14px] font-medium transition-colors tap-highlight-none",
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <span className="text-[15px] leading-none">{t.emoji}</span>
              <span>{t.label}</span>
              {active && <Check className="h-3.5 w-3.5" />}
            </motion.button>
          );
        })}
      </div>

      <div className="mt-1 flex items-center justify-between">
        <p className="text-[13px] text-muted-foreground">
          {interests.size === 0 ? "Pick at least one — or skip" : `${interests.size} selected`}
        </p>
      </div>

      <Button
        onClick={onNext}
        className="mt-2 w-full rounded-full py-3 text-[15px] font-semibold press-down"
        size="lg"
      >
        {interests.size >= 1 ? "Continue" : "Skip for now"} <ArrowRight className="ml-1.5 h-4 w-4" />
      </Button>
    </div>
  );
}

// ---------- Step 5: Follow suggested people (card swipe feel) ----------
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
    <div className="mx-auto flex max-w-md flex-col gap-5">
      <div>
        <h1 className="text-[24px] font-bold tracking-tight">Follow some people</h1>
        <p className="mt-1.5 text-[14px] text-muted-foreground">
          Following {target}+ people helps your feed come alive. Tap to follow.
        </p>
      </div>

      {explore.isLoading ? (
        <LoadingState label="Finding people" />
      ) : suggested.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">
          No suggestions right now. Try exploring later.
        </p>
      ) : (
        <div className="max-h-[50vh] overflow-y-auto rounded-2xl border border-border scrollbar-thin">
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
          <span className="font-semibold text-foreground tabular-nums">{followed.size}</span> / {target}+ followed
        </p>
        <Button
          onClick={onNext}
          disabled={followMut.isPending}
          className="rounded-full px-6 py-3 text-[15px] font-semibold press-down"
          size="lg"
        >
          {reached ? "Continue" : "Skip for now"} <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ---------- Step 6: Done with celebration ----------
function StepDone({
  me,
  avatarUrl,
  followedCount,
  interestsCount,
  onDone,
}: {
  me: User;
  avatarUrl: string | null;
  followedCount: number;
  interestsCount: number;
  onDone: () => void;
}) {
  // Render confetti pieces
  const confetti = useMemo(() => {
    const colors = ["#ff5a7e", "#ffd166", "#8affc1", "#9ad8ff", "#c89bff", "#ff8e6a"];
    const pieces = Array.from({ length: 24 });
    return pieces.map((_, i) => {
      const left = Math.random() * 100;
      const delay = Math.random() * 0.4;
      const duration = 1.4 + Math.random() * 0.6;
      const cx = (Math.random() - 0.5) * 80;
      const cy = 80 + Math.random() * 80;
      const cr = (Math.random() - 0.5) * 720;
      const color = colors[i % colors.length];
      const size = 6 + Math.random() * 6;
      return { id: i, left, delay, duration, cx, cy, cr, color, size };
    });
  }, []);

  return (
    <div className="relative mx-auto flex max-w-md flex-col items-center gap-6 text-center">
      {/* Confetti layer */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {confetti.map((p) => (
          <span
            key={p.id}
            className="absolute top-0 animate-confetti-fall"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              background: p.color,
              borderRadius: p.size > 8 ? "50%" : "2px",
              animationDelay: `${p.delay}s`,
              "--cx": `${p.cx}px`,
              "--cy": `${p.cy}px`,
              "--cr": `${p.cr}deg`,
              "--cdur": `${p.duration}s`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10"
      >
        <PartyPopper className="h-10 w-10 text-primary" />
      </motion.div>

      <div>
        <h1 className="text-[28px] font-bold tracking-tight">You're all set! 🎉</h1>
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
              <Heart className="h-3.5 w-3.5 text-primary" />
            </span>
            {followedCount} people followed
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </span>
            {interestsCount} interests
          </div>
        </div>
      </div>

      <Button
        onClick={onDone}
        className="mt-2 w-full rounded-full py-3 text-[15px] font-semibold press-down"
        size="lg"
      >
        Go to feed <ArrowRight className="ml-1.5 h-4 w-4" />
      </Button>
    </div>
  );
}
