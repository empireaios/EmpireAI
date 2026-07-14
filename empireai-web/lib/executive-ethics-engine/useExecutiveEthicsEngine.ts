"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExecutiveEthicsEngine } from "@/lib/executive-ethics-engine/types";

const POLL_MS = 5_000;

type ExecutiveEthicsEnginePayload = {
  computedAt: string;
  live?: boolean;
  executiveEthicsEngine: ExecutiveEthicsEngine;
};

export function useExecutiveEthicsEngine() {
  const [data, setData] = useState<ExecutiveEthicsEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/executive-ethics-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ExecutiveEthicsEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Executive Ethics Engine");
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
    view: data?.executiveEthicsEngine ?? null,
    live: data?.live ?? false,
  };
}
