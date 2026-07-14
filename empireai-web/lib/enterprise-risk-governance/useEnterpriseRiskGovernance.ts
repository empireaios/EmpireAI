"use client";

import { useCallback, useEffect, useState } from "react";
import type { EnterpriseRiskGovernance } from "@/lib/enterprise-risk-governance/types";

const REFRESH_MS = 5000;

type EnterpriseRiskGovernancePayload = {
  computedAt: string;
  live?: boolean;
  enterpriseRiskGovernance: EnterpriseRiskGovernance;
};

export function useEnterpriseRiskGovernance() {
  const [data, setData] = useState<EnterpriseRiskGovernancePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/pillow/enterprise-risk-governance", { credentials: "include" });
      if (!res.ok) {
        throw new Error(`Enterprise Risk Governance unavailable (${res.status})`);
      }
      setData((await res.json()) as EnterpriseRiskGovernancePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Enterprise Risk Governance");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    const id = setInterval(() => void reload(), REFRESH_MS);
    return () => clearInterval(id);
  }, [reload]);

  const view = data?.enterpriseRiskGovernance ?? null;
  const live = data?.live !== false;

  return { data, view, loading, error, reload, live };
}
