import { z } from "zod";

export const MANUFACTURING_SIGNAL_TYPES = [
  "eye_intelligence",
  "opportunity_selection",
  "supplier_readiness",
  "brand_store_pipeline",
  "marketing_launch",
  "deployment_package",
  "loop_composite",
] as const;

export type ManufacturingSignalType = (typeof MANUFACTURING_SIGNAL_TYPES)[number];

/** Scoring signal for autonomous company manufacturing loop synthesis. */
export type ManufacturingSignal = {
  signalType: ManufacturingSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const manufacturingSignalSchema = z.object({
  signalType: z.enum(MANUFACTURING_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a ManufacturingSignal record shape. */
export function validateManufacturingSignal(value: unknown): ManufacturingSignal {
  return manufacturingSignalSchema.parse(value);
}
