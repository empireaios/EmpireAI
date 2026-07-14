"use client";

import { useCallback, useEffect, useState } from "react";
import type { EnterprisePatternEngine } from "@/lib/enterprise-pattern-engine/types";

const POLL_MS = 5_000;

type EnterprisePatternEnginePayload = {
  computedAt: string;
  live?: boolean;
  enterprisePatternEngine: EnterprisePatternEngine;
};

export function useEnterprisePatternEngine() {
  const [data, setData] = useState<EnterprisePatternEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/enterprise-pattern-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as EnterprisePatternEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Enterprise Pattern Engine");
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
    view: data?.enterprisePatternEngine ?? null,
    live: data?.live ?? false,
  };
}
