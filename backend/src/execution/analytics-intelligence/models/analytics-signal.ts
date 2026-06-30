import { z } from "zod";

export const ANALYTICS_SIGNAL_TYPES = [
  "tracking_coverage",
  "event_completeness",
  "funnel_definition",
  "attribution_model",
  "dashboard_readiness",
  "server_side_coverage",
  "blueprint_composite",
] as const;

export type AnalyticsSignalType = (typeof ANALYTICS_SIGNAL_TYPES)[number];

/** Scoring signal for analytics blueprint confidence. */
export type AnalyticsSignal = {
  signalType: AnalyticsSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const analyticsSignalSchema = z.object({
  signalType: z.enum(ANALYTICS_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates an AnalyticsSignal record shape. */
export function validateAnalyticsSignal(value: unknown): AnalyticsSignal {
  return analyticsSignalSchema.parse(value);
}
