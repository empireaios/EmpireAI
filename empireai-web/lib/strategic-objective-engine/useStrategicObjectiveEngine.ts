"use client";

import { useCallback, useEffect, useState } from "react";
import type { StrategicObjectiveEngine } from "@/lib/strategic-objective-engine/types";

const POLL_MS = 5_000;

type StrategicObjectiveEnginePayload = {
  computedAt: string;
  live?: boolean;
  strategicObjectiveEngine: StrategicObjectiveEngine;
};

export function useStrategicObjectiveEngine() {
  const [data, setData] = useState<StrategicObjectiveEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/strategic-objective-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as StrategicObjectiveEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Strategic Objective Engine");
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
    view: data?.strategicObjectiveEngine ?? null,
    live: data?.live ?? false,
  };
}
