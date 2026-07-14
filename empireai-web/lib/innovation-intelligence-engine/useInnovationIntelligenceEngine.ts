"use client";

import { useCallback, useEffect, useState } from "react";
import type { InnovationIntelligenceEngine } from "@/lib/innovation-intelligence-engine/types";

const POLL_MS = 5_000;

type InnovationIntelligenceEnginePayload = {
  computedAt: string;
  live?: boolean;
  innovationIntelligenceEngine: InnovationIntelligenceEngine;
};

export function useInnovationIntelligenceEngine() {
  const [data, setData] = useState<InnovationIntelligenceEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/innovation-intelligence-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as InnovationIntelligenceEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Innovation Intelligence Engine");
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
    view: data?.innovationIntelligenceEngine ?? null,
    live: data?.live ?? false,
  };
}
