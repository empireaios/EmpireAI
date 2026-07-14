"use client";

import { useCallback, useEffect, useState } from "react";
import type { RiskAssessmentEngine } from "@/lib/risk-assessment-engine/types";

const POLL_MS = 5_000;

type RiskAssessmentEnginePayload = {
  computedAt: string;
  live?: boolean;
  riskAssessmentEngine: RiskAssessmentEngine;
};

export function useRiskAssessmentEngine() {
  const [data, setData] = useState<RiskAssessmentEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/risk-assessment-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as RiskAssessmentEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Risk Assessment Engine");
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
    view: data?.riskAssessmentEngine ?? null,
    live: data?.live ?? false,
  };
}
