"use client";

import { subscribeRead } from "@/lib/cockpit/subscribe-read";

import { useCallback, useEffect, useState } from "react";
import type { ExecutiveRoadmapEngine } from "@/lib/executive-roadmap-engine/types";

const POLL_MS = 5_000;

type ExecutiveRoadmapEnginePayload = {
  computedAt: string;
  live?: boolean;
  executiveRoadmapEngine: ExecutiveRoadmapEngine;
};

export function useExecutiveRoadmapEngine() {
  const [data, setData] = useState<ExecutiveRoadmapEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/executive-roadmap-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ExecutiveRoadmapEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Executive Roadmap Engine");
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
    view: data?.executiveRoadmapEngine ?? null,
    live: data?.live ?? false,
  };
}
