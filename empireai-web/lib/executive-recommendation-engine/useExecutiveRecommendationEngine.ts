"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExecutiveRecommendationEngine } from "@/lib/executive-recommendation-engine/types";

const POLL_MS = 5_000;

type ExecutiveRecommendationEnginePayload = {
  computedAt: string;
  live?: boolean;
  executiveRecommendationEngine: ExecutiveRecommendationEngine;
};

export function useExecutiveRecommendationEngine() {
  const [data, setData] = useState<ExecutiveRecommendationEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/executive-recommendation-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ExecutiveRecommendationEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Executive Recommendation Engine");
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
    view: data?.executiveRecommendationEngine ?? null,
    live: data?.live ?? false,
  };
}
