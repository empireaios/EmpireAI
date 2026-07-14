"use client";

import { useCallback, useEffect, useState } from "react";
import type { RepositoryEvolutionArchitecture } from "@/lib/repository-evolution/types";

const POLL_MS = 5_000;

type RepositoryEvolutionPayload = {
  computedAt: string;
  live?: boolean;
  repositoryEvolution: RepositoryEvolutionArchitecture;
};

export function useRepositoryEvolution() {
  const [data, setData] = useState<RepositoryEvolutionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/repository-evolution", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as RepositoryEvolutionPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Repository Evolution");
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
    view: data?.repositoryEvolution ?? null,
    live: data?.live ?? false,
  };
}
