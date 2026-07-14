"use client";

import { useCallback, useEffect, useState } from "react";
import type { AiEvolutionArchitecture } from "@/lib/ai-evolution/types";

const POLL_MS = 5_000;

type AiEvolutionPayload = {
  computedAt: string;
  live?: boolean;
  aiEvolution: AiEvolutionArchitecture;
};

export function useAiEvolution() {
  const [data, setData] = useState<AiEvolutionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/ai-evolution", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as AiEvolutionPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load AI Evolution");
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
    view: data?.aiEvolution ?? null,
    live: data?.live ?? false,
  };
}
