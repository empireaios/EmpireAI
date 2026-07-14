"use client";

import { useCallback, useEffect, useState } from "react";
import type { StrategicAlignmentMonitor } from "@/lib/strategic-alignment-monitor/types";

const POLL_MS = 5_000;

type StrategicAlignmentMonitorPayload = {
  computedAt: string;
  live?: boolean;
  strategicAlignmentMonitor: StrategicAlignmentMonitor;
};

export function useStrategicAlignmentMonitor() {
  const [data, setData] = useState<StrategicAlignmentMonitorPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/strategic-alignment-monitor", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as StrategicAlignmentMonitorPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Strategic Alignment Monitor");
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
    view: data?.strategicAlignmentMonitor ?? null,
    live: data?.live ?? false,
  };
}
