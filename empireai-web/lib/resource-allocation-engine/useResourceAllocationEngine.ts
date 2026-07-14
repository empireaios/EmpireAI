"use client";

import { useCallback, useEffect, useState } from "react";
import type { ResourceAllocationEngine } from "@/lib/resource-allocation-engine/types";

const POLL_MS = 5_000;

type ResourceAllocationEnginePayload = {
  computedAt: string;
  live?: boolean;
  resourceAllocationEngine: ResourceAllocationEngine;
};

export function useResourceAllocationEngine() {
  const [data, setData] = useState<ResourceAllocationEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/resource-allocation-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ResourceAllocationEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Resource Allocation Engine");
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
    view: data?.resourceAllocationEngine ?? null,
    live: data?.live ?? false,
  };
}
