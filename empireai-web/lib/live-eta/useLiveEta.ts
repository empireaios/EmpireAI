"use client";

import { useCallback, useEffect, useState } from "react";
import type { LiveEtaExperience } from "@/lib/live-eta/types";

const POLL_MS = 5_000;

type LiveEtaPayload = {
  computedAt: string;
  live?: boolean;
  liveEta: LiveEtaExperience;
};

export function useLiveEta() {
  const [data, setData] = useState<LiveEtaPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/live-eta", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as LiveEtaPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Live ETA");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    const interval = setInterval(() => void reload(), POLL_MS);
    return () => clearInterval(interval);
  }, [reload]);

  return { data, loading, error, reload, view: data?.liveEta ?? null, live: data?.live ?? false };
}

export function formatLiveEtaDuration(ms: number): string {
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ${sec % 60}s`;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h}h ${m}m`;
}
