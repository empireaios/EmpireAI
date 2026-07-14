"use client";

import { useCallback, useEffect, useState } from "react";
import type { BuilderConsoleView } from "@/lib/builder-console/types";

const POLL_MS = 5_000;

type BuilderConsolePayload = {
  computedAt: string;
  live?: boolean;
  builderConsole: BuilderConsoleView;
};

export function useBuilderConsole() {
  const [data, setData] = useState<BuilderConsolePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/builder-console", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as BuilderConsolePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Builder Console");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    const interval = setInterval(() => void reload(), POLL_MS);
    return () => clearInterval(interval);
  }, [reload]);

  return { data, loading, error, reload, view: data?.builderConsole ?? null, live: data?.live ?? false };
}
