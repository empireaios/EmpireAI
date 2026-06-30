import { z } from "zod";

export const EXECUTIVE_DASHBOARD_SIGNAL_TYPES = [
  "revenue_health",
  "orders_velocity",
  "traffic_quality",
  "roas_efficiency",
  "profit_margin",
  "inventory_stability",
  "marketing_performance",
  "manufacturing_throughput",
  "eye_intelligence",
  "alert_burden",
  "dashboard_composite",
] as const;

export type ExecutiveDashboardSignalType = (typeof EXECUTIVE_DASHBOARD_SIGNAL_TYPES)[number];

/** Scoring signal for executive dashboard confidence. */
export type ExecutiveDashboardSignal = {
  signalType: ExecutiveDashboardSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const executiveDashboardSignalSchema = z.object({
  signalType: z.enum(EXECUTIVE_DASHBOARD_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates an ExecutiveDashboardSignal record shape. */
export function validateExecutiveDashboardSignal(value: unknown): ExecutiveDashboardSignal {
  return executiveDashboardSignalSchema.parse(value);
}
