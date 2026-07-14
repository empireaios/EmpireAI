"use client";

import { useCallback, useEffect, useState } from "react";
import type { KnowledgeEvolutionArchitecture } from "@/lib/knowledge-evolution/types";

const POLL_MS = 5_000;

type KnowledgeEvolutionPayload = {
  computedAt: string;
  live?: boolean;
  knowledgeEvolution: KnowledgeEvolutionArchitecture;
};

export function useKnowledgeEvolution() {
  const [data, setData] = useState<KnowledgeEvolutionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/knowledge-evolution", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as KnowledgeEvolutionPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Knowledge Evolution");
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
    view: data?.knowledgeEvolution ?? null,
    live: data?.live ?? false,
  };
}
