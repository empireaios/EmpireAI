"use client";

import { useCallback, useEffect, useState } from "react";
import type { AutonomousDecisionMonitor } from "@/lib/autonomous-decision-monitor/types";

const POLL_MS = 5_000;

type AutonomousDecisionMonitorPayload = {
  computedAt: string;
  live?: boolean;
  autonomousDecisionMonitor: AutonomousDecisionMonitor;
};

export function useAutonomousDecisionMonitor() {
  const [data, setData] = useState<AutonomousDecisionMonitorPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/autonomous-decision-monitor", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as AutonomousDecisionMonitorPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Autonomous Decision Monitor");
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
    view: data?.autonomousDecisionMonitor ?? null,
    live: data?.live ?? false,
  };
}
