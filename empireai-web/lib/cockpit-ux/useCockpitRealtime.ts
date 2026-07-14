"use client";

import { useCallback } from "react";
import { useBrainEvents } from "@/lib/brain/hooks/useBrainEvents";
import type { BrainEvent } from "@/lib/brain/types";

const REFRESH_EVENT_TYPES = new Set<BrainEvent["type"]>([
  "task_complete",
  "workflow_completed",
  "workflow_failed",
  "escalation",
  "approval_needed",
  "workflow_started",
  "decision_made",
]);

/**
 * P7-02 — Near real-time Cockpit refresh via Brain SSE + polling fallback.
 */
export function useCockpitRealtime(handlers: {
  onRefresh?: () => void;
  enabled?: boolean;
}) {
  const { enabled = true, onRefresh } = handlers;

  const handleEvent = useCallback(
    (event: BrainEvent) => {
      if (REFRESH_EVENT_TYPES.has(event.type)) {
        onRefresh?.();
      }
    },
    [onRefresh],
  );

  const { connected } = useBrainEvents(handleEvent, { enabled: enabled && Boolean(onRefresh) });

  return { sseConnected: connected };
}
