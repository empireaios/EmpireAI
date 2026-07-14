"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExecutiveScenarioPlanner } from "@/lib/executive-scenario-planner/types";

const POLL_MS = 5_000;

type ExecutiveScenarioPlannerPayload = {
  computedAt: string;
  live?: boolean;
  executiveScenarioPlanner: ExecutiveScenarioPlanner;
};

export function useExecutiveScenarioPlanner() {
  const [data, setData] = useState<ExecutiveScenarioPlannerPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/executive-scenario-planner", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ExecutiveScenarioPlannerPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Executive Scenario Planner");
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
    view: data?.executiveScenarioPlanner ?? null,
    live: data?.live ?? false,
  };
}
