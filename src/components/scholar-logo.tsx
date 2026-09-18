"use client";

import { cn } from "@/lib/utils";

export function ScholarLogo({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <div className={cn("flex items-center gap-2 select-none", className)} style={{ height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden
      >
        {/* graduation cap mark */}
        <path
          d="M16 5L29 11L16 17L3 11L16 5Z"
          fill="currentColor"
          className="text-foreground"
        />
        <path
          d="M8 13.5V19C8 19 11 21.5 16 21.5C21 21.5 24 19 24 19V13.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-foreground"
          fill="none"
        />
        <path
          d="M29 11V18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-foreground"
        />
      </svg>
      <span className="text-[19px] font-semibold tracking-tight text-foreground">Scholar</span>
    </div>
  );
}
