"use client";

import { useState } from "react";
import { GraduationCap, Loader2, Eye, EyeOff, ArrowRight, Check } from "lucide-react";
import { useApp, useLogin, useSignup } from "@/lib/hooks";
import { ScholarLogo } from "@/components/scholar-logo";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const DEMO_ACCOUNTS = [
  { username: "aria.chen", name: "Aria Chen", role: "Student · CS" },
  { username: "prof.nakamura", name: "Dr. Nakamura", role: "Teacher · CS" },
  { username: "sana.k", name: "Sana Kapoor", role: "Student · Design" },
  { username: "dr.owusu", name: "Dr. Owusu", role: "Teacher · Math" },
];

export function AuthOverlay() {
  const { authOpen, closeAuth } = useApp();
  const mode = authOpen ?? "login";

  return (
    <Dialog open={!!authOpen} onOpenChange={(o) => !o && closeAuth()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-md overflow-hidden rounded-3xl border-border bg-background p-0"
      >
        <DialogTitle className="sr-only">{mode === "login" ? "Sign in to Scholar" : "Join Scholar"}</DialogTitle>
        <DialogDescription className="sr-only">
          {mode === "login" ? "Sign in to your Scholar account" : "Create a new Scholar account"}
        </DialogDescription>
        <AuthBody key={mode} mode={mode} />
      </DialogContent>
    </Dialog>
  );
}

function AuthBody({ mode: initialMode }: { mode: "login" | "signup" }) {
  const { closeAuth, openAuth } = useApp();
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [showPwd, setShowPwd] = useState(false);
  const [role, setRole] = useState<"student" | "teacher">("student");

  const loginMut = useLogin();
  const signupMut = useSignup();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");

  const loading = loginMut.isPending || signupMut.isPending;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") {
      if (!identifier.trim() || !password) {
        toast.error("Enter your email or username and password");
        return;
      }
      loginMut.mutate(
        { identifier: identifier.trim(), password },
        {
          onSuccess: () => {
            toast.success("Welcome back");
            closeAuth();
          },
          onError: (e) => toast.error(e.message || "Sign in failed"),
        }
      );
    } else {
      if (!email.trim() || !username.trim() || !password) {
        toast.error("Fill in all fields to continue");
        return;
      }
      signupMut.mutate(
        { email: email.trim(), username: username.trim(), name: name.trim() || username.trim(), password, role },
        {
          onSuccess: () => {
            toast.success("Account created — welcome to Scholar");
            closeAuth();
          },
          onError: (e) => toast.error(e.message || "Sign up failed"),
        }
      );
    }
  };

  const quickLogin = (uname: string) => {
    setMode("login");
    setIdentifier(uname);
    setPassword("scholar123");
    loginMut.mutate(
      { identifier: uname, password: "scholar123" },
      {
        onSuccess: () => {
          toast.success("Signed in");
          closeAuth();
        },
        onError: (e) => toast.error(e.message || "Sign in failed"),
      }
    );
  };

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <div className="flex flex-col items-center gap-3 px-6 pb-2 pt-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground text-background">
          <GraduationCap className="h-7 w-7" strokeWidth={2.2} />
        </div>
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">
            {mode === "login" ? "Welcome back" : "Join Scholar"}
          </h1>
          <p className="mt-1 text-[14px] text-muted-foreground text-balance">
            {mode === "login"
              ? "Sign in to your campus social space"
              : "Create an account to join your school's community"}
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3 px-6 py-5">
        {mode === "signup" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="auth-input"
                autoComplete="name"
              />
            </Field>
            <Field label="Username">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9._]/g, ""))}
                placeholder="username"
                className="auth-input"
                autoComplete="username"
              />
            </Field>
          </div>
        )}

        {mode === "signup" && (
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@school.edu"
              className="auth-input"
              autoComplete="email"
            />
          </Field>
        )}

        {mode === "login" && (
          <Field label="Email or username">
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="you@school.edu or username"
              className="auth-input"
              autoComplete="username"
            />
          </Field>
        )}

        <Field label="Password">
          <div className="relative">
            <input
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="auth-input pr-10"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
            <button
              type="button"
              onClick={() => setShowPwd((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPwd ? "Hide password" : "Show password"}
            >
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        {mode === "signup" && (
          <Field label="I am a">
            <div className="grid grid-cols-2 gap-2">
              {(["student", "teacher"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl border py-2.5 text-[14px] font-medium capitalize transition",
                    role === r ? "border-foreground bg-secondary" : "border-border hover:bg-accent"
                  )}
                >
                  {role === r && <Check className="h-3.5 w-3.5" />}
                  {r}
                </button>
              ))}
            </div>
          </Field>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="mt-1 h-11 rounded-xl bg-primary text-[15px] font-semibold text-primary-foreground disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {mode === "login" ? "Sign in" : "Create account"} <ArrowRight className="ml-1.5 h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      {/* Switch mode */}
      <div className="px-6 pb-2 text-center text-[14px] text-muted-foreground">
        {mode === "login" ? "New to Scholar? " : "Already have an account? "}
        <button
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            openAuth(mode === "login" ? "signup" : "login");
          }}
          className="font-semibold text-foreground hover:underline"
        >
          {mode === "login" ? "Create an account" : "Sign in"}
        </button>
      </div>

      {/* Demo quick-login */}
      <div className="border-t border-border bg-muted/30 px-6 py-4">
        <p className="mb-2 text-center text-[12px] uppercase tracking-wide text-muted-foreground">
          Try a demo account · password <span className="font-mono font-medium text-foreground">scholar123</span>
        </p>
        <div className="grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((a) => (
            <button
              key={a.username}
              onClick={() => quickLogin(a.username)}
              disabled={loading}
              className="flex flex-col items-start rounded-xl border border-border bg-background px-3 py-2 text-left transition hover:border-foreground/30 hover:bg-accent disabled:opacity-50"
            >
              <span className="text-[13px] font-semibold leading-tight">{a.name}</span>
              <span className="text-[11px] text-muted-foreground">{a.role}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
