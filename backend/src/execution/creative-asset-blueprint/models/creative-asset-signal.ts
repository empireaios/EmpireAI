import { z } from "zod";

export const CREATIVE_ASSET_SIGNAL_TYPES = [
  "brand_alignment",
  "hook_strength",
  "prompt_coverage",
  "script_readiness",
  "tool_support",
  "blueprint_composite",
] as const;

export type CreativeAssetSignalType = (typeof CREATIVE_ASSET_SIGNAL_TYPES)[number];

/** Individual factor contributing to creative asset blueprint scoring. */
export type CreativeAssetSignal = {
  signalType: CreativeAssetSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const creativeAssetSignalSchema = z.object({
  signalType: z.enum(CREATIVE_ASSET_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a CreativeAssetSignal record shape. */
export function validateCreativeAssetSignal(value: unknown): CreativeAssetSignal {
  return creativeAssetSignalSchema.parse(value);
}
