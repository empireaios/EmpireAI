"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExecutiveIntelligenceCertification } from "@/lib/executive-intelligence-certification/types";

const POLL_MS = 5_000;

type ExecutiveIntelligenceCertificationPayload = {
  computedAt: string;
  live?: boolean;
  executiveIntelligenceCertification: ExecutiveIntelligenceCertification;
};

export function useExecutiveIntelligenceCertification() {
  const [data, setData] = useState<ExecutiveIntelligenceCertificationPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/executive-intelligence-certification", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ExecutiveIntelligenceCertificationPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Executive Intelligence Certification");
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
    view: data?.executiveIntelligenceCertification ?? null,
    live: data?.live ?? false,
  };
}
