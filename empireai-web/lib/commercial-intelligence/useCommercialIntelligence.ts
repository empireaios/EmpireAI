"use client";

import { subscribeRead } from "@/lib/cockpit/subscribe-read";

import { useCallback, useEffect, useState } from "react";
import type { CommercialIntelligenceArchitecture } from "@/lib/commercial-intelligence/types";

const POLL_MS = 5_000;

type CommercialIntelligencePayload = {
  computedAt: string;
  live?: boolean;
  commercialIntelligence: CommercialIntelligenceArchitecture;
};

export function useCommercialIntelligence() {
  const [data, setData] = useState<CommercialIntelligencePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/commercial-intelligence", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as CommercialIntelligencePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Commercial Intelligence");
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
    view: data?.commercialIntelligence ?? null,
    live: data?.live ?? false,
  };
}
