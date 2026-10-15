"use client";

import { subscribeRead } from "@/lib/cockpit/subscribe-read";

import { useCallback, useEffect, useState } from "react";
import type { CostOptimizationEngine } from "@/lib/cost-optimization-engine/types";

const POLL_MS = 5_000;

type CostOptimizationEnginePayload = {
  computedAt: string;
  live?: boolean;
  costOptimizationEngine: CostOptimizationEngine;
};

export function useCostOptimizationEngine() {
  const [data, setData] = useState<CostOptimizationEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/cost-optimization-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as CostOptimizationEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Cost Optimization Engine");
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
    view: data?.costOptimizationEngine ?? null,
    live: data?.live ?? false,
  };
}
