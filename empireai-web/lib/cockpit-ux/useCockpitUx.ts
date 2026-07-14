"use client";

import { useCallback, useEffect, useState } from "react";
import type { CockpitUxArchitecture } from "@/lib/cockpit-ux/cockpitUxTypes";

const POLL_MS = 15_000;

type CockpitUxPayload = {
  computedAt: string;
  live?: boolean;
  cockpitUx: CockpitUxArchitecture;
};

export function useCockpitUx() {
  const [data, setData] = useState<CockpitUxPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/cockpit-ux", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as CockpitUxPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Cockpit UX");
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
    view: data?.cockpitUx ?? null,
    live: data?.live ?? false,
  };
}
