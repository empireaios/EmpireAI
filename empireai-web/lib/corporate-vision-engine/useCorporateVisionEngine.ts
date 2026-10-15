"use client";

import { subscribeRead } from "@/lib/cockpit/subscribe-read";

import { useCallback, useEffect, useState } from "react";
import type { CorporateVisionEngine } from "@/lib/corporate-vision-engine/types";

const POLL_MS = 5_000;

type CorporateVisionEnginePayload = {
  computedAt: string;
  live?: boolean;
  corporateVisionEngine: CorporateVisionEngine;
};

export function useCorporateVisionEngine() {
  const [data, setData] = useState<CorporateVisionEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/corporate-vision-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as CorporateVisionEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Corporate Vision Engine");
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
    view: data?.corporateVisionEngine ?? null,
    live: data?.live ?? false,
  };
}
