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

  // Block ALL interaction with the app behind the lightbox
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Backspace") { e.preventDefault(); e.stopPropagation(); onClose(); }
      else if (e.key === "ArrowLeft" && media.length > 1) goPrev();
      else if (e.key === "ArrowRight" && media.length > 1) goNext();
    };

    // Block all clicks/touches on the body behind the lightbox
    const blockEvent = (e: Event) => { e.preventDefault(); e.stopPropagation(); };

    window.addEventListener("keydown", onKey, true);
    document.body.style.overflow = "hidden";
    document.body.style.pointerEvents = "none"; // block all interaction behind

    return () => {
      window.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = "";
      document.body.style.pointerEvents = "";
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

  return (
    // Separate full-screen page — completely isolated from the app
    // pointerEvents:auto on this div so it receives all touches
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-black"
      style={{ pointerEvents: "auto", touchAction: "manipulation" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ─── Top bar ─── */}
      <div className="flex shrink-0 items-center justify-between px-4 py-3" style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top, 0px))" }}>
        {/* Back button — uses mousedown to fire before any other handler */}
        <button
          type="button"
          onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20"
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
          onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* ─── Media area ─── */}
      <div className="flex flex-1 items-center justify-center overflow-hidden">
        {/* Prev button */}
        {media.length > 1 && (
          <button
            type="button"
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); goPrev(); }}
            className="absolute left-3 z-10 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20"
            aria-label="Previous"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
        )}

        {/* Media content */}
        <div className="flex max-h-full max-w-full items-center justify-center p-4">
          {imgError ? (
            <div className="flex flex-col items-center gap-3 text-white/60">
              <p className="text-[15px]">Couldn't load media</p>
              <button
                onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
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
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); goNext(); }}
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
