"use client";

import { useCallback, useEffect, useState } from "react";
import type { CompetitorIntelligenceEngine } from "@/lib/competitor-intelligence-engine/types";

const POLL_MS = 5_000;

type CompetitorIntelligenceEnginePayload = {
  computedAt: string;
  live?: boolean;
  competitorIntelligenceEngine: CompetitorIntelligenceEngine;
};

export function useCompetitorIntelligenceEngine() {
  const [data, setData] = useState<CompetitorIntelligenceEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/competitor-intelligence-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as CompetitorIntelligenceEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Competitor Intelligence Engine");
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
    view: data?.competitorIntelligenceEngine ?? null,
    live: data?.live ?? false,
  };
}
