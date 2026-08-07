"use client";

import { useCallback, useEffect, useState } from "react";
import type { CommerceOperatingModel } from "@/lib/commerce-operating-model/types";

/** Home + panel share this hook — avoid 5s herd against production Brain. */
const POLL_MS = 30_000;

type CommerceOperatingModelPayload = {
  computedAt: string;
  live?: boolean;
  commerceOperatingModel: CommerceOperatingModel;
};

export function useCommerceOperatingModel() {
  const [data, setData] = useState<CommerceOperatingModelPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/commerce-operating-model", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as CommerceOperatingModelPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Commerce Operating Model");
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
    view: data?.commerceOperatingModel ?? null,
    live: data?.live ?? false,
  };
}

export function formatCommerceLabel(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
