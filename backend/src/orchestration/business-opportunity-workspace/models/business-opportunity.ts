import { z } from "zod";

import { MARKETPLACE_IDS } from "../../marketplace-infrastructure-engine/models/marketplace-connection.js";
import { marketplaceRecommendationSchema } from "../../product-discovery-opportunity-engine/models/product-opportunity.js";

export const BUSINESS_OPPORTUNITY_STATUSES = [
  "DISCOVERED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "READY_FOR_BUILD",
] as const;

export type BusinessOpportunityStatus = (typeof BUSINESS_OPPORTUNITY_STATUSES)[number];

export const businessOpportunityBrandSchema = z.object({
  brand: z.string().min(1),
  category: z.string().min(1),
  businessName: z.string().min(1),
  logoPlaceholder: z.string().min(1),
  brandConfidence: z.number().int().min(0).max(100),
});

export const businessOpportunityEconomicsSchema = z.object({
  productName: z.string().min(1),
  productId: z.string().min(1),
  supplier: z.string().min(1),
  supplierConfidence: z.number().int().min(0).max(100),
  estimatedMargin: z.number().min(0).max(100),
  shippingEstimate: z.number().min(0).max(100),
  repeatPurchasePotential: z.number().min(0).max(100),
  dominationScore: z.number().min(0).max(100),
  competitionEstimate: z.number().min(0).max(100),
  expectedRoi: z.number().min(0).max(100),
  marketplaceRecommendation: marketplaceRecommendationSchema,
  recommendedMarketplace: z.enum(MARKETPLACE_IDS),
  expectedMonthlyRevenue: z.number().min(0),
  expectedMonthlyProfit: z.number().min(0),
  expectedBreakevenMonths: z.number().min(0),
  launchConfidence: z.number().int().min(0).max(100),
});

export const generatedAssetsPreviewSchema = z.object({
  listingTitle: z.string().min(1),
  listingDescription: z.string().min(1),
  seoKeywords: z.array(z.string()),
  heroImagePlaceholder: z.string().min(1),
  productImagePlaceholders: z.array(z.string()),
  shortVideoStoryboard: z.array(z.string()),
  brandStory: z.string().min(1),
});

export const marketIntelligenceSchema = z.object({
  competitorSummary: z.string().min(1),
  marketOpportunitySummary: z.string().min(1),
  riskSummary: z.string().min(1),
  expansionPotential: z.string().min(1),
});

export const businessOpportunityRecordSchema = z.object({
  businessOpportunityId: z.string().min(1),
  sourceOpportunityId: z.string().min(1),
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  discoverySessionId: z.string().optional(),
  status: z.enum(BUSINESS_OPPORTUNITY_STATUSES),
  rank: z.number().int().min(1),
  favorite: z.boolean().default(false),
  notes: z.string().default(""),
  brand: businessOpportunityBrandSchema,
  economics: businessOpportunityEconomicsSchema,
  assetsPreview: generatedAssetsPreviewSchema,
  marketIntelligence: marketIntelligenceSchema,
  investmentThesis: z.string().min(1),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export type BusinessOpportunityRecord = z.infer<typeof businessOpportunityRecordSchema>;
export type GeneratedAssetsPreview = z.infer<typeof generatedAssetsPreviewSchema>;
export type MarketIntelligence = z.infer<typeof marketIntelligenceSchema>;

export const approvalHistoryEntrySchema = z.object({
  historyId: z.string().min(1),
  businessOpportunityId: z.string().min(1),
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  action: z.enum(["APPROVE", "REJECT", "SAVE_FOR_LATER", "DISCOVERED", "READY_FOR_BUILD"]),
  actor: z.string().min(1),
  reason: z.string().optional(),
  previousStatus: z.enum(BUSINESS_OPPORTUNITY_STATUSES).optional(),
  newStatus: z.enum(BUSINESS_OPPORTUNITY_STATUSES),
  recordedAt: z.string().datetime({ offset: true }),
});

export type ApprovalHistoryEntry = z.infer<typeof approvalHistoryEntrySchema>;

export const businessOpportunityComparisonSchema = z.object({
  opportunityA: businessOpportunityRecordSchema,
  opportunityB: businessOpportunityRecordSchema,
  highlights: z.object({
    betterMargin: z.enum(["A", "B", "TIE"]),
    betterSupplier: z.enum(["A", "B", "TIE"]),
    betterBrand: z.enum(["A", "B", "TIE"]),
    betterMarketplace: z.enum(["A", "B", "TIE"]),
    betterRoi: z.enum(["A", "B", "TIE"]),
    betterConfidence: z.enum(["A", "B", "TIE"]),
  }),
  summary: z.string().min(1),
});

export type BusinessOpportunityComparison = z.infer<typeof businessOpportunityComparisonSchema>;

export const businessWorkspaceDashboardSchema = z.object({
  topOpportunities: z.array(businessOpportunityRecordSchema),
  latestApprovedBusiness: businessOpportunityRecordSchema.optional(),
  businessesUnderReview: z.number().int().min(0),
  highestDominationScore: z.number().int().min(0).max(100),
  highestExpectedRoi: z.number().min(0).max(100),
  recommendedNextBusiness: z.string(),
  computedAt: z.string().datetime({ offset: true }),
});

export type BusinessWorkspaceDashboard = z.infer<typeof businessWorkspaceDashboardSchema>;

export type BusinessOpportunityListFilters = {
  status?: BusinessOpportunityStatus;
  category?: string;
  favorite?: boolean;
  minDominationScore?: number;
  minExpectedRoi?: number;
  sortBy?: "rank" | "dominationScore" | "expectedRoi" | "launchConfidence";
};
