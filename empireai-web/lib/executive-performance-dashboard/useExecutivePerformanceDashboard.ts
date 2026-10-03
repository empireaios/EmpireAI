"use client";

import { subscribeRead } from "@/lib/cockpit/subscribe-read";

import { useCallback, useEffect, useState } from "react";
import type { ExecutivePerformanceDashboard } from "@/lib/executive-performance-dashboard/types";

const POLL_MS = 5_000;

type ExecutivePerformanceDashboardPayload = {
  computedAt: string;
  live?: boolean;
  executivePerformanceDashboard: ExecutivePerformanceDashboard;
};

export function useExecutivePerformanceDashboard() {
  const [data, setData] = useState<ExecutivePerformanceDashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/executive-performance-dashboard", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ExecutivePerformanceDashboardPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Executive Performance Dashboard");
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
    view: data?.executivePerformanceDashboard ?? null,
    live: data?.live ?? false,
  };
}
