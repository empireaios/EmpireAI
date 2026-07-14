"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExecutiveKnowledgeGraph } from "@/lib/executive-knowledge-graph/types";

const POLL_MS = 5_000;

type ExecutiveKnowledgeGraphPayload = {
  computedAt: string;
  live?: boolean;
  executiveKnowledgeGraph: ExecutiveKnowledgeGraph;
};

export function useExecutiveKnowledgeGraph() {
  const [data, setData] = useState<ExecutiveKnowledgeGraphPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/executive-knowledge-graph", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ExecutiveKnowledgeGraphPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Executive Knowledge Graph");
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
    view: data?.executiveKnowledgeGraph ?? null,
    live: data?.live ?? false,
  };
}
