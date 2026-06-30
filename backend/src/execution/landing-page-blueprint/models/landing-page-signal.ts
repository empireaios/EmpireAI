import { z } from "zod";

export const LANDING_PAGE_SIGNAL_TYPES = [
  "offer_alignment",
  "brand_alignment",
  "hero_strength",
  "benefits_clarity",
  "cta_strength",
  "section_coverage",
  "social_proof_fit",
  "blueprint_composite",
] as const;

export type LandingPageSignalType = (typeof LANDING_PAGE_SIGNAL_TYPES)[number];

/** Individual factor contributing to landing page blueprint scoring. */
export type LandingPageSignal = {
  signalType: LandingPageSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const landingPageSignalSchema = z.object({
  signalType: z.enum(LANDING_PAGE_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a LandingPageSignal record shape. */
export function validateLandingPageSignal(value: unknown): LandingPageSignal {
  return landingPageSignalSchema.parse(value);
}
