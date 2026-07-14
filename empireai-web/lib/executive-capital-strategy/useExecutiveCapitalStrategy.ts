"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExecutiveCapitalStrategy } from "@/lib/executive-capital-strategy/types";

const POLL_MS = 5_000;

type ExecutiveCapitalStrategyPayload = {
  computedAt: string;
  live?: boolean;
  executiveCapitalStrategy: ExecutiveCapitalStrategy;
};

export function useExecutiveCapitalStrategy() {
  const [data, setData] = useState<ExecutiveCapitalStrategyPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/executive-capital-strategy", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ExecutiveCapitalStrategyPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Executive Capital Strategy");
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
    view: data?.executiveCapitalStrategy ?? null,
    live: data?.live ?? false,
  };
}
