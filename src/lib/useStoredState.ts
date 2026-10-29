"use client";

import { useEffect, useState } from "react";

/**
 * Like useState, but remembered in this browser's localStorage so people
 * don't lose their work on refresh. Nothing here is sent to a database.
 */
export function useStoredState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) setValue({ ...initial, ...JSON.parse(raw) });
    } catch {
      // Storage can be blocked (private windows); just start fresh.
    }
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore; the app still works without saving.
    }
  }, [key, value, loaded]);

  return [value, setValue, loaded] as const;
}
