"use client";

import { subscribeRead } from "@/lib/cockpit/subscribe-read";

import { useCallback, useEffect, useState } from "react";
import type { ExecutiveDecisionArchitecture } from "@/lib/executive-decision-architecture/types";

const POLL_MS = 5_000;

type ExecutiveDecisionArchitecturePayload = {
  computedAt: string;
  live?: boolean;
  executiveDecisionArchitecture: ExecutiveDecisionArchitecture;
};

export function useExecutiveDecisionArchitecture() {
  const [data, setData] = useState<ExecutiveDecisionArchitecturePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/executive-decision-architecture", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ExecutiveDecisionArchitecturePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Executive Decision Architecture");
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
    view: data?.executiveDecisionArchitecture ?? null,
    live: data?.live ?? false,
  };
}
