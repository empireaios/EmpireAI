"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExecutiveInsightEngine } from "@/lib/executive-insight-engine/types";

const POLL_MS = 5_000;

type ExecutiveInsightEnginePayload = {
  computedAt: string;
  live?: boolean;
  executiveInsightEngine: ExecutiveInsightEngine;
};

export function useExecutiveInsightEngine() {
  const [data, setData] = useState<ExecutiveInsightEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/executive-insight-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ExecutiveInsightEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Executive Insight Engine");
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
    view: data?.executiveInsightEngine ?? null,
    live: data?.live ?? false,
  };
}
