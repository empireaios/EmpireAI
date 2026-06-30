import { z } from "zod";

/** REAL-004 — Listing Intelligence output schema. */
export const listingIntelligencePackageSchema = z.object({
  packageId: z.string(),
  workspaceId: z.string(),
  companyId: z.string(),
  supplierProductId: z.string(),
  title: z.string(),
  seoTitle: z.string(),
  searchTerms: z.array(z.string()),
  description: z.string(),
  bulletPoints: z.array(z.string()),
  specifications: z.record(z.string()),
  comparisonTable: z.array(z.object({ attribute: z.string(), value: z.string(), competitor: z.string().optional() })),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })),
  productStory: z.string(),
  targetAudience: z.string(),
  keywords: z.array(z.string()),
  countryLocalizations: z.array(z.object({ country: z.string(), title: z.string(), description: z.string() })),
  marketplaceFormatting: z.record(z.unknown()),
  pricingRecommendation: z.object({ retail: z.number(), min: z.number(), max: z.number(), currency: z.string() }),
  marginRecommendation: z.object({ percent: z.number(), rationale: z.string() }),
  confidenceScore: z.number().min(0).max(100),
  listingQualityScore: z.number().min(0).max(100),
  marketplaceReadiness: z.number().min(0).max(100),
  reusedModules: z.array(z.string()),
  computedAt: z.string().datetime({ offset: true }),
});

export type ListingIntelligencePackage = z.infer<typeof listingIntelligencePackageSchema>;
