"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExecutivePolicyEvolution } from "@/lib/executive-policy-evolution/types";

const REFRESH_MS = 5000;

type ExecutivePolicyEvolutionPayload = {
  computedAt: string;
  live?: boolean;
  executivePolicyEvolution: ExecutivePolicyEvolution;
};

export function useExecutivePolicyEvolution() {
  const [data, setData] = useState<ExecutivePolicyEvolutionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/pillow/executive-policy-evolution", { credentials: "include" });
      if (!res.ok) {
        throw new Error(`Executive Policy Evolution unavailable (${res.status})`);
      }
      setData((await res.json()) as ExecutivePolicyEvolutionPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Executive Policy Evolution");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    const id = setInterval(() => void reload(), REFRESH_MS);
    return () => clearInterval(id);
  }, [reload]);

  const view = data?.executivePolicyEvolution ?? null;
  const live = data?.live !== false;

  return { data, view, loading, error, reload, live };
}
