"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import type { MediaItem } from "@/lib/hooks";
import { useMounted } from "@/hooks/use-mounted";

interface MediaLightboxProps {
  media: MediaItem[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
}

export function MediaLightbox({ media, initialIndex = 0, open, onClose }: MediaLightboxProps) {
  const mounted = useMounted();
  if (!open || media.length === 0 || !mounted) return null;

  return createPortal(
    <MediaLightboxInner media={media} initialIndex={initialIndex} onClose={onClose} />,
    document.body
  );
}

function MediaLightboxInner({ media, initialIndex, onClose }: { media: MediaItem[]; initialIndex: number; onClose: () => void }) {
  const [index, setIndex] = useState(() => Math.max(0, Math.min(initialIndex, media.length - 1)));
  const [imgError, setImgError] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const goPrev = useCallback(() => { setIndex((i) => (i - 1 + media.length) % media.length); setImgError(false); }, [media.length]);
  const goNext = useCallback(() => { setIndex((i) => (i + 1) % media.length); setImgError(false); }, [media.length]);

  // Keyboard + body scroll lock
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Backspace") { e.preventDefault(); e.stopPropagation(); onClose(); }
      else if (e.key === "ArrowLeft" && media.length > 1) goPrev();
      else if (e.key === "ArrowRight" && media.length > 1) goNext();
    };
    window.addEventListener("keydown", onKey, true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, goPrev, goNext, media.length]);

  const current = media[index];
  const mediaUrl = current.url.startsWith("http") ? current.url : (typeof window !== "undefined" ? `${window.location.origin}${current.url}` : current.url);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) goNext();
      else goPrev();
    }
  };

  // THE KEY: This is a true modal overlay.
  // 1. It's rendered via portal to document.body (outside all app DOM)
  // 2. It covers the entire screen (fixed inset-0)
  // 3. It has z-[200] (above everything)
  // 4. The backdrop div captures ALL touch/click events and stops them
  // 5. Only the buttons inside receive clicks
  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-black"
      style={{ touchAction: "manipulation" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      // This onClick + onPointerDown on the ROOT div catches everything
      // and stops it from reaching the app behind
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      {/* ─── Top bar ─── */}
      <div className="flex shrink-0 items-center justify-between px-4 py-3" style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top, 0px))" }}>
        {/* Back button */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          onPointerDown={(e) => { e.stopPropagation(); }}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20 z-10"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {/* Counter */}
        {media.length > 1 && (
          <div className="rounded-full bg-white/10 px-3 py-1 text-[13px] font-medium text-white backdrop-blur-md">
            {index + 1} / {media.length}
          </div>
        )}

        {/* Close X button */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          onPointerDown={(e) => { e.stopPropagation(); }}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20 z-10"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* ─── Media area — tapping here does nothing (no onClose on backdrop) ─── */}
      <div className="flex flex-1 items-center justify-center overflow-hidden">
        {/* Prev button */}
        {media.length > 1 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            onPointerDown={(e) => { e.stopPropagation(); }}
            className="absolute left-3 z-10 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20"
            aria-label="Previous"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
        )}

        {/* Media content */}
        <div className="flex max-h-full max-w-full items-center justify-center p-4" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
          {imgError ? (
            <div className="flex flex-col items-center gap-3 text-white/60">
              <p className="text-[15px]">Couldn't load media</p>
              <button
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                onPointerDown={(e) => { e.stopPropagation(); }}
                className="rounded-full bg-white/10 px-4 py-2 text-[14px] text-white transition hover:bg-white/20"
              >
                Go back
              </button>
            </div>
          ) : current.type === "video" ? (
            <video src={mediaUrl} controls playsInline autoPlay className="max-h-[85dvh] max-w-[95vw] rounded-lg object-contain" />
          ) : (
            <img
              src={mediaUrl}
              alt=""
              className="max-h-[85dvh] max-w-[95vw] rounded-lg object-contain"
              draggable={false}
              onError={() => setImgError(true)}
            />
          )}
        </div>

        {/* Next button */}
        {media.length > 1 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            onPointerDown={(e) => { e.stopPropagation(); }}
            className="absolute right-3 z-10 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20"
            aria-label="Next"
          >
            <ChevronRight className="h-7 w-7" />
          </button>
        )}
      </div>
    </div>
  );
}
