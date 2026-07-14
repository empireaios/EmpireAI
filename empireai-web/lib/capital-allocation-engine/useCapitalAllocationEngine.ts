"use client";

import { useCallback, useEffect, useState } from "react";
import type { CapitalAllocationEngine } from "@/lib/capital-allocation-engine/types";

const POLL_MS = 5_000;

type CapitalAllocationEnginePayload = {
  computedAt: string;
  live?: boolean;
  capitalAllocationEngine: CapitalAllocationEngine;
};

export function useCapitalAllocationEngine() {
  const [data, setData] = useState<CapitalAllocationEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/capital-allocation-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as CapitalAllocationEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Capital Allocation Engine");
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
    view: data?.capitalAllocationEngine ?? null,
    live: data?.live ?? false,
  };
}
