"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExecutiveBudgetPlanner } from "@/lib/executive-budget-planner/types";

const POLL_MS = 5_000;

type ExecutiveBudgetPlannerPayload = {
  computedAt: string;
  live?: boolean;
  executiveBudgetPlanner: ExecutiveBudgetPlanner;
};

export function useExecutiveBudgetPlanner() {
  const [data, setData] = useState<ExecutiveBudgetPlannerPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/executive-budget-planner", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ExecutiveBudgetPlannerPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Executive Budget Planner");
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
    view: data?.executiveBudgetPlanner ?? null,
    live: data?.live ?? false,
  };
}
