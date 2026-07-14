"use client";

import { useCallback, useEffect, useState } from "react";
import type { RoiIntelligenceEngine } from "@/lib/roi-intelligence-engine/types";

const POLL_MS = 5_000;

type RoiIntelligenceEnginePayload = {
  computedAt: string;
  live?: boolean;
  roiIntelligenceEngine: RoiIntelligenceEngine;
};

export function useRoiIntelligenceEngine() {
  const [data, setData] = useState<RoiIntelligenceEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/roi-intelligence-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as RoiIntelligenceEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load ROI Intelligence Engine");
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
    view: data?.roiIntelligenceEngine ?? null,
    live: data?.live ?? false,
  };
}
