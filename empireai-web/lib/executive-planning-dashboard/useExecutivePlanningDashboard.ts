"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExecutivePlanningDashboard } from "@/lib/executive-planning-dashboard/types";

const POLL_MS = 5_000;

type ExecutivePlanningDashboardPayload = {
  computedAt: string;
  live?: boolean;
  executivePlanningDashboard: ExecutivePlanningDashboard;
};

export function useExecutivePlanningDashboard() {
  const [data, setData] = useState<ExecutivePlanningDashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/executive-planning-dashboard", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ExecutivePlanningDashboardPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Executive Planning Dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    const interval = setInterval(() => void reload(), POLL_MS);
    return () => clearInterval(interval);
  }, [reload]);

  return {
    data,
    loading,
    error,
    reload,
    view: data?.executivePlanningDashboard ?? null,
    live: data?.live ?? false,
  };
}
