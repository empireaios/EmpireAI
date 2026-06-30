import type { KpiMetric } from "../models/kpi-metric.js";
import { CANONICAL_KPI_IDS } from "../models/kpi-metric.js";

function metric(
  input: Omit<KpiMetric, "createdAt" | "updatedAt" | "observationCount">,
): KpiMetric {
  const timestamp = new Date().toISOString();
  return {
    ...input,
    observationCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/** Default Empire KPI metric definitions. */
export function createDefaultKpiMetrics(workspaceId: string): KpiMetric[] {
  return [
    metric({
      kpiId: CANONICAL_KPI_IDS.VISITORS,
      workspaceId,
      metricKey: "visitors",
      name: "Visitors",
      description: "Storefront and campaign visitor traffic across Empire properties.",
      unit: "count",
      period: "monthly",
      currentValue: 0,
      targetValue: 10_000,
      metadata: { tier: "traffic" },
    }),
    metric({
      kpiId: CANONICAL_KPI_IDS.ORDERS,
      workspaceId,
      metricKey: "orders",
      name: "Orders",
      description: "Completed customer orders across live revenue loops.",
      unit: "count",
      period: "monthly",
      currentValue: 0,
      targetValue: 100,
      metadata: { tier: "commerce" },
    }),
    metric({
      kpiId: CANONICAL_KPI_IDS.REVENUE,
      workspaceId,
      metricKey: "revenue",
      name: "Revenue",
      description: "Gross revenue in cents — ledger-backed financial truth.",
      unit: "cents",
      period: "all_time",
      currentValue: 0,
      metadata: { tier: "financial", source: "ledger" },
    }),
    metric({
      kpiId: CANONICAL_KPI_IDS.PROFIT,
      workspaceId,
      metricKey: "profit",
      name: "Profit",
      description: "Net profit in cents after COGS, ads, and operating costs.",
      unit: "cents",
      period: "all_time",
      currentValue: 0,
      metadata: { tier: "financial", source: "ledger" },
    }),
    metric({
      kpiId: CANONICAL_KPI_IDS.EA_PROFIT,
      workspaceId,
      metricKey: "eaProfit",
      name: "EA Profit",
      description: "EmpireAI platform profit share and royalty accrual.",
      unit: "cents",
      period: "all_time",
      currentValue: 0,
      metadata: { tier: "financial", entity: "EmpireAI" },
    }),
    metric({
      kpiId: CANONICAL_KPI_IDS.EC_CAPITAL,
      workspaceId,
      metricKey: "ecCapital",
      name: "EC Capital",
      description: "Empire Capital treasury balance and deployable capital.",
      unit: "cents",
      period: "all_time",
      currentValue: 0,
      metadata: { tier: "financial", entity: "Empire Capital" },
    }),
    metric({
      kpiId: CANONICAL_KPI_IDS.V_PROGRESS,
      workspaceId,
      metricKey: "vProgress",
      name: "V Progress",
      description: "Vennya brand portfolio progress score (0–100).",
      unit: "score",
      period: "monthly",
      currentValue: 0,
      targetValue: 100,
      metadata: { tier: "brand", entity: "Vennya" },
    }),
    metric({
      kpiId: CANONICAL_KPI_IDS.FOUNDER_GROWTH,
      workspaceId,
      metricKey: "founderGrowth",
      name: "Founder Growth",
      description: "Founder account growth and sovereign capability expansion score.",
      unit: "percent",
      period: "monthly",
      currentValue: 0,
      targetValue: 100,
      metadata: { tier: "founder" },
    }),
  ];
}
