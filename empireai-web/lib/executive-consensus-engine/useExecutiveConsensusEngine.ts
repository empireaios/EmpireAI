"use client";

import { subscribeRead } from "@/lib/cockpit/subscribe-read";

import { useCallback, useEffect, useState } from "react";
import type { ExecutiveConsensusEngine } from "@/lib/executive-consensus-engine/types";

const POLL_MS = 5_000;

type ExecutiveConsensusEnginePayload = {
  computedAt: string;
  live?: boolean;
  executiveConsensusEngine: ExecutiveConsensusEngine;
};

export function useExecutiveConsensusEngine() {
  const [data, setData] = useState<ExecutiveConsensusEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/executive-consensus-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ExecutiveConsensusEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Executive Consensus Engine");
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
    view: data?.executiveConsensusEngine ?? null,
    live: data?.live ?? false,
  };
}
