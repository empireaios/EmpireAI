"use client";

import { useCallback, useEffect, useState } from "react";
import type { BusinessFactoryArchitecture } from "@/lib/business-factory/types";

const POLL_MS = 5_000;

type BusinessFactoryPayload = {
  computedAt: string;
  live?: boolean;
  businessFactory: BusinessFactoryArchitecture;
};

export function useBusinessFactory() {
  const [data, setData] = useState<BusinessFactoryPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/business-factory", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as BusinessFactoryPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Business Factory");
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
    view: data?.businessFactory ?? null,
    live: data?.live ?? false,
  };
}

export function formatFactoryStage(stage: string): string {
  return stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
