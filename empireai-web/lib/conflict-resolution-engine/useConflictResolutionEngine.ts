"use client";

import { useCallback, useEffect, useState } from "react";
import type { ConflictResolutionEngine } from "@/lib/conflict-resolution-engine/types";

const POLL_MS = 5_000;

type ConflictResolutionEnginePayload = {
  computedAt: string;
  live?: boolean;
  conflictResolutionEngine: ConflictResolutionEngine;
};

export function useConflictResolutionEngine() {
  const [data, setData] = useState<ConflictResolutionEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/conflict-resolution-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ConflictResolutionEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Conflict Resolution Engine");
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
    view: data?.conflictResolutionEngine ?? null,
    live: data?.live ?? false,
  };
}
