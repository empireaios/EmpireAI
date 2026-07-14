"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExecutiveArchitectureFramework } from "@/lib/executive-architecture-framework/types";

const POLL_MS = 5_000;

type ExecutiveArchitectureFrameworkPayload = {
  computedAt: string;
  live?: boolean;
  executiveArchitectureFramework: ExecutiveArchitectureFramework;
};

export function useExecutiveArchitectureFramework() {
  const [data, setData] = useState<ExecutiveArchitectureFrameworkPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/executive-architecture-framework", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ExecutiveArchitectureFrameworkPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Executive Architecture Framework");
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
    view: data?.executiveArchitectureFramework ?? null,
    live: data?.live ?? false,
  };
}
