"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExecutiveTransparencyEngine } from "@/lib/executive-transparency-engine/types";

const POLL_MS = 5_000;

type ExecutiveTransparencyEnginePayload = {
  computedAt: string;
  live?: boolean;
  executiveTransparencyEngine: ExecutiveTransparencyEngine;
};

export function useExecutiveTransparencyEngine() {
  const [data, setData] = useState<ExecutiveTransparencyEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/executive-transparency-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ExecutiveTransparencyEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Executive Transparency Engine");
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
    view: data?.executiveTransparencyEngine ?? null,
    live: data?.live ?? false,
  };
}
