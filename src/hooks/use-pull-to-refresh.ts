"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Pull-to-refresh hook for touch devices.
 * Returns: { pullDistance, isRefreshing, pullProgress }
 * - pullDistance: how far the user has pulled (px)
 * - isRefreshing: whether a refresh is in progress
 * - pullProgress: 0-1 for spinner opacity
 *
 * Usage:
 * const { pullDistance, isRefreshing } = usePullToRefresh(async () => {
 *   await refetch();
 * });
 */
export function usePullToRefresh(onRefresh: () => Promise<void>, enabled = true) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const pulling = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const onTouchStart = (e: TouchEvent) => {
      // Only start pull-to-refresh when scrolled to top
      if (window.scrollY > 0) return;
      startY.current = e.touches[0].clientY;
      pulling.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startY.current === null || isRefreshing) return;
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      if (diff > 0 && window.scrollY <= 0) {
        // Pulling down at the top of the page
        pulling.current = true;
        const resistance = 0.5; // dampen the pull
        const distance = Math.min(diff * resistance, 80);
        setPullDistance(distance);
      }
    };

    const onTouchEnd = async () => {
      if (!pulling.current) {
        startY.current = null;
        return;
      }
      pulling.current = false;
      startY.current = null;

      if (pullDistance > 60) {
        // Trigger refresh
        setIsRefreshing(true);
        setPullDistance(40); // hold at spinner position
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [enabled, isRefreshing, pullDistance, onRefresh]);

  return {
    pullDistance,
    isRefreshing,
    pullProgress: Math.min(pullDistance / 60, 1),
  };
}
