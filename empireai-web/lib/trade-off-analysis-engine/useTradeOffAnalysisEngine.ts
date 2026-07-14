"use client";

import { useCallback, useEffect, useState } from "react";
import type { TradeOffAnalysisEngine } from "@/lib/trade-off-analysis-engine/types";

const POLL_MS = 5_000;

type TradeOffAnalysisEnginePayload = {
  computedAt: string;
  live?: boolean;
  tradeOffAnalysisEngine: TradeOffAnalysisEngine;
};

export function useTradeOffAnalysisEngine() {
  const [data, setData] = useState<TradeOffAnalysisEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/trade-off-analysis-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as TradeOffAnalysisEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Trade-off Analysis Engine");
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
    view: data?.tradeOffAnalysisEngine ?? null,
    live: data?.live ?? false,
  };
}
