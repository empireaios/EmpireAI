"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExecutiveDependencyEngine } from "@/lib/executive-dependency-engine/types";

const POLL_MS = 5_000;

type ExecutiveDependencyEnginePayload = {
  computedAt: string;
  live?: boolean;
  executiveDependencyEngine: ExecutiveDependencyEngine;
};

export function useExecutiveDependencyEngine() {
  const [data, setData] = useState<ExecutiveDependencyEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/executive-dependency-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ExecutiveDependencyEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Executive Dependency Engine");
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
    view: data?.executiveDependencyEngine ?? null,
    live: data?.live ?? false,
  };
}
