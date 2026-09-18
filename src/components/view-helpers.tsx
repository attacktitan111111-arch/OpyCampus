"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

/**
 * Premium branded loading spinner. Uses a simple Loader2 icon to avoid
 * any SSR/client hydration mismatch with animated SVG components.
 */
export function LoadingState({
  label = "Loading",
  className,
  size = 32,
}: {
  label?: string;
  className?: string;
  size?: number;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground",
        className
      )}
    >
      <Loader2 className="animate-spin text-foreground/80" style={{ width: size, height: size }} />
      <span className="text-[13px] font-medium tracking-tight">{label}…</span>
    </div>
  );
}

/**
 * Inline mini-spinner for tight UI spaces (buttons, banners, etc.).
 */
export function InlineSpinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-4 w-4 animate-spin", className)} />;
}

/**
 * A single shimmering skeleton block — pairs with the `skeleton-shimmer`
 * CSS class to produce a calm left-to-right pulse.
 */
export function Shimmer({ className }: { className?: string }) {
  return <div className={cn("skeleton-base skeleton-shimmer", className)} />;
}

/**
 * Skeleton post card — looks like a real post row in the feed, shimmering.
 */
export function SkeletonPostCard() {
  return (
    <div className="flex gap-3 px-4 py-3 sm:px-5 sm:py-3.5">
      <div className="flex flex-col items-center">
        <Shimmer className="h-11 w-11 rounded-full" />
        <div className="mt-1 w-px flex-1 bg-border" />
      </div>
      <div className="min-w-0 flex-1 space-y-2.5">
        <div className="flex items-center gap-2">
          <Shimmer className="h-3.5 w-24" />
          <Shimmer className="h-3.5 w-12" />
          <Shimmer className="h-3.5 w-10" />
        </div>
        <div className="space-y-1.5">
          <Shimmer className="h-3.5 w-full" />
          <Shimmer className="h-3.5 w-[92%]" />
          <Shimmer className="h-3.5 w-[68%]" />
        </div>
        <Shimmer className="h-24 w-full rounded-xl" />
        <div className="flex gap-3 pt-1">
          <Shimmer className="h-4 w-10 rounded-full" />
          <Shimmer className="h-4 w-10 rounded-full" />
          <Shimmer className="h-4 w-10 rounded-full" />
          <Shimmer className="h-4 w-10 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonFeed({ count = 4 }: { count?: number }) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonPostCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="mx-auto w-full max-w-[640px] pb-4">
      <Shimmer className="h-32 w-full sm:h-40" />
      <div className="px-4 pt-5 sm:px-5">
        <div className="flex items-start justify-between gap-4">
          <div className="-mt-10">
            <Shimmer className="h-[76px] w-[76px] rounded-full ring-4 ring-background" />
          </div>
          <Shimmer className="h-9 w-28 rounded-full" />
        </div>
        <div className="mt-3 space-y-2.5">
          <Shimmer className="h-5 w-40" />
          <Shimmer className="h-4 w-24" />
          <div className="space-y-1.5 pt-1">
            <Shimmer className="h-3.5 w-full" />
            <Shimmer className="h-3.5 w-3/4" />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Shimmer className="h-6 w-20 rounded-full" />
          <Shimmer className="h-6 w-28 rounded-full" />
        </div>
        <div className="mt-3 flex gap-5">
          <Shimmer className="h-4 w-24" />
          <Shimmer className="h-4 w-24" />
        </div>
      </div>
      <div className="mt-4 border-t border-border">
        <SkeletonFeed count={3} />
      </div>
    </div>
  );
}

export function SkeletonConversationRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
      <Shimmer className="h-12 w-12 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Shimmer className="h-3.5 w-32" />
        <Shimmer className="h-3 w-48" />
      </div>
      <Shimmer className="h-3 w-10" />
    </div>
  );
}

export function SkeletonConversations({ count = 5 }: { count?: number }) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonConversationRow key={i} />
      ))}
    </div>
  );
}

export function SkeletonNotificationRow() {
  return (
    <div className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
      <Shimmer className="h-8 w-8 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Shimmer className="h-7 w-7 rounded-full" />
          <Shimmer className="h-3.5 w-32" />
        </div>
        <Shimmer className="ml-[38px] h-3 w-3/4" />
        <Shimmer className="ml-[38px] h-2.5 w-16" />
      </div>
    </div>
  );
}

export function SkeletonNotifications({ count = 5 }: { count?: number }) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonNotificationRow key={i} />
      ))}
    </div>
  );
}

export function SkeletonMessageBubble({ align = "left" }: { align?: "left" | "right" }) {
  const isRight = align === "right";
  return (
    <div className={cn("flex w-full", isRight ? "justify-end" : "justify-start")}>
      <Shimmer className={cn("h-9 rounded-2xl", isRight ? "w-44 rounded-br-md" : "w-52 rounded-bl-md")} />
    </div>
  );
}

export function SkeletonConversation() {
  return (
    <div className="space-y-3 px-4 py-4 sm:px-5">
      <SkeletonMessageBubble align="left" />
      <SkeletonMessageBubble align="left" />
      <SkeletonMessageBubble align="right" />
      <SkeletonMessageBubble align="left" />
      <SkeletonMessageBubble align="right" />
    </div>
  );
}

export function SkeletonExploreCard() {
  return (
    <div className="px-4 py-3 sm:px-5">
      <Shimmer className="h-4 w-32" />
      <div className="mt-3 flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Shimmer key={i} className="h-7 w-20 rounded-full" />
        ))}
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 px-6 py-16 text-center", className)}>
      {Icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <div>
        <h3 className="text-[17px] font-semibold text-foreground">{title}</h3>
        {description && <p className="mt-1 text-[14px] text-muted-foreground text-balance">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  right,
  back,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  back?: () => void;
}) {
  return (
    <div className="sticky top-14 z-20 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-md lg:top-0">
      {back && (
        <button onClick={back} className="-ml-1 rounded-full p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground" aria-label="Back">
          ←
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[18px] font-bold leading-tight">{title}</h1>
        {subtitle && <p className="truncate text-[13px] text-muted-foreground">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}
