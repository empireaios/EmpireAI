import { z } from "zod";

import { contentSignalSchema, type ContentSignal } from "./content-signal.js";

export type LandingPageContentId = string;

/** Complete landing page content generated from a blueprint. */
export type LandingPageContent = {
  contentId: LandingPageContentId;
  workspaceId: string;
  pageId: string;
  offerId: string;
  brandId: string;
  productId: string;
  heroCopy: string;
  problemCopy: string;
  solutionCopy: string;
  benefitsCopy: string;
  offerCopy: string;
  socialProofCopy: string;
  faqCopy: string;
  ctaCopy: string;
  confidence: number;
  signals: ContentSignal[];
  createdAt: string;
  updatedAt: string;
};

export type LandingPageContentCreateInput = Omit<
  LandingPageContent,
  "contentId" | "workspaceId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const landingPageContentSchema = z.object({
  contentId: z.string().min(1),
  workspaceId: z.string().min(1),
  pageId: z.string().min(1),
  offerId: z.string().min(1),
  brandId: z.string().min(1),
  productId: z.string().min(1),
  heroCopy: z.string().min(1),
  problemCopy: z.string().min(1),
  solutionCopy: z.string().min(1),
  benefitsCopy: z.string().min(1),
  offerCopy: z.string().min(1),
  socialProofCopy: z.string().min(1),
  faqCopy: z.string().min(1),
  ctaCopy: z.string().min(1),
  confidence: z.number().min(0).max(100),
  signals: z.array(contentSignalSchema),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a LandingPageContent record shape. */
export function validateLandingPageContent(value: unknown): LandingPageContent {
  return landingPageContentSchema.parse(value);
}
