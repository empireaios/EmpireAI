"use client";

import { useCallback, useEffect, useState } from "react";
import type { CapitalRiskEngine } from "@/lib/capital-risk-engine/types";

const POLL_MS = 5_000;

type CapitalRiskEnginePayload = {
  computedAt: string;
  live?: boolean;
  capitalRiskEngine: CapitalRiskEngine;
};

export function useCapitalRiskEngine() {
  const [data, setData] = useState<CapitalRiskEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/capital-risk-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as CapitalRiskEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Capital Risk Engine");
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
    view: data?.capitalRiskEngine ?? null,
    live: data?.live ?? false,
  };
}
