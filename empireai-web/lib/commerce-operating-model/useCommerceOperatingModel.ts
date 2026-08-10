"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CommerceOperatingModel } from "@/lib/commerce-operating-model/types";
import { fetchWithBudget } from "@/lib/cockpit/fetch-with-budget";

/** Secondary model — Executive Home prefers canonicalTruth; do not herd Brain. */
const POLL_MS = 60_000;
const FETCH_TIMEOUT_MS = 12_000;

type CommerceOperatingModelPayload = {
  computedAt: string;
  live?: boolean;
  commerceOperatingModel: CommerceOperatingModel;
};

export function useCommerceOperatingModel(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const [data, setData] = useState<CommerceOperatingModelPayload | null>(null);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const reload = useCallback(async () => {
    if (!enabled || inFlight.current) return;
    inFlight.current = true;
    setError(null);
    try {
      const res = await fetchWithBudget("/api/pillow/commerce-operating-model", {
        credentials: "include",
        timeoutMs: FETCH_TIMEOUT_MS,
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as CommerceOperatingModelPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Commerce Operating Model");
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return undefined;
    }
    void reload();
    const interval = setInterval(() => void reload(), POLL_MS);
    return () => clearInterval(interval);
  }, [enabled, reload]);

  return {
    data,
    loading,
    error,
    reload,
    view: data?.commerceOperatingModel ?? null,
    live: data?.live ?? false,
  };
}

export function formatCommerceLabel(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
