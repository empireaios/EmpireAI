"use client";

import { subscribeRead } from "@/lib/cockpit/subscribe-read";

import { useCallback, useEffect, useState } from "react";
import type { EmpireEvolutionArchitecture } from "@/lib/empire-evolution/types";

const POLL_MS = 5_000;

type EmpireEvolutionPayload = {
  computedAt: string;
  live?: boolean;
  empireEvolution: EmpireEvolutionArchitecture;
};

export function useEmpireEvolution() {
  const [data, setData] = useState<EmpireEvolutionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/empire-evolution", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as EmpireEvolutionPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Empire Evolution");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => subscribeRead(reload, POLL_MS), [reload]);

  return {
    data,
    loading,
    error,
    reload,
    view: data?.empireEvolution ?? null,
    live: data?.live ?? false,
  };
}
