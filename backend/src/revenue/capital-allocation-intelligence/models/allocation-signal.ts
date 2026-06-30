import { z } from "zod";

export const ALLOCATION_SIGNAL_TYPES = [
  "portfolio_score",
  "confidence",
  "expected_value",
  "expected_difficulty",
  "risk_level",
  "portfolio_state",
  "allocation_weight",
  "risk_adjustment",
] as const;

export type AllocationSignalType = (typeof ALLOCATION_SIGNAL_TYPES)[number];

/** Individual factor contributing to capital allocation scoring. */
export type AllocationSignal = {
  signalType: AllocationSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const allocationSignalSchema = z.object({
  signalType: z.enum(ALLOCATION_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates an AllocationSignal record shape. */
export function validateAllocationSignal(value: unknown): AllocationSignal {
  return allocationSignalSchema.parse(value);
}
