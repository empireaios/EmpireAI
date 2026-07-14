"use client";

import { useCallback, useEffect, useState } from "react";
import type { EnterpriseGovernanceFramework } from "@/lib/enterprise-governance-framework/types";

const POLL_MS = 5_000;

type EnterpriseGovernanceFrameworkPayload = {
  computedAt: string;
  live?: boolean;
  enterpriseGovernanceFramework: EnterpriseGovernanceFramework;
};

export function useEnterpriseGovernanceFramework() {
  const [data, setData] = useState<EnterpriseGovernanceFrameworkPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/enterprise-governance-framework", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as EnterpriseGovernanceFrameworkPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Enterprise Governance Framework");
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
    view: data?.enterpriseGovernanceFramework ?? null,
    live: data?.live ?? false,
  };
}
