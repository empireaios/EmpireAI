import { z } from "zod";

import {
  landingPageSectionSchema,
  type LandingPageSection,
} from "./landing-page-section.js";
import {
  landingPageSignalSchema,
  type LandingPageSignal,
} from "./landing-page-signal.js";

export type LandingPageBlueprintId = string;

/** Landing page blueprint generated from a product offer. */
export type LandingPageBlueprint = {
  pageId: LandingPageBlueprintId;
  workspaceId: string;
  offerId: string;
  brandId: string;
  productId: string;
  pageTitle: string;
  heroSection: LandingPageSection;
  problemSection: LandingPageSection;
  solutionSection: LandingPageSection;
  benefitsSection: LandingPageSection;
  offerSection: LandingPageSection;
  socialProofSection: LandingPageSection;
  faqSection: LandingPageSection;
  ctaSection: LandingPageSection;
  confidence: number;
  signals: LandingPageSignal[];
  createdAt: string;
  updatedAt: string;
};

export type LandingPageBlueprintCreateInput = Omit<
  LandingPageBlueprint,
  "pageId" | "workspaceId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const landingPageBlueprintSchema = z.object({
  pageId: z.string().min(1),
  workspaceId: z.string().min(1),
  offerId: z.string().min(1),
  brandId: z.string().min(1),
  productId: z.string().min(1),
  pageTitle: z.string().min(1),
  heroSection: landingPageSectionSchema,
  problemSection: landingPageSectionSchema,
  solutionSection: landingPageSectionSchema,
  benefitsSection: landingPageSectionSchema,
  offerSection: landingPageSectionSchema,
  socialProofSection: landingPageSectionSchema,
  faqSection: landingPageSectionSchema,
  ctaSection: landingPageSectionSchema,
  confidence: z.number().min(0).max(100),
  signals: z.array(landingPageSignalSchema),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a LandingPageBlueprint record shape. */
export function validateLandingPageBlueprint(value: unknown): LandingPageBlueprint {
  return landingPageBlueprintSchema.parse(value);
}
