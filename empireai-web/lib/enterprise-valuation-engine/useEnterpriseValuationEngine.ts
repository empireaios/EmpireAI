"use client";

import { subscribeRead } from "@/lib/cockpit/subscribe-read";

import { useCallback, useEffect, useState } from "react";
import type { EnterpriseValuationEngine } from "@/lib/enterprise-valuation-engine/types";

const POLL_MS = 5_000;

type EnterpriseValuationEnginePayload = {
  computedAt: string;
  live?: boolean;
  enterpriseValuationEngine: EnterpriseValuationEngine;
};

export function useEnterpriseValuationEngine() {
  const [data, setData] = useState<EnterpriseValuationEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/enterprise-valuation-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as EnterpriseValuationEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Enterprise Valuation Engine");
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
    view: data?.enterpriseValuationEngine ?? null,
    live: data?.live ?? false,
  };
}
