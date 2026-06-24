import { z } from "zod";

export const PRIORITY_SIGNAL_TYPES = [
  "opportunity",
  "trend_forecast",
  "source_trust",
  "urgency",
  "uncertainty",
  "priority_composite",
] as const;

export type PrioritySignalType = (typeof PRIORITY_SIGNAL_TYPES)[number];

/** Individual factor contributing to an investigation priority score. */
export type PrioritySignal = {
  signalType: PrioritySignalType;
  score: number;
  weight: number;
  detail: string;
};

export const prioritySignalSchema = z.object({
  signalType: z.enum(PRIORITY_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a PrioritySignal record shape. */
export function validatePrioritySignal(value: unknown): PrioritySignal {
  return prioritySignalSchema.parse(value);
}
