"use client";

import { useCallback, useEffect, useState } from "react";
import type { GrandKingExecutiveCockpit } from "@/lib/grand-king-executive-cockpit/types";

const REFRESH_MS = 5000;

type GrandKingExecutiveCockpitPayload = {
  computedAt: string;
  live?: boolean;
  grandKingExecutiveCockpit: GrandKingExecutiveCockpit;
};

export function useGrandKingExecutiveCockpit() {
  const [data, setData] = useState<GrandKingExecutiveCockpitPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/pillow/grand-king-executive-cockpit", { credentials: "include" });
      if (!res.ok) {
        throw new Error(`Grand King Executive Cockpit unavailable (${res.status})`);
      }
      setData((await res.json()) as GrandKingExecutiveCockpitPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Grand King Executive Cockpit");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    const id = setInterval(() => void reload(), REFRESH_MS);
    return () => clearInterval(id);
  }, [reload]);

  const view = data?.grandKingExecutiveCockpit ?? null;
  const live = data?.live !== false;

  return { data, view, loading, error, reload, live };
}
