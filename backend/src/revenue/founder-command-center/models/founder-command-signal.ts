import { z } from "zod";

export const FOUNDER_COMMAND_SIGNAL_TYPES = [
  "opportunity_coverage",
  "brand_readiness",
  "store_pipeline",
  "supplier_health",
  "campaign_momentum",
  "capital_efficiency",
  "revenue_trajectory",
  "deployment_readiness",
  "dashboard_composite",
] as const;

export type FounderCommandSignalType = (typeof FOUNDER_COMMAND_SIGNAL_TYPES)[number];

/** Scoring signal for founder command center synthesis. */
export type FounderCommandSignal = {
  signalType: FounderCommandSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const founderCommandSignalSchema = z.object({
  signalType: z.enum(FOUNDER_COMMAND_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a FounderCommandSignal record shape. */
export function validateFounderCommandSignal(value: unknown): FounderCommandSignal {
  return founderCommandSignalSchema.parse(value);
}
