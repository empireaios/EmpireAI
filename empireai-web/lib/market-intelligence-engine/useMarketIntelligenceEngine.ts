"use client";

import { useCallback, useEffect, useState } from "react";
import type { MarketIntelligenceEngine } from "@/lib/market-intelligence-engine/types";

const POLL_MS = 5_000;

type MarketIntelligenceEnginePayload = {
  computedAt: string;
  live?: boolean;
  marketIntelligenceEngine: MarketIntelligenceEngine;
};

export function useMarketIntelligenceEngine() {
  const [data, setData] = useState<MarketIntelligenceEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/market-intelligence-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as MarketIntelligenceEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Market Intelligence Engine");
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
    view: data?.marketIntelligenceEngine ?? null,
    live: data?.live ?? false,
  };
}
