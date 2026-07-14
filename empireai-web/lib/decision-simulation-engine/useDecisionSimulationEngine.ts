"use client";

import { useCallback, useEffect, useState } from "react";
import type { DecisionSimulationEngine } from "@/lib/decision-simulation-engine/types";

const POLL_MS = 5_000;

type DecisionSimulationEnginePayload = {
  computedAt: string;
  live?: boolean;
  decisionSimulationEngine: DecisionSimulationEngine;
};

export function useDecisionSimulationEngine() {
  const [data, setData] = useState<DecisionSimulationEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/decision-simulation-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as DecisionSimulationEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Decision Simulation Engine");
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
    view: data?.decisionSimulationEngine ?? null,
    live: data?.live ?? false,
  };
}
