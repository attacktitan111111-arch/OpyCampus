"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import type { MediaItem } from "@/lib/hooks";
import { useMounted } from "@/hooks/use-mounted";
import { useApp } from "@/lib/hooks";

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
  const [imgLoaded, setImgLoaded] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const { back } = useApp();

  const goPrev = useCallback(() => { setIndex((i) => (i - 1 + media.length) % media.length); setImgError(false); setImgLoaded(false); }, [media.length]);
  const goNext = useCallback(() => { setIndex((i) => (i + 1) % media.length); setImgError(false); setImgLoaded(false); }, [media.length]);

  // Close via onClose OR browser back
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Backspace") { e.preventDefault(); e.stopPropagation(); handleClose(); }
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
  }, [handleClose, goPrev, goNext, media.length]);

  const current = media[index];
  // Build absolute URL
  const mediaUrl = current.url.startsWith("http")
    ? current.url
    : (typeof window !== "undefined" ? `${window.location.origin}${current.url}` : current.url);

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
    // Dedicated full-screen page — completely separate from the app
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-black"
      style={{ touchAction: "manipulation" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      {/* ─── Top bar — ONLY a big back button, no X ─── */}
      <div className="flex shrink-0 items-center px-4 py-3" style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top, 0px))" }}>
        {/* Big back button — uses onClick, also calls browser back */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleClose(); }}
          onPointerDown={(e) => { e.stopPropagation(); }}
          className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20 active:scale-95"
          aria-label="Go back"
        >
          <ArrowLeft className="h-6 w-6" strokeWidth={2.5} />
        </button>

        {/* Counter */}
        {media.length > 1 && (
          <div className="ml-3 rounded-full bg-white/10 px-3 py-1 text-[14px] font-medium text-white backdrop-blur-md">
            {index + 1} / {media.length}
          </div>
        )}
      </div>

      {/* ─── Media area ─── */}
      <div className="flex flex-1 items-center justify-center overflow-hidden">
        {/* Prev button */}
        {media.length > 1 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            onPointerDown={(e) => { e.stopPropagation(); }}
            className="absolute left-3 z-10 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20 active:scale-95"
            aria-label="Previous"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
        )}

        {/* Media content */}
        <div className="flex max-h-full max-w-full items-center justify-center p-4" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
          {imgError ? (
            <div className="flex flex-col items-center gap-4 text-white/60">
              <p className="text-[16px]">Couldn't load image</p>
              <button
                onClick={(e) => { e.stopPropagation(); handleClose(); }}
                onPointerDown={(e) => { e.stopPropagation(); }}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-white/10 px-5 text-[15px] font-medium text-white transition hover:bg-white/20 active:scale-95"
              >
                <ArrowLeft className="h-5 w-5" /> Go back
              </button>
            </div>
          ) : (
            <>
              {/* Loading spinner while image loads */}
              {!imgLoaded && current.type !== "video" && (
                <div className="absolute h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              )}
              {current.type === "video" ? (
                <video
                  src={mediaUrl}
                  controls
                  playsInline
                  autoPlay
                  className="max-h-[85dvh] max-w-[95vw] rounded-lg object-contain"
                  onError={() => setImgError(true)}
                />
              ) : (
                <img
                  src={mediaUrl}
                  alt=""
                  className="max-h-[85dvh] max-w-[95vw] rounded-lg object-contain"
                  draggable={false}
                  onLoad={() => setImgLoaded(true)}
                  onError={() => { setImgError(true); setImgLoaded(true); }}
                />
              )}
            </>
          )}
        </div>

        {/* Next button */}
        {media.length > 1 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            onPointerDown={(e) => { e.stopPropagation(); }}
            className="absolute right-3 z-10 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20 active:scale-95"
            aria-label="Next"
          >
            <ChevronRight className="h-7 w-7" />
          </button>
        )}
      </div>
    </div>
  );
}
