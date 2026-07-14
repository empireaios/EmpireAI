"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExecutiveCalendarEngine } from "@/lib/executive-calendar-engine/types";

const POLL_MS = 5_000;

type ExecutiveCalendarEnginePayload = {
  computedAt: string;
  live?: boolean;
  executiveCalendarEngine: ExecutiveCalendarEngine;
};

export function useExecutiveCalendarEngine() {
  const [data, setData] = useState<ExecutiveCalendarEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/executive-calendar-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ExecutiveCalendarEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Executive Calendar Engine");
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
    view: data?.executiveCalendarEngine ?? null,
    live: data?.live ?? false,
  };
}
