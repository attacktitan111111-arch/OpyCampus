"use client";

import { cn } from "@/lib/utils";

// A premium 4-point spark / "discover" icon that complements the Scholar graduation-cap mark.
// Used for the "For you" feed — evokes AI recommendations & discovery.
export function SparkIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-[26px] w-[26px]", className)}
      aria-hidden
    >
      {/* main 4-point star */}
      <path
        d="M12 2.5C12.9 7.1 16.9 11.1 21.5 12C16.9 12.9 12.9 16.9 12 21.5C11.1 16.9 7.1 12.9 2.5 12C7.1 11.1 11.1 7.1 12 2.5Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        className="text-foreground"
      />
      {/* small accent spark */}
      <path
        d="M18.5 4.5C18.8 5.6 19.4 6.2 20.5 6.5C19.4 6.8 18.8 7.4 18.5 8.5C18.2 7.4 17.6 6.8 16.5 6.5C17.6 6.2 18.2 5.6 18.5 4.5Z"
        fill="currentColor"
        stroke="none"
        className="text-foreground"
        opacity={filled ? 1 : 0.7}
      />
    </svg>
  );
}

// Community / group icon — three figures forming a cluster
export function CommunityIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-[26px] w-[26px]", className)}
      aria-hidden
    >
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17" cy="9.5" r="2.3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M3.5 19C3.5 15.96 6.13 13.5 9.5 13.5C9.67 13.5 9.84 13.5 10 13.53M14 19C14 16.79 16 15 18.5 15C18.8 15 19.1 15.03 19.4 15.08"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// School / institution icon — building with a flag
export function SchoolIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-[26px] w-[26px]", className)}
      aria-hidden
    >
      <path d="M12 3L3 8L12 13L21 8L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M7 10.5V15C7 15 9 17 12 17C15 17 17 15 17 15V10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 8V13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
