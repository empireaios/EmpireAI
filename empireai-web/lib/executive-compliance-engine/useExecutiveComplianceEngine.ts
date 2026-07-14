"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExecutiveComplianceEngine } from "@/lib/executive-compliance-engine/types";

const POLL_MS = 5_000;

type ExecutiveComplianceEnginePayload = {
  computedAt: string;
  live?: boolean;
  executiveComplianceEngine: ExecutiveComplianceEngine;
};

export function useExecutiveComplianceEngine() {
  const [data, setData] = useState<ExecutiveComplianceEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/executive-compliance-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ExecutiveComplianceEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Executive Compliance Engine");
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
    view: data?.executiveComplianceEngine ?? null,
    live: data?.live ?? false,
  };
}
