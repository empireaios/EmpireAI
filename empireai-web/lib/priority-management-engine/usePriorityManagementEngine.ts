"use client";

import { subscribeRead } from "@/lib/cockpit/subscribe-read";

import { useCallback, useEffect, useState } from "react";
import type { PriorityManagementEngine } from "@/lib/priority-management-engine/types";

const POLL_MS = 5_000;

type PriorityManagementEnginePayload = {
  computedAt: string;
  live?: boolean;
  priorityManagementEngine: PriorityManagementEngine;
};

export function usePriorityManagementEngine() {
  const [data, setData] = useState<PriorityManagementEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/priority-management-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as PriorityManagementEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Priority Management Engine");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => subscribeRead(reload, POLL_MS), [reload]);

  return {
    data,
    loading,
    error,
    reload,
    view: data?.priorityManagementEngine ?? null,
    live: data?.live ?? false,
  };
}
