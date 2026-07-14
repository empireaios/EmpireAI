"use client";

import { useCallback, useEffect, useState } from "react";
import type { CashReserveIntelligence } from "@/lib/cash-reserve-intelligence/types";

const POLL_MS = 5_000;

type CashReserveIntelligencePayload = {
  computedAt: string;
  live?: boolean;
  cashReserveIntelligence: CashReserveIntelligence;
};

export function useCashReserveIntelligence() {
  const [data, setData] = useState<CashReserveIntelligencePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/cash-reserve-intelligence", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as CashReserveIntelligencePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Cash Reserve Intelligence");
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
    view: data?.cashReserveIntelligence ?? null,
    live: data?.live ?? false,
  };
}
