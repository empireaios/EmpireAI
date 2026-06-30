import { z } from "zod";

export const DASHBOARD_METRIC_CATEGORIES = [
  "TRAFFIC",
  "CONVERSION",
  "REVENUE",
  "ACQUISITION",
  "RETENTION",
] as const;

export type DashboardMetricCategory = (typeof DASHBOARD_METRIC_CATEGORIES)[number];

/** Dashboard metric definition for analytics reporting. */
export type DashboardMetric = {
  metricId: string;
  name: string;
  category: DashboardMetricCategory;
  formula: string;
  unit: string;
  targetValue: number;
  dataSource: "GA4" | "META" | "TIKTOK" | "COMPOSITE";
};

export const dashboardMetricSchema = z.object({
  metricId: z.string().min(1),
  name: z.string().min(1),
  category: z.enum(DASHBOARD_METRIC_CATEGORIES),
  formula: z.string().min(1),
  unit: z.string().min(1),
  targetValue: z.number().min(0),
  dataSource: z.enum(["GA4", "META", "TIKTOK", "COMPOSITE"]),
});

/** Validates a DashboardMetric record shape. */
export function validateDashboardMetric(value: unknown): DashboardMetric {
  return dashboardMetricSchema.parse(value);
}
