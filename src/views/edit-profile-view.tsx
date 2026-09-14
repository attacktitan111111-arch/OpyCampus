"use client";

import { useState } from "react";
import { ArrowLeft, Camera, Loader2, MapPin, Globe, Building2, Check } from "lucide-react";
import { useApp, useSession, useUpdateProfile, useUploadFile } from "@/lib/hooks";
import type { User } from "@/lib/hooks";
import { UserAvatar } from "@/components/user-avatar";
import { LoadingState, EmptyState } from "@/components/view-helpers";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const BIO_MAX = 160;
const NAME_MAX = 60;

export function EditProfileView() {
  const { back, openAuth } = useApp();
  const { data: session, isLoading } = useSession();
  const me = session?.user;

  if (isLoading) return <LoadingState className="py-24" />;

  if (!me) {
    return (
      <div className="mx-auto w-full max-w-[640px]">
        <HeaderBar back={back} title="Edit profile" />
        <EmptyState
          title="You're signed out"
          description="Sign in to edit your profile."
          className="py-20"
          action={
            <div className="flex gap-2">
              <button onClick={() => openAuth("login")} className="rounded-full bg-primary px-5 py-2.5 text-[14px] font-semibold text-primary-foreground">
                Sign in
              </button>
              <button onClick={() => openAuth("signup")} className="rounded-full border border-border px-5 py-2.5 text-[14px] font-semibold">
                Create account
              </button>
            </div>
          }
        />
      </div>
    );
  }

  return <EditProfileForm key={me.id} me={me} back={back} />;
}

function EditProfileForm({ me, back }: { me: User; back: () => void }) {
  const { nav } = useApp();
  const [name, setName] = useState(me.name ?? "");
  const [bio, setBio] = useState(me.bio ?? "");
  const [department, setDepartment] = useState(me.department ?? "");
  const [location, setLocation] = useState(me.location ?? "");
  const [website, setWebsite] = useState(me.website ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(me.avatarUrl ?? null);
  const [coverUrl, setCoverUrl] = useState<string | null>(me.coverUrl ?? null);

  const updateMut = useUpdateProfile();
  const uploadMut = useUploadFile();

  const uploadingAvatar = uploadMut.isPending;

  const uploadAvatar = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Avatar must be an image");
      return;
    }
    try {
      const r = await uploadMut.mutateAsync(file);
      setAvatarUrl(r.url);
      // Persist immediately so the avatar updates around the app
      updateMut.mutate({ avatarUrl: r.url });
    } catch (e: any) {
      toast.error(e.message || "Couldn't upload avatar");
    }
  };

  const uploadCover = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Cover must be an image");
      return;
    }
    try {
      const r = await uploadMut.mutateAsync(file);
      setCoverUrl(r.url);
      updateMut.mutate({ coverUrl: r.url });
    } catch (e: any) {
      toast.error(e.message || "Couldn't upload cover");
    }
  };

  const dirty =
    name !== (me.name ?? "") ||
    bio !== (me.bio ?? "") ||
    department !== (me.department ?? "") ||
    location !== (me.location ?? "") ||
    website !== (me.website ?? "");
  const save = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Name cannot be empty");
      return;
    }
    updateMut.mutate(
      {
        name: trimmedName,
        bio: bio.trim(),
        department: department.trim(),
        location: location.trim(),
        website: website.trim(),
      },
      {
        onSuccess: () => {
          toast.success("Profile saved");
          nav({ name: "profile", username: me.username });
        },
        onError: (e) => toast.error(e.message || "Couldn't save profile"),
      }
    );
  };

  return (
    <div className="mx-auto w-full max-w-[640px] pb-24">
      <HeaderBar
        back={back}
        title="Edit profile"
        right={
          <Button
            onClick={save}
            disabled={!dirty || updateMut.isPending}
            className="rounded-full px-5 font-semibold"
          >
            {updateMut.isPending ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Check className="mr-1.5 h-4 w-4" /> Save
              </>
            )}
          </Button>
        }
      />

      {/* Cover photo */}
      <div className="relative h-36 w-full bg-gradient-to-br from-primary/15 to-primary/5 sm:h-44">
        {coverUrl ? (
          <img src={coverUrl} alt="Cover" className="h-full w-full object-cover" />
        ) : null}
        <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/0 transition hover:bg-black/10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-background/85 px-3 py-1.5 text-[13px] font-medium text-foreground shadow-sm backdrop-blur">
            <Camera className="h-3.5 w-3.5" /> {coverUrl ? "Change cover" : "Add cover"}
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadCover(f);
              e.target.value = "";
            }}
          />
        </label>
        {uploadMut.isPending && !avatarUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}
      </div>

      {/* Avatar */}
      <div className="px-4 sm:px-5">
        <div className="-mt-10 flex items-end justify-between">
          <div className="relative">
            <UserAvatar
              name={name || me.name}
              username={me.username}
              avatarUrl={avatarUrl}
              size={84}
              className="ring-4 ring-background"
            />
            <label className="absolute -bottom-1 -right-1 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition hover:bg-accent">
              {uploadingAvatar ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadAvatar(f);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="mt-5 space-y-5 px-4 sm:px-5">
        <Field label="Name" hint={`${name.length}/${NAME_MAX}`}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, NAME_MAX))}
            placeholder="Your name"
            className="auth-input"
            maxLength={NAME_MAX}
          />
        </Field>

        <Field label="Bio" hint={`${bio.length}/${BIO_MAX}`}>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
            placeholder="Tell classmates and teachers a bit about yourself"
            rows={3}
            className="auth-input resize-none"
            maxLength={BIO_MAX}
          />
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Department" icon={<Building2 className="h-4 w-4" />}>
            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Computer Science"
              className="auth-input"
            />
          </Field>
          <Field label="Location" icon={<MapPin className="h-4 w-4" />}>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Boston, MA"
              className="auth-input"
            />
          </Field>
        </div>

        <Field label="Website" icon={<Globe className="h-4 w-4" />}>
          <input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://your.site"
            className="auth-input"
            inputMode="url"
          />
        </Field>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <p className="text-[13px] text-muted-foreground">
            Changes to your avatar and cover save instantly. Text saves when you press <span className="font-semibold text-foreground">Save</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

function HeaderBar({ back, title, right }: { back: () => void; title: string; right?: React.ReactNode }) {
  return (
    <div className="sticky top-14 z-20 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-2.5 backdrop-blur-md lg:top-0 lg:px-5">
      <button
        onClick={back}
        className="hidden lg:inline-flex lg:h-9 lg:w-9 lg:items-center lg:justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground tap-highlight-none"
        aria-label="Back"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[15px] font-semibold leading-tight">{title}</h1>
      </div>
      {right}
    </div>
  );
}

function Field({
  label,
  hint,
  icon,
  children,
}: {
  label: string;
  hint?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
          {icon}
          {label}
        </label>
        {hint && <span className="text-[12px] text-muted-foreground tabular-nums">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
