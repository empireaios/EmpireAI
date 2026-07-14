"use client";

import { useCallback, useEffect, useState } from "react";
import type { ThreatDetectionEngine } from "@/lib/threat-detection-engine/types";

const POLL_MS = 5_000;

type ThreatDetectionEnginePayload = {
  computedAt: string;
  live?: boolean;
  threatDetectionEngine: ThreatDetectionEngine;
};

export function useThreatDetectionEngine() {
  const [data, setData] = useState<ThreatDetectionEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/threat-detection-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ThreatDetectionEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Threat Detection Engine");
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
    view: data?.threatDetectionEngine ?? null,
    live: data?.live ?? false,
  };
}
