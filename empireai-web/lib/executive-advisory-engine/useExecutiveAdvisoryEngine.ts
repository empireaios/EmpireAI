"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExecutiveAdvisoryEngine } from "@/lib/executive-advisory-engine/types";

const POLL_MS = 5_000;

type ExecutiveAdvisoryEnginePayload = {
  computedAt: string;
  live?: boolean;
  executiveAdvisoryEngine: ExecutiveAdvisoryEngine;
};

export function useExecutiveAdvisoryEngine() {
  const [data, setData] = useState<ExecutiveAdvisoryEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/executive-advisory-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ExecutiveAdvisoryEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Executive Advisory Engine");
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
    view: data?.executiveAdvisoryEngine ?? null,
    live: data?.live ?? false,
  };
}
