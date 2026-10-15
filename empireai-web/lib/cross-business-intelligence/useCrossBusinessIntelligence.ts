"use client";

import { subscribeRead } from "@/lib/cockpit/subscribe-read";

import { useCallback, useEffect, useState } from "react";
import type { CrossBusinessIntelligence } from "@/lib/cross-business-intelligence/types";

const POLL_MS = 5_000;

type CrossBusinessIntelligencePayload = {
  computedAt: string;
  live?: boolean;
  crossBusinessIntelligence: CrossBusinessIntelligence;
};

export function useCrossBusinessIntelligence() {
  const [data, setData] = useState<CrossBusinessIntelligencePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/cross-business-intelligence", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as CrossBusinessIntelligencePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Cross-Business Intelligence");
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
    view: data?.crossBusinessIntelligence ?? null,
    live: data?.live ?? false,
  };
}
