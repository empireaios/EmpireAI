"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExecutiveKpiEngine } from "@/lib/executive-kpi-engine/types";

const POLL_MS = 5_000;

type ExecutiveKpiEnginePayload = {
  computedAt: string;
  live?: boolean;
  executiveKpiEngine: ExecutiveKpiEngine;
};

export function useExecutiveKpiEngine() {
  const [data, setData] = useState<ExecutiveKpiEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/executive-kpi-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ExecutiveKpiEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Executive KPI Engine");
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
    view: data?.executiveKpiEngine ?? null,
    live: data?.live ?? false,
  };
}
