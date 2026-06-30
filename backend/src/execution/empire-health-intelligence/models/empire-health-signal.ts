import { z } from "zod";

export const EMPIRE_HEALTH_SIGNAL_TYPES = [
  "revenue_monitor",
  "traffic_monitor",
  "margin_monitor",
  "orders_monitor",
  "refunds_monitor",
  "supplier_monitor",
  "marketing_monitor",
  "empire_composite",
] as const;

export type EmpireHealthSignalType = (typeof EMPIRE_HEALTH_SIGNAL_TYPES)[number];

/** Scoring signal for empire health monitoring confidence. */
export type EmpireHealthSignal = {
  signalType: EmpireHealthSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const empireHealthSignalSchema = z.object({
  signalType: z.enum(EMPIRE_HEALTH_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates an EmpireHealthSignal record shape. */
export function validateEmpireHealthSignal(value: unknown): EmpireHealthSignal {
  return empireHealthSignalSchema.parse(value);
}
