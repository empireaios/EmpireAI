"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExecutiveResilienceEngine } from "@/lib/executive-resilience-engine/types";

const REFRESH_MS = 5000;

type ExecutiveResilienceEnginePayload = {
  computedAt: string;
  live?: boolean;
  executiveResilienceEngine: ExecutiveResilienceEngine;
};

export function useExecutiveResilienceEngine() {
  const [data, setData] = useState<ExecutiveResilienceEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/pillow/executive-resilience-engine", { credentials: "include" });
      if (!res.ok) {
        throw new Error(`Executive Resilience Engine unavailable (${res.status})`);
      }
      setData((await res.json()) as ExecutiveResilienceEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Executive Resilience Engine");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    const id = setInterval(() => void reload(), REFRESH_MS);
    return () => clearInterval(id);
  }, [reload]);

  const view = data?.executiveResilienceEngine ?? null;
  const live = data?.live !== false;

  return { data, view, loading, error, reload, live };
}
