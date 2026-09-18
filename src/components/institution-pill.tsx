"use client";

import { Building2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface InstInfo {
  name: string;
  handle: string;
  isPrivate: boolean;
}

export function InstitutionPill({
  institution,
  className,
}: {
  institution: InstInfo;
  className?: string;
}) {
  // Color-coded tint by privacy:
  //  - Private institutions → rose tint (suggests exclusivity / restricted access)
  //  - Public institutions  → sky tint (suggests openness / accessibility)
  const tint = institution.isPrivate
    ? "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-300 hover:bg-rose-500/15"
    : "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-300 hover:bg-sky-500/15";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors",
        tint,
        className
      )}
    >
      {institution.isPrivate ? <Lock className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
      <span className="truncate max-w-[160px]">{institution.name}</span>
    </span>
  );
}
