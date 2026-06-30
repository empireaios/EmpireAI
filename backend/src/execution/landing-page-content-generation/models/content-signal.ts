import { z } from "zod";

export const CONTENT_SIGNAL_TYPES = [
  "blueprint_alignment",
  "offer_style_alignment",
  "brand_voice_alignment",
  "audience_alignment",
  "conversion_focus",
  "hero_copy_strength",
  "benefits_clarity",
  "content_composite",
] as const;

export type ContentSignalType = (typeof CONTENT_SIGNAL_TYPES)[number];

/** Individual factor contributing to landing page content scoring. */
export type ContentSignal = {
  signalType: ContentSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const contentSignalSchema = z.object({
  signalType: z.enum(CONTENT_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a ContentSignal record shape. */
export function validateContentSignal(value: unknown): ContentSignal {
  return contentSignalSchema.parse(value);
}
