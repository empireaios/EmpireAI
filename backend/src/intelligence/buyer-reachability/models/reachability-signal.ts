import { z } from "zod";

export const REACHABILITY_SIGNAL_TYPES = [
  "platform_preference",
  "interest_fit",
  "age_fit",
  "search_behavior",
  "urgency",
  "spending_power",
] as const;

export type ReachabilitySignalType = (typeof REACHABILITY_SIGNAL_TYPES)[number];

/** Individual signal contributing to buyer reachability scoring. */
export type ReachabilitySignal = {
  signalType: ReachabilitySignalType;
  score: number;
  weight: number;
  detail: string;
};

export const reachabilitySignalSchema = z.object({
  signalType: z.enum(REACHABILITY_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a ReachabilitySignal record shape. */
export function validateReachabilitySignal(value: unknown): ReachabilitySignal {
  return reachabilitySignalSchema.parse(value);
}
