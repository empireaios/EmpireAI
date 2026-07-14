"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExecutiveDecisionCertification } from "@/lib/executive-decision-certification/types";

const POLL_MS = 5_000;

type ExecutiveDecisionCertificationPayload = {
  computedAt: string;
  live?: boolean;
  executiveDecisionCertification: ExecutiveDecisionCertification;
};

export function useExecutiveDecisionCertification() {
  const [data, setData] = useState<ExecutiveDecisionCertificationPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/executive-decision-certification", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ExecutiveDecisionCertificationPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Executive Decision Certification");
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
    view: data?.executiveDecisionCertification ?? null,
    live: data?.live ?? false,
  };
}
