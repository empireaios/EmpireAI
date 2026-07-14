"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExecutiveConstitutionalMonitor } from "@/lib/executive-constitutional-monitor/types";

const POLL_MS = 5_000;

type ExecutiveConstitutionalMonitorPayload = {
  computedAt: string;
  live?: boolean;
  executiveConstitutionalMonitor: ExecutiveConstitutionalMonitor;
};

export function useExecutiveConstitutionalMonitor() {
  const [data, setData] = useState<ExecutiveConstitutionalMonitorPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/executive-constitutional-monitor", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ExecutiveConstitutionalMonitorPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Executive Constitutional Monitor");
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
    view: data?.executiveConstitutionalMonitor ?? null,
    live: data?.live ?? false,
  };
}
