"use client";

import { useCallback, useEffect, useState } from "react";
import type { FinancialScenarioEngine } from "@/lib/financial-scenario-engine/types";

const POLL_MS = 5_000;

type FinancialScenarioEnginePayload = {
  computedAt: string;
  live?: boolean;
  financialScenarioEngine: FinancialScenarioEngine;
};

export function useFinancialScenarioEngine() {
  const [data, setData] = useState<FinancialScenarioEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/financial-scenario-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as FinancialScenarioEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Financial Scenario Engine");
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
    view: data?.financialScenarioEngine ?? null,
    live: data?.live ?? false,
  };
}
