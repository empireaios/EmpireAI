"use client";

import { useCallback, useEffect, useState } from "react";
import type { CrisisDecisionEngine } from "@/lib/crisis-decision-engine/types";

const POLL_MS = 5_000;

type CrisisDecisionEnginePayload = {
  computedAt: string;
  live?: boolean;
  crisisDecisionEngine: CrisisDecisionEngine;
};

export function useCrisisDecisionEngine() {
  const [data, setData] = useState<CrisisDecisionEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/crisis-decision-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as CrisisDecisionEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Crisis Decision Engine");
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
    view: data?.crisisDecisionEngine ?? null,
    live: data?.live ?? false,
  };
}
