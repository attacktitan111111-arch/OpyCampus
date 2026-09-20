"use client";

import { useCallback, useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { MediaItem } from "@/lib/hooks";

interface MediaLightboxProps {
  media: MediaItem[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
}

export function MediaLightbox({ media, initialIndex = 0, open, onClose }: MediaLightboxProps) {
  if (!open || media.length === 0) return null;
  return <MediaLightboxInner media={media} initialIndex={initialIndex} onClose={onClose} />;
}

function MediaLightboxInner({ media, initialIndex, onClose }: { media: MediaItem[]; initialIndex: number; onClose: () => void }) {
  const [index, setIndex] = useState(() => Math.max(0, Math.min(initialIndex, media.length - 1)));

  const goPrev = useCallback(() => setIndex((i) => (i - 1 + media.length) % media.length), [media.length]);
  const goNext = useCallback(() => setIndex((i) => (i + 1) % media.length), [media.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
      else if (e.key === "ArrowLeft" && media.length > 1) goPrev();
      else if (e.key === "ArrowRight" && media.length > 1) goNext();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose, goPrev, goNext, media.length]);

  const current = media[index];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 animate-fade-in" onClick={onClose} role="dialog" aria-modal="true" aria-label="Media viewer">
      {/* Close button */}
      <button type="button" onClick={(e) => { e.stopPropagation(); onClose(); }} className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20" aria-label="Close">
        <X className="h-6 w-6" />
      </button>

      {/* Counter */}
      {media.length > 1 && (
        <div className="pointer-events-none absolute left-1/2 top-5 z-10 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-[13px] font-medium text-white">
          {index + 1} / {media.length}
        </div>
      )}

      {/* Prev/Next */}
      {media.length > 1 && (
        <>
          <button type="button" onClick={(e) => { e.stopPropagation(); goPrev(); }} className="absolute left-3 z-10 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20" aria-label="Previous">
            <ChevronLeft className="h-7 w-7" />
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); goNext(); }} className="absolute right-3 z-10 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20" aria-label="Next">
            <ChevronRight className="h-7 w-7" />
          </button>
        </>
      )}

      {/* Media */}
      <div className="flex max-h-[100dvh] max-w-[100vw] items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
        {current.type === "video" ? (
          <video src={current.url} controls playsInline autoPlay className="max-h-[90dvh] max-w-[95vw] rounded-lg object-contain" />
        ) : (
          <img src={current.url} alt="" className="max-h-[90dvh] max-w-[95vw] rounded-lg object-contain" draggable={false} />
        )}
      </div>
    </div>
  );
}
