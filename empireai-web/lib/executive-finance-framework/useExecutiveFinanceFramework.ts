"use client";

import { subscribeRead } from "@/lib/cockpit/subscribe-read";

import { useCallback, useEffect, useState } from "react";
import type { ExecutiveFinanceFramework } from "@/lib/executive-finance-framework/types";

const POLL_MS = 5_000;

type ExecutiveFinanceFrameworkPayload = {
  computedAt: string;
  live?: boolean;
  executiveFinanceFramework: ExecutiveFinanceFramework;
};

export function useExecutiveFinanceFramework() {
  const [data, setData] = useState<ExecutiveFinanceFrameworkPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/executive-finance-framework", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ExecutiveFinanceFrameworkPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Executive Finance Framework");
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
    view: data?.executiveFinanceFramework ?? null,
    live: data?.live ?? false,
  };
}
