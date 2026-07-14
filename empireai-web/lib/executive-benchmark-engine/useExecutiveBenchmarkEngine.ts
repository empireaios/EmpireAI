"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExecutiveBenchmarkEngine } from "@/lib/executive-benchmark-engine/types";

const POLL_MS = 5_000;

type ExecutiveBenchmarkEnginePayload = {
  computedAt: string;
  live?: boolean;
  executiveBenchmarkEngine: ExecutiveBenchmarkEngine;
};

export function useExecutiveBenchmarkEngine() {
  const [data, setData] = useState<ExecutiveBenchmarkEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/executive-benchmark-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ExecutiveBenchmarkEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Executive Benchmark Engine");
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
    view: data?.executiveBenchmarkEngine ?? null,
    live: data?.live ?? false,
  };
}
