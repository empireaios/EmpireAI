"use client";

import { useCallback, useEffect, useState } from "react";
import type { LongTermGrowthPlanner } from "@/lib/long-term-growth-planner/types";

const POLL_MS = 5_000;

type LongTermGrowthPlannerPayload = {
  computedAt: string;
  live?: boolean;
  longTermGrowthPlanner: LongTermGrowthPlanner;
};

export function useLongTermGrowthPlanner() {
  const [data, setData] = useState<LongTermGrowthPlannerPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/long-term-growth-planner", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as LongTermGrowthPlannerPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Long-Term Growth Planner");
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
    view: data?.longTermGrowthPlanner ?? null,
    live: data?.live ?? false,
  };
}
