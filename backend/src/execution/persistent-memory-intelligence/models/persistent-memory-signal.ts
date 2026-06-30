import { z } from "zod";

export const PERSISTENT_MEMORY_SIGNAL_TYPES = [
  "product_learning",
  "campaign_learning",
  "supplier_learning",
  "brand_learning",
  "failure_retention",
  "success_retention",
  "history_depth",
  "decision_improvement",
  "memory_composite",
] as const;

export type PersistentMemorySignalType = (typeof PERSISTENT_MEMORY_SIGNAL_TYPES)[number];

/** Scoring signal for persistent memory confidence. */
export type PersistentMemorySignal = {
  signalType: PersistentMemorySignalType;
  score: number;
  weight: number;
  detail: string;
};

export const persistentMemorySignalSchema = z.object({
  signalType: z.enum(PERSISTENT_MEMORY_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a PersistentMemorySignal record shape. */
export function validatePersistentMemorySignal(value: unknown): PersistentMemorySignal {
  return persistentMemorySignalSchema.parse(value);
}
