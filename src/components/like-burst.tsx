"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Particle burst that radiates from the like button when a post is liked.
 * Renders N small colored dots that fly outward and fade. Designed to sit
 * absolutely positioned over the heart icon, centered on it.
 */
const COLORS = [
  "#ff5a7e",
  "#ff8e6a",
  "#ffd166",
  "#8affc1",
  "#9ad8ff",
  "#c89bff",
];

export function LikeBurst({ trigger }: { trigger: number }) {
  const [bursts, setBursts] = useState<number[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    if (trigger === 0) return;
    const id = ++idRef.current;
    setBursts((b) => [...b, id]);
    const t = window.setTimeout(() => {
      setBursts((b) => b.filter((x) => x !== id));
    }, 700);
    return () => window.clearTimeout(t);
  }, [trigger]);

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible">
      <AnimatePresence>
        {bursts.map((b) => (
          <Burst key={b} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function Burst() {
  const N = 8;
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1 }}
      className="absolute inset-0 flex items-center justify-center"
    >
      {Array.from({ length: N }).map((_, i) => {
        const angle = (Math.PI * 2 * i) / N + (Math.random() - 0.5) * 0.4;
        const dist = 18 + Math.random() * 10;
        const bx = Math.cos(angle) * dist;
        const by = Math.sin(angle) * dist - 4;
        const color = COLORS[i % COLORS.length];
        const size = 4 + Math.random() * 3;
        return (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{
              width: size,
              height: size,
              background: color,
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.5 }}
            animate={{ x: bx, y: by, opacity: 0, scale: 1.2 }}
            transition={{
              duration: 0.55,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
        );
      })}
    </motion.div>
  );
}
