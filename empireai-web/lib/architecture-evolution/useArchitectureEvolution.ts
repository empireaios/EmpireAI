"use client";

import { useCallback, useEffect, useState } from "react";
import type { ArchitectureEvolutionArchitecture } from "@/lib/architecture-evolution/types";

const POLL_MS = 5_000;

type ArchitectureEvolutionPayload = {
  computedAt: string;
  live?: boolean;
  architectureEvolution: ArchitectureEvolutionArchitecture;
};

export function useArchitectureEvolution() {
  const [data, setData] = useState<ArchitectureEvolutionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/architecture-evolution", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ArchitectureEvolutionPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Architecture Evolution");
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
    view: data?.architectureEvolution ?? null,
    live: data?.live ?? false,
  };
}
