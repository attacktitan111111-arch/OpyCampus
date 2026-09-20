"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { MediaItem } from "@/lib/hooks";

interface MediaLightboxProps {
  /** List of media items to display. */
  media: MediaItem[];
  /** Index of the media item to show first when opened. */
  initialIndex?: number;
  /** Whether the lightbox is open. */
  open: boolean;
  /** Called when the user requests to close (Escape, backdrop click, X button). */
  onClose: () => void;
}

/**
 * Fullscreen media viewer for posts.
 *
 * - Black background, centered media.
 * - Click anywhere outside the media (or press Escape) to close.
 * - X close button in the top-right.
 * - Multiple images: prev/next chevrons + arrow-key navigation + touch swipe.
 * - Videos render with native controls.
 * - Animates in with a fade + scale effect (framer-motion).
 *
 * The visible carousel content is mounted fresh every time `open` flips to true
 * (via a child component keyed by the open state). This lets us initialize the
 * visible index from `initialIndex` without a setState-in-effect — React mounts
 * the child, useState seeds it, and unmounts cleanly on close.
 */
export function MediaLightbox({ media, initialIndex = 0, open, onClose }: MediaLightboxProps) {
  return (
    <AnimatePresence>
      {open && media.length > 0 ? (
        <MediaLightboxInner
          key="media-lightbox"
          media={media}
          initialIndex={initialIndex}
          onClose={onClose}
        />
      ) : null}
    </AnimatePresence>
  );
}

function MediaLightboxInner({
  media,
  initialIndex,
  onClose,
}: {
  media: MediaItem[];
  initialIndex: number;
  onClose: () => void;
}) {
  // Seed the visible index from the requested initial index (clamped to bounds).
  // Because this child only mounts when `open` becomes true, the initializer runs
  // fresh every time the lightbox opens — no effect, no stale state.
  const [index, setIndex] = useState(() =>
    Math.max(0, Math.min(initialIndex, media.length - 1))
  );
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + media.length) % media.length);
  }, [media.length]);

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % media.length);
  }, [media.length]);

  // Keyboard navigation: Escape closes, arrows move. Lock body scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft" && media.length > 1) {
        goPrev();
      } else if (e.key === "ArrowRight" && media.length > 1) {
        goNext();
      }
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, goPrev, goNext, media.length]);

  const current = media[index];

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 no-theme-transition"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Media viewer"
    >
      {/* Close button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20 tap-highlight-none"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Counter (e.g. 2 / 4) */}
      {media.length > 1 && (
        <div className="pointer-events-none absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-[12px] font-medium text-white backdrop-blur-md">
          {index + 1} / {media.length}
        </div>
      )}

      {/* Prev / Next chevrons */}
      {media.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="absolute left-3 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20 tap-highlight-none"
            aria-label="Previous"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="absolute right-3 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20 tap-highlight-none"
            aria-label="Next"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Media */}
      <motion.div
        key={index}
        className="flex max-h-[100dvh] max-w-[100vw] items-center justify-center"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          const t = e.touches[0];
          touchStartX.current = t.clientX;
          touchStartY.current = t.clientY;
        }}
        onTouchEnd={(e) => {
          const t = e.changedTouches[0];
          const sx = touchStartX.current;
          const sy = touchStartY.current;
          touchStartX.current = null;
          touchStartY.current = null;
          if (sx == null || sy == null) return;
          const dx = t.clientX - sx;
          const dy = t.clientY - sy;
          // Only treat as a horizontal swipe if horizontal delta dominates.
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) {
            if (dx < 0) goNext();
            else goPrev();
          }
        }}
      >
        {current.type === "video" ? (
          <video
            src={current.url}
            controls
            playsInline
            autoPlay
            className="max-h-[88dvh] max-w-[92vw] rounded-lg object-contain"
          />
        ) : (
          <img
            src={current.url}
            alt=""
            className="max-h-[88dvh] max-w-[92vw] rounded-lg object-contain"
            draggable={false}
          />
        )}
      </motion.div>
    </motion.div>
  );
}
