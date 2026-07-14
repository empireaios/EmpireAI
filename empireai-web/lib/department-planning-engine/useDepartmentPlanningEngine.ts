"use client";

import { useCallback, useEffect, useState } from "react";
import type { DepartmentPlanningEngine } from "@/lib/department-planning-engine/types";

const POLL_MS = 5_000;

type DepartmentPlanningEnginePayload = {
  computedAt: string;
  live?: boolean;
  departmentPlanningEngine: DepartmentPlanningEngine;
};

export function useDepartmentPlanningEngine() {
  const [data, setData] = useState<DepartmentPlanningEnginePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/department-planning-engine", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as DepartmentPlanningEnginePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Department Planning Engine");
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
    view: data?.departmentPlanningEngine ?? null,
    live: data?.live ?? false,
  };
}
