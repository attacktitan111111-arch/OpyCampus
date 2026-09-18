"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useMounted } from "./use-mounted";

/**
 * SSR-safe localStorage hook.
 *
 * Returns `[value, setValue, hydrated]`:
 *  - `value` is `defaultValue` on the server and the first client render
 *    (so it matches the SSR snapshot), then flips to whatever is in
 *    localStorage after the client mounts and re-renders.
 *  - `setValue` persists to localStorage AND notifies all other
 *    components using the same key so they re-render too. Accepts either
 *    a plain value or an updater function (like React's setState).
 *  - `hydrated` flips to true once we've rendered on the client. Use it
 *    to gate UI that should look different before vs. after localStorage
 *    is read (e.g. `checked={hydrated ? value : false}`).
 *
 * Implementation notes:
 *  - We use `useSyncExternalStore` (not `useEffect`) to avoid the
 *    React 19 "setState in effect" anti-pattern.
 *  - A module-level Map of listeners lets writes notify every component
 *    subscribed to the same key — so two toggles bound to the same key
 *    stay in sync.
 *
 * Keys are namespaced with the `opycampus:` prefix in callers.
 */

const listeners = new Map<string, Set<() => void>>();

function subscribeKey(key: string, cb: () => void): () => void {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(cb);
  return () => {
    set.delete(cb);
    if (set.size === 0) listeners.delete(key);
  };
}

function getSnapshotKey(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function getServerSnapshot(): null {
  return null;
}

function notifyKey(key: string) {
  const set = listeners.get(key);
  if (set) {
    // Copy to array so removing listeners during iteration is safe.
    [...set].forEach((cb) => cb());
  }
}

export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (next: T | ((prev: T) => T)) => void, boolean] {
  const hydrated = useMounted();
  const raw = useSyncExternalStore(
    (cb) => subscribeKey(key, cb),
    () => getSnapshotKey(key),
    getServerSnapshot
  );

  // Parse the raw value (or fall back to the default)
  let value: T;
  if (raw !== null) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = defaultValue;
    }
  } else {
    value = defaultValue;
  }

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      try {
        const currentRaw = window.localStorage.getItem(key);
        let prev: T;
        if (currentRaw !== null) {
          try {
            prev = JSON.parse(currentRaw) as T;
          } catch {
            prev = defaultValue;
          }
        } else {
          prev = defaultValue;
        }
        const v =
          typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        window.localStorage.setItem(key, JSON.stringify(v));
        // Notify all other subscribers of this key (and ourselves —
        // useSyncExternalStore will diff and skip if unchanged).
        notifyKey(key);
      } catch {
        /* ignore — quota or private mode */
      }
    },
    [key, defaultValue]
  );

  return [value, setValue, hydrated];
}
