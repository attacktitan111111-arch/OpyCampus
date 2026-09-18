"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GraduationMark } from "./graduation-mark";
import { useMounted } from "@/hooks/use-mounted";

/**
 * Branded splash screen — shows for ~1s on app load, then fades out.
 * Client-only: renders null on the server to avoid hydration mismatch.
 */
export function SplashScreen({ visible }: { visible: boolean }) {
  const mounted = useMounted();
  // Don't render anything on the server — prevents hydration mismatch
  if (!mounted) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="opycampus-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
          aria-hidden
        >
          <SplashInner />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SplashInner() {
  const word = "OpyCampus";
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative flex h-20 w-20 items-center justify-center">
        <span className="absolute inset-0 -m-2 animate-ring-pulse rounded-full" />
        <GraduationMark
          size={56}
          variant="stroke"
          strokeAnimate
          className="text-foreground"
        />
      </div>
      <div className="flex items-baseline gap-0.5">
        {word.split("").map((c, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 8, filter: "blur(2px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{
              delay: 0.5 + i * 0.045,
              duration: 0.32,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="text-[26px] font-semibold tracking-tight text-foreground"
          >
            {c}
          </motion.span>
        ))}
      </div>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.4 }}
        className="text-[12px] font-medium text-muted-foreground"
      >
        campus social, reimagined
      </motion.span>
    </div>
  );
}

/**
 * Convenience hook that holds the splash visible for at least `minMs`
 * milliseconds. Client-only — returns false on server, true on client after
 * mount, then false again after the timer expires.
 */
export function useSplashTimer(minMs = 900) {
  const mounted = useMounted();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!mounted) return;
    const t = window.setTimeout(() => setDone(true), minMs);
    return () => window.clearTimeout(t);
  }, [minMs, mounted]);

  // Splash is visible when mounted but not yet done
  return mounted && !done;
}
