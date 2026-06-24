import { z } from "zod";

export const LAUNCH_DECISION_SIGNAL_TYPES = [
  "opportunity_score",
  "supplier_match_score",
  "buyer_match_score",
  "reachability_score",
  "risk_score",
  "confidence",
] as const;

export type LaunchDecisionSignalType = (typeof LAUNCH_DECISION_SIGNAL_TYPES)[number];

/** Individual factor contributing to a commerce launch decision. */
export type LaunchDecisionSignal = {
  signalType: LaunchDecisionSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const launchDecisionSignalSchema = z.object({
  signalType: z.enum(LAUNCH_DECISION_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a LaunchDecisionSignal record shape. */
export function validateLaunchDecisionSignal(value: unknown): LaunchDecisionSignal {
  return launchDecisionSignalSchema.parse(value);
}
