"use client";

import { useCallback, useEffect, useState } from "react";
import type { InitiativePortfolioEngine } from "@/lib/initiative-portfolio-engine/types";

const POLL_MS = 5_000;

type InitiativePortfolioEnginePayload = {
  computedAt: string;
  live?: boolean;
  initiativePortfolioEngine: InitiativePortfolioEngine;
};

export function useInitiativePortfolioEngine() {
  const [data, setData] = useState<InitiativePortfolioEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/initiative-portfolio-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as InitiativePortfolioEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Initiative Portfolio Engine");
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
    view: data?.initiativePortfolioEngine ?? null,
    live: data?.live ?? false,
  };
}
