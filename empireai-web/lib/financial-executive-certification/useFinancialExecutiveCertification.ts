"use client";

import { useCallback, useEffect, useState } from "react";
import type { FinancialExecutiveCertification } from "@/lib/financial-executive-certification/types";

const POLL_MS = 5_000;

type FinancialExecutiveCertificationPayload = {
  computedAt: string;
  live?: boolean;
  financialExecutiveCertification: FinancialExecutiveCertification;
};

export function useFinancialExecutiveCertification() {
  const [data, setData] = useState<FinancialExecutiveCertificationPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/financial-executive-certification", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as FinancialExecutiveCertificationPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Financial Executive Certification");
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
    view: data?.financialExecutiveCertification ?? null,
    live: data?.live ?? false,
  };
}
