"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExecutivePlanningCertification } from "@/lib/executive-planning-certification/types";

const POLL_MS = 5_000;

type ExecutivePlanningCertificationPayload = {
  computedAt: string;
  live?: boolean;
  executivePlanningCertification: ExecutivePlanningCertification;
};

export function useExecutivePlanningCertification() {
  const [data, setData] = useState<ExecutivePlanningCertificationPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/executive-planning-certification", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ExecutivePlanningCertificationPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Executive Planning Certification");
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
    view: data?.executivePlanningCertification ?? null,
    live: data?.live ?? false,
  };
}
