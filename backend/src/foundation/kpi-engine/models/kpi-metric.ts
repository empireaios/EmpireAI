import { z } from "zod";

export const KPI_METRIC_KEYS = [
  "visitors",
  "orders",
  "revenue",
  "profit",
  "eaProfit",
  "ecCapital",
  "vProgress",
  "founderGrowth",
] as const;

export type KpiMetricKey = (typeof KPI_METRIC_KEYS)[number];

export const KPI_UNITS = ["count", "cents", "percent", "score"] as const;

export type KpiUnit = (typeof KPI_UNITS)[number];

export const KPI_PERIODS = ["daily", "weekly", "monthly", "all_time"] as const;

export type KpiPeriod = (typeof KPI_PERIODS)[number];

export const KPI_LIFECYCLE_EVENTS = [
  "REGISTERED",
  "UPDATED",
  "OBSERVATION_RECORDED",
  "TARGET_SET",
  "SYNCED",
] as const;

export type KpiLifecycleEvent = (typeof KPI_LIFECYCLE_EVENTS)[number];

export const kpiMetricSchema = z.object({
  kpiId: z.string().min(1),
  workspaceId: z.string().min(1),
  metricKey: z.enum(KPI_METRIC_KEYS),
  name: z.string().min(1),
  description: z.string().min(1),
  unit: z.enum(KPI_UNITS),
  period: z.enum(KPI_PERIODS).default("all_time"),
  currentValue: z.number(),
  previousValue: z.number().optional(),
  targetValue: z.number().optional(),
  observationCount: z.number().int().min(0).default(0),
  metadata: z.record(z.string()).default({}),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export type KpiMetric = z.infer<typeof kpiMetricSchema>;

export type KpiObservation = {
  observationId: string;
  kpiId: string;
  workspaceId: string;
  value: number;
  source: string;
  actor: string;
  correlationId?: string;
  metadata: Record<string, string>;
  recordedAt: string;
};

export type KpiLifecycleRecord = {
  lifecycleId: string;
  kpiId: string;
  workspaceId: string;
  event: KpiLifecycleEvent;
  summary: string;
  actor: string;
  correlationId?: string;
  metadata: Record<string, string>;
  createdAt: string;
};

export type KpiDashboardEntry = {
  kpiId: string;
  metricKey: KpiMetricKey;
  name: string;
  unit: KpiUnit;
  currentValue: number;
  previousValue?: number;
  targetValue?: number;
  delta?: number;
  deltaPercent?: number;
  progressToTarget?: number;
};

export type KpiDashboard = {
  workspaceId: string;
  metrics: KpiDashboardEntry[];
  computedAt: string;
};

export type KpiObservationInput = {
  workspaceId: string;
  kpiId?: string;
  metricKey?: KpiMetricKey;
  value: number;
  source?: string;
  actor?: string;
  correlationId?: string;
  metadata?: Record<string, string>;
};

/** Stable KPI IDs — modules record observations by key, not hardcoded logic. */
export const CANONICAL_KPI_IDS = {
  VISITORS: "kpi:visitors",
  ORDERS: "kpi:orders",
  REVENUE: "kpi:revenue",
  PROFIT: "kpi:profit",
  EA_PROFIT: "kpi:ea-profit",
  EC_CAPITAL: "kpi:ec-capital",
  V_PROGRESS: "kpi:v-progress",
  FOUNDER_GROWTH: "kpi:founder-growth",
} as const;

export function validateKpiMetric(value: unknown): KpiMetric {
  return kpiMetricSchema.parse(value);
}

export function computeDelta(current: number, previous?: number): { delta?: number; deltaPercent?: number } {
  if (previous === undefined) {
    return {};
  }
  const delta = current - previous;
  const deltaPercent = previous === 0 ? undefined : Number(((delta / previous) * 100).toFixed(2));
  return { delta, deltaPercent };
}

export function computeProgressToTarget(current: number, target?: number): number | undefined {
  if (target === undefined || target === 0) {
    return undefined;
  }
  return Math.min(100, Math.round((current / target) * 100));
}
