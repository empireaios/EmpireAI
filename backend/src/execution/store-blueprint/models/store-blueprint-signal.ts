import { z } from "zod";

export const STORE_BLUEPRINT_SIGNAL_TYPES = [
  "brand_alignment",
  "portfolio_coverage",
  "offer_alignment",
  "content_alignment",
  "navigation_completeness",
  "page_structure",
  "collection_depth",
  "store_composite",
] as const;

export type StoreBlueprintSignalType = (typeof STORE_BLUEPRINT_SIGNAL_TYPES)[number];

/** Individual factor contributing to store blueprint scoring. */
export type StoreBlueprintSignal = {
  signalType: StoreBlueprintSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const storeBlueprintSignalSchema = z.object({
  signalType: z.enum(STORE_BLUEPRINT_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a StoreBlueprintSignal record shape. */
export function validateStoreBlueprintSignal(value: unknown): StoreBlueprintSignal {
  return storeBlueprintSignalSchema.parse(value);
}
