"use client";

import { useSyncExternalStore } from "react";

// Returns false during SSR/first render, true after hydration on the client.
// Avoids the setState-in-effect pattern for mount detection.
export function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}
