import { z } from "zod";

export const LANDING_PAGE_SECTION_TYPES = [
  "HERO",
  "PROBLEM",
  "SOLUTION",
  "BENEFITS",
  "OFFER",
  "SOCIAL_PROOF",
  "FAQ",
  "CTA",
] as const;

export type LandingPageSectionType = (typeof LANDING_PAGE_SECTION_TYPES)[number];

/** Section blueprint for a landing page. */
export type LandingPageSection = {
  sectionType: LandingPageSectionType;
  title: string;
  headline: string;
  body: string;
  bullets: string[];
  callToAction: string | null;
  order: number;
};

export const landingPageSectionSchema = z.object({
  sectionType: z.enum(LANDING_PAGE_SECTION_TYPES),
  title: z.string().min(1),
  headline: z.string().min(1),
  body: z.string().min(1),
  bullets: z.array(z.string()),
  callToAction: z.string().nullable(),
  order: z.number().int().min(1),
});

/** Validates a LandingPageSection record shape. */
export function validateLandingPageSection(value: unknown): LandingPageSection {
  return landingPageSectionSchema.parse(value);
}
