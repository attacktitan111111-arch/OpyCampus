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
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-secondary/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-secondary",
        className
      )}
    >
      {institution.isPrivate ? <Lock className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
      <span className="truncate max-w-[160px]">{institution.name}</span>
    </span>
  );
}
