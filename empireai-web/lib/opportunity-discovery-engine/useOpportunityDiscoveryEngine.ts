"use client";

import { useCallback, useEffect, useState } from "react";
import type { OpportunityDiscoveryEngine } from "@/lib/opportunity-discovery-engine/types";

const POLL_MS = 5_000;

type OpportunityDiscoveryEnginePayload = {
  computedAt: string;
  live?: boolean;
  opportunityDiscoveryEngine: OpportunityDiscoveryEngine;
};

export function useOpportunityDiscoveryEngine() {
  const [data, setData] = useState<OpportunityDiscoveryEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/opportunity-discovery-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as OpportunityDiscoveryEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Opportunity Discovery Engine");
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
    view: data?.opportunityDiscoveryEngine ?? null,
    live: data?.live ?? false,
  };
}
