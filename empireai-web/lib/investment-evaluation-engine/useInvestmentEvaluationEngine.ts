"use client";

import { useCallback, useEffect, useState } from "react";
import type { InvestmentEvaluationEngine } from "@/lib/investment-evaluation-engine/types";

const POLL_MS = 5_000;

type InvestmentEvaluationEnginePayload = {
  computedAt: string;
  live?: boolean;
  investmentEvaluationEngine: InvestmentEvaluationEngine;
};

export function useInvestmentEvaluationEngine() {
  const [data, setData] = useState<InvestmentEvaluationEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/investment-evaluation-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as InvestmentEvaluationEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Investment Evaluation Engine");
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
    view: data?.investmentEvaluationEngine ?? null,
    live: data?.live ?? false,
  };
}
