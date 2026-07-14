"use client";

import { useCallback, useEffect, useState } from "react";
import type { CustomerBehaviourIntelligence } from "@/lib/customer-behaviour-intelligence/types";

const POLL_MS = 5_000;

type CustomerBehaviourIntelligencePayload = {
  computedAt: string;
  live?: boolean;
  customerBehaviourIntelligence: CustomerBehaviourIntelligence;
};

export function useCustomerBehaviourIntelligence() {
  const [data, setData] = useState<CustomerBehaviourIntelligencePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/customer-behaviour-intelligence", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as CustomerBehaviourIntelligencePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Customer Behaviour Intelligence");
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
    view: data?.customerBehaviourIntelligence ?? null,
    live: data?.live ?? false,
  };
}
