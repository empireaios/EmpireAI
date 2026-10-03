"use client";

import { subscribeRead } from "@/lib/cockpit/subscribe-read";

import { useCallback, useEffect, useState } from "react";
import type { ExecutivePolicyEngine } from "@/lib/executive-policy-engine/types";

const POLL_MS = 5_000;

type ExecutivePolicyEnginePayload = {
  computedAt: string;
  live?: boolean;
  executivePolicyEngine: ExecutivePolicyEngine;
};

export function useExecutivePolicyEngine() {
  const [data, setData] = useState<ExecutivePolicyEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/executive-policy-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ExecutivePolicyEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Executive Policy Engine");
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
    view: data?.executivePolicyEngine ?? null,
    live: data?.live ?? false,
  };
}
