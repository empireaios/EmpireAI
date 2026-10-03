"use client";

import { subscribeRead } from "@/lib/cockpit/subscribe-read";

import { useCallback, useEffect, useState } from "react";
import type { ExecutiveConfidenceEngine } from "@/lib/executive-confidence-engine/types";

const POLL_MS = 5_000;

type ExecutiveConfidenceEnginePayload = {
  computedAt: string;
  live?: boolean;
  executiveConfidenceEngine: ExecutiveConfidenceEngine;
};

export function useExecutiveConfidenceEngine() {
  const [data, setData] = useState<ExecutiveConfidenceEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/executive-confidence-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ExecutiveConfidenceEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Executive Confidence Engine");
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
    view: data?.executiveConfidenceEngine ?? null,
    live: data?.live ?? false,
  };
}
