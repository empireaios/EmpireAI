"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExecutiveExceptionManager } from "@/lib/executive-exception-manager/types";

const POLL_MS = 5_000;

type ExecutiveExceptionManagerPayload = {
  computedAt: string;
  live?: boolean;
  executiveExceptionManager: ExecutiveExceptionManager;
};

export function useExecutiveExceptionManager() {
  const [data, setData] = useState<ExecutiveExceptionManagerPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/executive-exception-manager", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ExecutiveExceptionManagerPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Executive Exception Manager");
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
    view: data?.executiveExceptionManager ?? null,
    live: data?.live ?? false,
  };
}
