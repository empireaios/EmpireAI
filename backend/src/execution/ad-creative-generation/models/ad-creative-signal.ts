import { z } from "zod";

export const AD_CREATIVE_SIGNAL_TYPES = [
  "strategy_strength",
  "static_coverage",
  "video_coverage",
  "platform_fit",
  "copy_quality",
  "scoring_composite",
  "package_composite",
] as const;

export type AdCreativeSignalType = (typeof AD_CREATIVE_SIGNAL_TYPES)[number];

/** Scoring signal contributing to ad creative package confidence. */
export type AdCreativeSignal = {
  signalType: AdCreativeSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const adCreativeSignalSchema = z.object({
  signalType: z.enum(AD_CREATIVE_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates an AdCreativeSignal record shape. */
export function validateAdCreativeSignal(value: unknown): AdCreativeSignal {
  return adCreativeSignalSchema.parse(value);
}
