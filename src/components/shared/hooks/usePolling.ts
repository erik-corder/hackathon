"use client";

import { useEffect, useRef } from "react";

/**
 * Generic interval-based polling hook. Cleans up on unmount or when `enabled`
 * flips to `false`, so callers can bound request volume (e.g. only poll while
 * at least one job is non-terminal — see `useGenerationHistory`).
 */
export function usePolling(callback: () => void | Promise<void>, intervalMs: number, enabled: boolean): void {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const intervalId = setInterval(() => {
      void callbackRef.current();
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [intervalMs, enabled]);
}
