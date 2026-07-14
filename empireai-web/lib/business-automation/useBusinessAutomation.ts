"use client";

import { useCallback, useEffect, useState } from "react";
import type { BusinessAutomationArchitecture } from "@/lib/business-automation/types";

const POLL_MS = 5_000;

type BusinessAutomationPayload = {
  computedAt: string;
  live?: boolean;
  businessAutomation: BusinessAutomationArchitecture;
};

export function useBusinessAutomation() {
  const [data, setData] = useState<BusinessAutomationPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/business-automation", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as BusinessAutomationPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Business Automation");
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
    view: data?.businessAutomation ?? null,
    live: data?.live ?? false,
  };
}
