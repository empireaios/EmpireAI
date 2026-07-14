"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExecutiveAccountabilityEngine } from "@/lib/executive-accountability-engine/types";

const POLL_MS = 5_000;

type ExecutiveAccountabilityEnginePayload = {
  computedAt: string;
  live?: boolean;
  executiveAccountabilityEngine: ExecutiveAccountabilityEngine;
};

export function useExecutiveAccountabilityEngine() {
  const [data, setData] = useState<ExecutiveAccountabilityEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/executive-accountability-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ExecutiveAccountabilityEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Executive Accountability Engine");
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
    view: data?.executiveAccountabilityEngine ?? null,
    live: data?.live ?? false,
  };
}
