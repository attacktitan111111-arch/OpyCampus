"use client";

import { cn } from "@/lib/utils";
import { BadgeCheck } from "lucide-react";

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <BadgeCheck
      className={cn(
        "inline-block h-3.5 w-3.5 shrink-0 fill-primary text-primary-foreground",
        className
      )}
      aria-label="Verified"
    />
  );
}

export function UserAvatar({
  name,
  username,
  avatarUrl,
  size = 40,
  className,
  onClick,
}: {
  name: string;
  username?: string;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
  onClick?: () => void;
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Deterministic gradient from username/name
  const palette = [
    "from-rose-400 to-orange-400",
    "from-emerald-400 to-teal-500",
    "from-violet-400 to-fuchsia-400",
    "from-sky-400 to-cyan-400",
    "from-amber-400 to-yellow-500",
    "from-pink-400 to-rose-500",
  ];
  const seed = (username ?? name).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const grad = palette[seed % palette.length];

  return (
    <div
      onClick={onClick}
      style={{ width: size, height: size }}
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-gradient-to-br select-none transition-transform",
        grad,
        onClick && "cursor-pointer tap-highlight-none transition-[transform,box-shadow] duration-200 hover:ring-2 hover:ring-foreground/30 active:scale-[0.97]",
        className
      )}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className="pointer-events-none h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center font-semibold text-white"
          style={{ fontSize: Math.max(11, size * 0.36) }}
        >
          {initials}
        </div>
      )}
    </div>
  );
}
