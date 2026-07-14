"use client";

import { useCallback, useEffect, useState } from "react";
import type { GrandKingOperatingAccount } from "@/lib/grand-king-operating-account/types";

const POLL_MS = 5_000;

type GrandKingOperatingAccountPayload = {
  computedAt: string;
  live?: boolean;
  grandKingOperatingAccount: GrandKingOperatingAccount;
};

export function useGrandKingOperatingAccount() {
  const [data, setData] = useState<GrandKingOperatingAccountPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/grand-king-operating-account", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as GrandKingOperatingAccountPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Grand King Operating Account");
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
    view: data?.grandKingOperatingAccount ?? null,
    live: data?.live ?? false,
  };
}
