import { z } from "zod";

export const INVENTORY_SIGNAL_TYPES = [
  "demand_accuracy",
  "seasonality_fit",
  "supplier_availability",
  "lead_time_reliability",
  "safety_stock_adequacy",
  "restock_readiness",
  "inventory_composite",
] as const;

export type InventorySignalType = (typeof INVENTORY_SIGNAL_TYPES)[number];

/** Scoring signal for inventory prediction confidence. */
export type InventorySignal = {
  signalType: InventorySignalType;
  score: number;
  weight: number;
  detail: string;
};

export const inventorySignalSchema = z.object({
  signalType: z.enum(INVENTORY_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates an InventorySignal record shape. */
export function validateInventorySignal(value: unknown): InventorySignal {
  return inventorySignalSchema.parse(value);
}
