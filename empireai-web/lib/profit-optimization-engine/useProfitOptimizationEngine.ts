"use client";

import { subscribeRead } from "@/lib/cockpit/subscribe-read";

import { useCallback, useEffect, useState } from "react";
import type { ProfitOptimizationEngine } from "@/lib/profit-optimization-engine/types";

const POLL_MS = 5_000;

type ProfitOptimizationEnginePayload = {
  computedAt: string;
  live?: boolean;
  profitOptimizationEngine: ProfitOptimizationEngine;
};

export function useProfitOptimizationEngine() {
  const [data, setData] = useState<ProfitOptimizationEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/profit-optimization-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ProfitOptimizationEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Profit Optimization Engine");
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
    view: data?.profitOptimizationEngine ?? null,
    live: data?.live ?? false,
  };
}
