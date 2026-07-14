"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExecutiveTrustEngine } from "@/lib/executive-trust-engine/types";

const REFRESH_MS = 5000;

type ExecutiveTrustEnginePayload = {
  computedAt: string;
  live?: boolean;
  executiveTrustEngine: ExecutiveTrustEngine;
};

export function useExecutiveTrustEngine() {
  const [data, setData] = useState<ExecutiveTrustEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/pillow/executive-trust-engine", { credentials: "include" });
      if (!res.ok) {
        throw new Error(`Executive Trust Engine unavailable (${res.status})`);
      }
      setData((await res.json()) as ExecutiveTrustEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Executive Trust Engine");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    const id = setInterval(() => void reload(), REFRESH_MS);
    return () => clearInterval(id);
  }, [reload]);

  const view = data?.executiveTrustEngine ?? null;
  const live = data?.live !== false;

  return { data, view, loading, error, reload, live };
}
