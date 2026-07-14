"use client";

import { useCallback, useEffect, useState } from "react";
import type { IndustryIntelligenceEngine } from "@/lib/industry-intelligence-engine/types";

const POLL_MS = 5_000;

type IndustryIntelligenceEnginePayload = {
  computedAt: string;
  live?: boolean;
  industryIntelligenceEngine: IndustryIntelligenceEngine;
};

export function useIndustryIntelligenceEngine() {
  const [data, setData] = useState<IndustryIntelligenceEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/industry-intelligence-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as IndustryIntelligenceEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Industry Intelligence Engine");
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
    view: data?.industryIntelligenceEngine ?? null,
    live: data?.live ?? false,
  };
}
