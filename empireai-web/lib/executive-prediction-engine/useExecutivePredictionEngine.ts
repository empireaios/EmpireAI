"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExecutivePredictionEngine } from "@/lib/executive-prediction-engine/types";

const POLL_MS = 5_000;

type ExecutivePredictionEnginePayload = {
  computedAt: string;
  live?: boolean;
  executivePredictionEngine: ExecutivePredictionEngine;
};

export function useExecutivePredictionEngine() {
  const [data, setData] = useState<ExecutivePredictionEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/executive-prediction-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ExecutivePredictionEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Executive Prediction Engine");
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
    view: data?.executivePredictionEngine ?? null,
    live: data?.live ?? false,
  };
}
