"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExecutiveEscalationEngine } from "@/lib/executive-escalation-engine/types";

const POLL_MS = 5_000;

type ExecutiveEscalationEnginePayload = {
  computedAt: string;
  live?: boolean;
  executiveEscalationEngine: ExecutiveEscalationEngine;
};

export function useExecutiveEscalationEngine() {
  const [data, setData] = useState<ExecutiveEscalationEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/executive-escalation-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ExecutiveEscalationEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Executive Escalation Engine");
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
    view: data?.executiveEscalationEngine ?? null,
    live: data?.live ?? false,
  };
}
