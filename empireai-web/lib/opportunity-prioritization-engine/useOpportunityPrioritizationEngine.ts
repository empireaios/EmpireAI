"use client";

import { useCallback, useEffect, useState } from "react";
import type { OpportunityPrioritizationEngine } from "@/lib/opportunity-prioritization-engine/types";

const POLL_MS = 5_000;

type OpportunityPrioritizationEnginePayload = {
  computedAt: string;
  live?: boolean;
  opportunityPrioritizationEngine: OpportunityPrioritizationEngine;
};

export function useOpportunityPrioritizationEngine() {
  const [data, setData] = useState<OpportunityPrioritizationEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/opportunity-prioritization-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as OpportunityPrioritizationEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Opportunity Prioritization Engine");
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
    view: data?.opportunityPrioritizationEngine ?? null,
    live: data?.live ?? false,
  };
}
