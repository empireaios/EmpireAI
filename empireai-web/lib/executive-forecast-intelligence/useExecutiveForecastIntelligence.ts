"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExecutiveForecastIntelligence } from "@/lib/executive-forecast-intelligence/types";

const POLL_MS = 5_000;

type ExecutiveForecastIntelligencePayload = {
  computedAt: string;
  live?: boolean;
  executiveForecastIntelligence: ExecutiveForecastIntelligence;
};

export function useExecutiveForecastIntelligence() {
  const [data, setData] = useState<ExecutiveForecastIntelligencePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/executive-forecast-intelligence", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ExecutiveForecastIntelligencePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Executive Forecast Intelligence");
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
    view: data?.executiveForecastIntelligence ?? null,
    live: data?.live ?? false,
  };
}
