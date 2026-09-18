"use client";

import { cn } from "@/lib/utils";

/**
 * Branded graduation cap mark — used by the splash screen, the premium
 * loading spinner, and onboarding. Single source of truth so the brand
 * stays consistent everywhere.
 */
export function GraduationMark({
  className,
  size = 28,
  strokeAnimate = false,
  variant = "solid",
}: {
  className?: string;
  size?: number;
  /** Animate the stroke draw on mount (used by splash). */
  strokeAnimate?: boolean;
  /** "solid" = filled cap (default). "stroke" = outline only (draws in nicely). */
  variant?: "solid" | "stroke";
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      {variant === "solid" ? (
        <>
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
        </>
      ) : (
        <>
          <path
            d="M16 5L29 11L16 17L3 11L16 5Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
            className={cn("text-foreground", strokeAnimate && "animate-cap-draw")}
            fill="none"
          />
          <path
            d="M8 13.5V19C8 19 11 21.5 16 21.5C21 21.5 24 19 24 19V13.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("text-foreground", strokeAnimate && "animate-cap-draw")}
            fill="none"
            style={strokeAnimate ? { animationDelay: "0.25s" } : undefined}
          />
          <path
            d="M29 11V18"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            className={cn("text-foreground", strokeAnimate && "animate-cap-draw")}
            fill="none"
            style={strokeAnimate ? { animationDelay: "0.45s" } : undefined}
          />
        </>
      )}
    </svg>
  );
}
