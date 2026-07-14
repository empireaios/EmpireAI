"use client";

import { useCallback, useEffect, useState } from "react";
import type { DecisionAuditEngine } from "@/lib/decision-audit-engine/types";

const POLL_MS = 5_000;

type DecisionAuditEnginePayload = {
  computedAt: string;
  live?: boolean;
  decisionAuditEngine: DecisionAuditEngine;
};

export function useDecisionAuditEngine() {
  const [data, setData] = useState<DecisionAuditEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/decision-audit-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as DecisionAuditEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Decision Audit Engine");
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
    view: data?.decisionAuditEngine ?? null,
    live: data?.live ?? false,
  };
}
