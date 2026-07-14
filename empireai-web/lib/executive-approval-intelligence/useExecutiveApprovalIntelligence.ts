"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExecutiveApprovalIntelligence } from "@/lib/executive-approval-intelligence/types";

const POLL_MS = 5_000;

type ExecutiveApprovalIntelligencePayload = {
  computedAt: string;
  live?: boolean;
  executiveApprovalIntelligence: ExecutiveApprovalIntelligence;
};

export function useExecutiveApprovalIntelligence() {
  const [data, setData] = useState<ExecutiveApprovalIntelligencePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/executive-approval-intelligence", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ExecutiveApprovalIntelligencePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Executive Approval Intelligence");
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
    view: data?.executiveApprovalIntelligence ?? null,
    live: data?.live ?? false,
  };
}
