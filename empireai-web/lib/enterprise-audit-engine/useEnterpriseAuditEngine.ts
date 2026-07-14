"use client";

import { useCallback, useEffect, useState } from "react";
import type { EnterpriseAuditEngine } from "@/lib/enterprise-audit-engine/types";

const POLL_MS = 5_000;

type EnterpriseAuditEnginePayload = {
  computedAt: string;
  live?: boolean;
  enterpriseAuditEngine: EnterpriseAuditEngine;
};

export function useEnterpriseAuditEngine() {
  const [data, setData] = useState<EnterpriseAuditEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/enterprise-audit-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as EnterpriseAuditEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Enterprise Audit Engine");
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
    view: data?.enterpriseAuditEngine ?? null,
    live: data?.live ?? false,
  };
}
