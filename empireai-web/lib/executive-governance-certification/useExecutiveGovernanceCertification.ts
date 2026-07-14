"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExecutiveGovernanceCertification } from "@/lib/executive-governance-certification/types";

const POLL_MS = 5_000;

type ExecutiveGovernanceCertificationPayload = {
  computedAt: string;
  live?: boolean;
  executiveGovernanceCertification: ExecutiveGovernanceCertification;
};

export function useExecutiveGovernanceCertification() {
  const [data, setData] = useState<ExecutiveGovernanceCertificationPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/executive-governance-certification", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ExecutiveGovernanceCertificationPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Executive Governance Certification");
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
    view: data?.executiveGovernanceCertification ?? null,
    live: data?.live ?? false,
  };
}
