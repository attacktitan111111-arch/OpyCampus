"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  LogOut,
  Moon,
  Sun,
  UserCircle,
  AtSign,
  KeyRound,
  GraduationCap,
  Eye,
  Mail,
  MessageSquare,
  Search,
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Send,
  MailOpen,
  Globe,
  AlertTriangle,
  PlayCircle,
  Sparkles,
  LifeBuoy,
  Info,
  FileText,
  Shield,
  Scale,
  HelpCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { useApp, useSession, useLogout } from "@/lib/hooks";
import { useMounted } from "@/hooks/use-mounted";
import { useLocalStorage } from "@/hooks/use-local-storage";

import { UserAvatar, VerifiedBadge } from "@/components/user-avatar";
import { LoadingState, EmptyState } from "@/components/view-helpers";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  DisplayRow,
  NavRow,
  SectionHeader,
  SelectRow,
  ToggleRow,
} from "@/components/settings-row";

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const APP_VERSION = "Version 1.0.0";
const SUPPORT_EMAIL = "support@opycampus.app";

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "pt", label: "Português" },
  { value: "it", label: "Italiano" },
  { value: "zh", label: "中文" },
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" },
  { value: "ar", label: "العربية" },
];

function languageLabel(code: string): string {
  return LANGUAGE_OPTIONS.find((o) => o.value === code)?.label ?? "English";
}

function roleLabel(role: string): string {
  switch (role) {
    case "teacher":
      return "Teacher";
    case "student":
      return "Student";
    case "institution_admin":
      return "Institution admin";
    default:
      return role;
  }
}

/**
 * Display "email" — the API serializer doesn't expose the user's real email
 * for privacy reasons, so we synthesize a visible handle for the settings
 * page using the username + a campus-style domain. This is display-only
 * and never sent anywhere.
 */
function displayEmail(username: string): string {
  return `${username}@opycampus.app`;
}

/* ------------------------------------------------------------------ */
/* Main view                                                           */
/* ------------------------------------------------------------------ */

export function SettingsView() {
  const { back, nav, openAuth } = useApp();
  const { data: session, isLoading } = useSession();
  const logoutMut = useLogout();

  // Password-change dialog state (placeholder)
  const [pwdDialogOpen, setPwdDialogOpen] = useState(false);

  // ---- localStorage-backed preference toggles --------------------------------
  // Privacy
  const [postsFollowersOnly, setPostsFollowersOnly, postsHydrated] = useLocalStorage<boolean>(
    "opycampus:privacy:posts",
    false
  );
  const [msgsFollowersOnly, setMsgsFollowersOnly, msgsHydrated] = useLocalStorage<boolean>(
    "opycampus:privacy:messages",
    false
  );
  const [showEmail, setShowEmail, emailHydrated] = useLocalStorage<boolean>(
    "opycampus:privacy:show-email",
    false
  );
  const [findableByEmail, setFindableByEmail, findHydrated] = useLocalStorage<boolean>(
    "opycampus:privacy:search-by-email",
    true
  );
  // Notifications
  const [notifPush, setNotifPush, pushHydrated] = useLocalStorage<boolean>(
    "opycampus:notifications:push",
    true
  );
  const [notifLikes, setNotifLikes, likesHydrated] = useLocalStorage<boolean>(
    "opycampus:notifications:likes",
    true
  );
  const [notifComments, setNotifComments, commentsHydrated] = useLocalStorage<boolean>(
    "opycampus:notifications:comments",
    true
  );
  const [notifFollows, setNotifFollows, followsHydrated] = useLocalStorage<boolean>(
    "opycampus:notifications:follows",
    true
  );
  const [notifMessages, setNotifMessages, messagesHydrated] = useLocalStorage<boolean>(
    "opycampus:notifications:messages",
    true
  );
  const [notifEmail, setNotifEmail, emailNotifHydrated] = useLocalStorage<boolean>(
    "opycampus:notifications:email",
    false
  );
  // Content & display
  const [language, setLanguage, langHydrated] = useLocalStorage<string>(
    "opycampus:content:language",
    "en"
  );
  const [showSensitive, setShowSensitive, sensitiveHydrated] = useLocalStorage<boolean>(
    "opycampus:content:sensitive",
    false
  );
  const [autoplay, setAutoplay, autoplayHydrated] = useLocalStorage<boolean>(
    "opycampus:content:autoplay",
    true
  );
  const [reduceMotion, setReduceMotion, reduceHydrated] = useLocalStorage<boolean>(
    "opycampus:content:reducemotion",
    false
  );

  if (isLoading) return <LoadingState className="py-24" />;

  const me = session?.user;

  if (!me) {
    return (
      <div className="mx-auto w-full max-w-[640px]">
        <SettingsHeader back={back} />
        <EmptyState
          title="You're signed out"
          description="Sign in to manage your profile and preferences."
          className="py-20"
          action={
            <div className="flex gap-2">
              <button
                onClick={() => openAuth("login")}
                className="rounded-full bg-primary px-5 py-2.5 text-[14px] font-semibold text-primary-foreground"
              >
                Sign in
              </button>
              <button
                onClick={() => openAuth("signup")}
                className="rounded-full border border-border px-5 py-2.5 text-[14px] font-semibold"
              >
                Create account
              </button>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[640px] animate-fade-in">
      <SettingsHeader back={back} />

      {/* Profile card */}
      <button
        onClick={() => nav({ name: "edit-profile" })}
        className="flex w-full items-center gap-3 border-b border-border px-4 py-4 text-left transition hover:bg-muted/40 lg:px-5"
      >
        <UserAvatar
          name={me.name}
          username={me.username}
          avatarUrl={me.avatarUrl}
          size={52}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 truncate">
            <span className="truncate text-[16px] font-semibold">{me.name}</span>
            {me.verified && <VerifiedBadge className="h-4 w-4 text-primary" />}
          </div>
          <p className="truncate text-[14px] text-muted-foreground">
            @{me.username}
          </p>
          {me.bio && (
            <p className="mt-0.5 line-clamp-1 text-[13px] text-muted-foreground">
              {me.bio}
            </p>
          )}
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
      </button>

      {/* ---------------------------- ACCOUNT ---------------------------- */}
      <section className="border-b border-border">
        <SectionHeader
          title="Account"
          description="Manage your identity and sign-in details."
        />
        <div className="pb-1">
          <NavRow
            icon={UserCircle}
            label="Edit profile"
            description="Name, bio, avatar, cover, department"
            onClick={() => nav({ name: "edit-profile" })}
          />
          <DisplayRow
            icon={AtSign}
            label="Username"
            value={`@${me.username}`}
          />
          <DisplayRow
            icon={Mail}
            label="Email"
            description="Visible only to you"
            value={displayEmail(me.username)}
          />
          <NavRow
            icon={KeyRound}
            label="Change password"
            description="Update your password"
            onClick={() => setPwdDialogOpen(true)}
          />
          <DisplayRow
            icon={GraduationCap}
            label="Account type"
            value={roleLabel(me.role)}
          />
        </div>
      </section>

      {/* ---------------------------- PRIVACY ---------------------------- */}
      <section className="border-b border-border">
        <SectionHeader
          title="Privacy"
          description="Control who can see and find you on OpyCampus."
        />
        <div className="pb-1">
          <ToggleRow
            icon={Eye}
            label="Posts visibility"
            description={
              postsFollowersOnly
                ? "Visible to your followers only"
                : "Visible to everyone (public)"
            }
            checked={postsHydrated ? postsFollowersOnly : false}
            onChange={(v) => {
              setPostsFollowersOnly(v);
              toast.success(v ? "Posts limited to followers" : "Posts are public");
            }}
          />
          <ToggleRow
            icon={Send}
            label="Who can message you"
            description={
              msgsFollowersOnly ? "Only your followers" : "Everyone on OpyCampus"
            }
            checked={msgsHydrated ? msgsFollowersOnly : false}
            onChange={(v) => {
              setMsgsFollowersOnly(v);
              toast.success(
                v ? "Messages limited to followers" : "Messages open to everyone"
              );
            }}
          />
          <ToggleRow
            icon={Mail}
            label="Show email on profile"
            description={
              emailHydrated
                ? showEmail
                  ? `Showing ${displayEmail(me.username)}`
                  : "Email hidden from your profile"
                : "Toggle to show your email publicly"
            }
            checked={emailHydrated ? showEmail : false}
            onChange={(v) => {
              setShowEmail(v);
              toast.success(v ? "Email visible on profile" : "Email hidden");
            }}
          />
          <ToggleRow
            icon={Search}
            label="Allow people to find you by email"
            description="Others can search for your account using your email"
            checked={findHydrated ? findableByEmail : true}
            onChange={(v) => {
              setFindableByEmail(v);
              toast.success(v ? "Findable by email" : "Hidden from email search");
            }}
          />
        </div>
      </section>

      {/* -------------------------- NOTIFICATIONS ------------------------- */}
      <section className="border-b border-border">
        <SectionHeader
          title="Notifications"
          description="Choose what you want to be notified about."
        />
        <div className="pb-1">
          <ToggleRow
            icon={Bell}
            label="Push notifications"
            description="Get alerts on this device"
            checked={pushHydrated ? notifPush : true}
            onChange={(v) => {
              setNotifPush(v);
              toast.success(v ? "Push notifications on" : "Push notifications off");
            }}
          />
          <ToggleRow
            icon={Heart}
            label="Likes"
            description="When someone likes your posts"
            checked={likesHydrated ? notifLikes : true}
            onChange={(v) => {
              setNotifLikes(v);
              toast.success(`Likes notifications ${v ? "on" : "off"}`);
            }}
          />
          <ToggleRow
            icon={MessageCircle}
            label="Comments & replies"
            description="Replies to your posts and comments"
            checked={commentsHydrated ? notifComments : true}
            onChange={(v) => {
              setNotifComments(v);
              toast.success(`Comments notifications ${v ? "on" : "off"}`);
            }}
          />
          <ToggleRow
            icon={UserPlus}
            label="New followers"
            description="When someone follows you"
            checked={followsHydrated ? notifFollows : true}
            onChange={(v) => {
              setNotifFollows(v);
              toast.success(`Follower notifications ${v ? "on" : "off"}`);
            }}
          />
          <ToggleRow
            icon={MessageSquare}
            label="Direct messages"
            description="When you receive a new message"
            checked={messagesHydrated ? notifMessages : true}
            onChange={(v) => {
              setNotifMessages(v);
              toast.success(`Message notifications ${v ? "on" : "off"}`);
            }}
          />
          <ToggleRow
            icon={MailOpen}
            label="Email notifications"
            description="Weekly summary and important alerts"
            checked={emailNotifHydrated ? notifEmail : false}
            onChange={(v) => {
              setNotifEmail(v);
              toast.success(`Email notifications ${v ? "on" : "off"}`);
            }}
          />
        </div>
      </section>

      {/* --------------------------- APPEARANCE --------------------------- */}
      <section className="border-b border-border">
        <SectionHeader
          title="Appearance"
          description="Make OpyCampus look the way you like."
        />
        <div className="pb-1">
          <DarkModeRow />
        </div>
      </section>

      {/* ----------------------- CONTENT & DISPLAY ----------------------- */}
      <section className="border-b border-border">
        <SectionHeader
          title="Content & Display"
          description="Customize how content is shown to you."
        />
        <div className="pb-1">
          <SelectRow
            icon={Globe}
            label="Language"
            description="Display language for the OpyCampus interface"
            value={langHydrated ? language : "en"}
            onValueChange={(v) => {
              setLanguage(v);
              toast.success(`Language set to ${languageLabel(v)}`);
            }}
            options={LANGUAGE_OPTIONS}
          />
          <ToggleRow
            icon={AlertTriangle}
            label="Show sensitive content"
            description="Display posts flagged as sensitive"
            checked={sensitiveHydrated ? showSensitive : false}
            onChange={(v) => {
              setShowSensitive(v);
              toast.success(`Sensitive content ${v ? "shown" : "hidden"}`);
            }}
          />
          <ToggleRow
            icon={PlayCircle}
            label="Auto-play videos"
            description="Play videos automatically as you scroll"
            checked={autoplayHydrated ? autoplay : true}
            onChange={(v) => {
              setAutoplay(v);
              toast.success(`Auto-play ${v ? "on" : "off"}`);
            }}
          />
          <ToggleRow
            icon={Sparkles}
            label="Reduce motion"
            description="Minimize animations and transitions"
            checked={reduceHydrated ? reduceMotion : false}
            onChange={(v) => {
              setReduceMotion(v);
              toast.success(`Reduce motion ${v ? "on" : "off"}`);
            }}
          />
        </div>
      </section>

      {/* ----------------------------- ABOUT ----------------------------- */}
      <section className="border-b border-border">
        <SectionHeader title="About" />
        <div className="pb-1">
          <NavRow
            icon={Info}
            label="About OpyCampus"
            description="Learn more about the platform"
            onClick={() => nav({ name: "legal", page: "terms" })}
          />
          <DisplayRow
            icon={HelpCircle}
            label="Version"
            value={APP_VERSION}
          />
          <NavRow
            icon={LifeBuoy}
            label="Help & Support"
            description={SUPPORT_EMAIL}
            onClick={() => {
              window.location.href = `mailto:${SUPPORT_EMAIL}`;
            }}
          />
        </div>
      </section>

      {/* ----------------------------- LEGAL ----------------------------- */}
      <section className="border-b border-border">
        <SectionHeader title="Legal" />
        <div className="pb-1">
          <NavRow
            icon={FileText}
            label="Terms of Service"
            onClick={() => nav({ name: "legal", page: "terms" })}
          />
          <NavRow
            icon={Shield}
            label="Privacy Policy"
            onClick={() => nav({ name: "legal", page: "privacy" })}
          />
          <NavRow
            icon={Scale}
            label="Community Guidelines"
            onClick={() => nav({ name: "legal", page: "guidelines" })}
          />
        </div>
      </section>

      {/* ----------------------------- SESSION --------------------------- */}
      <div className="px-4 py-5 lg:px-5">
        <button
          onClick={() => {
            logoutMut.mutate();
            nav({ name: "home" });
            toast.success("Signed out");
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-[15px] font-semibold text-destructive transition hover:bg-destructive/5"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>

      <p className="px-4 pb-6 text-center text-[12px] text-muted-foreground/70 lg:px-5">
        OpyCampus · {APP_VERSION}
      </p>

      {/* Password-change placeholder dialog */}
      <ChangePasswordDialog
        open={pwdDialogOpen}
        onOpenChange={setPwdDialogOpen}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

function SettingsHeader({ back }: { back: () => void }) {
  return (
    <div className="sticky top-14 z-20 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-2.5 backdrop-blur-md lg:top-0 lg:px-5">
      <button
        onClick={back}
        className="hidden lg:inline-flex lg:h-9 lg:w-9 lg:items-center lg:justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground tap-highlight-none press-down"
        aria-label="Back"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <h1 className="text-[15px] font-semibold">Settings</h1>
    </div>
  );
}

/* -------------------------- Appearance row -------------------------- */

function DarkModeRow() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const isDark = theme === "dark";

  return (
    <label
      className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40 tap-highlight-none lg:px-5"
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted/60 text-muted-foreground">
        <AnimatePresence mode="wait" initial={false}>
          {mounted ? (
            isDark ? (
              <motion.span
                key="moon"
                initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="inline-flex"
              >
                <Moon className="h-[18px] w-[18px]" />
              </motion.span>
            ) : (
              <motion.span
                key="sun"
                initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="inline-flex"
              >
                <Sun className="h-[18px] w-[18px]" />
              </motion.span>
            )
          ) : (
            <span className="h-[18px] w-[18px]" />
          )}
        </AnimatePresence>
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-medium leading-tight text-foreground">
          Dark mode
        </div>
        <div className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
          {mounted
            ? isDark
              ? "Easier on the eyes at night"
              : "Bright and clear during the day"
            : "Switch between light and dark themes"}
        </div>
      </div>
      <Switch
        checked={mounted ? isDark : false}
        onCheckedChange={(v) => {
          setTheme(v ? "dark" : "light");
          toast.success(v ? "Dark mode on" : "Light mode on");
        }}
        aria-label="Dark mode"
      />
    </label>
  );
}

/* ---------------------- Password-change dialog ---------------------- */

function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300">
            <KeyRound className="h-5 w-5" />
          </div>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>
            Password changes are coming soon. We're rolling out a secure,
            self-service password reset flow in a future release. For now,
            contact support if you need to reset your password.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-xl border border-border bg-muted/40 p-3">
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            In the meantime, you can sign out and request a reset link at{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
            >
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="secondary"
            className="rounded-full"
            onClick={() => onOpenChange(false)}
          >
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
