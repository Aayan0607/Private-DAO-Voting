"use client";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
export function BrowserReady({ children }: { children: React.ReactNode }) {
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return ready ? children : <p role="status">Opening your local workspace…</p>;
}
