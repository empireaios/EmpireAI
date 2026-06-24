"use client";

import { useEffect, useRef, useState } from "react";
import { connectBrainEvents } from "@/lib/brain/client";
import type { BrainEvent } from "@/lib/brain/types";

export function useBrainEvents(
  handler: (event: BrainEvent) => void,
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? true;
  const handlerRef = useRef(handler);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return;

    const disconnect = connectBrainEvents(
      (event) => {
        if (event.type === "connected") {
          setConnected(true);
          return;
        }
        handlerRef.current(event);
      },
      () => setConnected(false),
    );

    return disconnect;
  }, [enabled]);

  return { connected };
}
