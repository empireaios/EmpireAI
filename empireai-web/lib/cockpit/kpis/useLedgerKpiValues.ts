"use client";

import { useBrainModule } from "@/lib/brain/hooks/useBrainModule";

type DashboardMetric = {
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
};

type DashboardView = {
  portfolioMetrics: DashboardMetric[];
  companies: { id: string; name: string; status: string }[];
};

/** REAL-127 — Ledger-backed portfolio metrics from Brain dashboard module. */
export function useLedgerKpiValues() {
  const { data, loading, error, reload } = useBrainModule<DashboardView>("dashboard");
  return { metrics: data?.portfolioMetrics ?? [], loading, error, reload };
}
