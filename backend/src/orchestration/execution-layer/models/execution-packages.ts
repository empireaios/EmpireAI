import { z } from "zod";

import { executionTraceSchema, explainableRecommendationSchema } from "../../ecommerce-os-orchestrator/models/execution-doctrine.js";

export const PUBLICATION_MARKETPLACES = [
  "amazon",
  "tiktok-shop",
  "shopify",
  "ebay",
  "google-merchant",
  "facebook-shop",
  "instagram-shop",
] as const;

export type PublicationMarketplaceId = (typeof PUBLICATION_MARKETPLACES)[number];

export const ORGANIC_CHANNELS = [
  "tiktok",
  "instagram",
  "facebook",
  "pinterest",
  "youtube-shorts",
] as const;

export const PAID_CHANNELS = ["meta-ads", "tiktok-ads", "google-ads"] as const;

export const marketplaceListingPackageSchema = z.object({
  marketplaceId: z.enum(PUBLICATION_MARKETPLACES),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  description: z.string().min(1),
  bulletPoints: z.array(z.string()),
  searchTerms: z.array(z.string()),
  categoryPath: z.string().min(1),
  brand: z.string().min(1),
  price: z.number().min(0),
  compareAtPrice: z.number().min(0).optional(),
  sku: z.string().min(1),
  images: z.array(z.string()),
  videoUrl: z.string().optional(),
  fulfillmentType: z.string().min(1),
  complete: z.boolean(),
  publishBlocked: z.literal(true),
});

export const publicationPackageSchema = z.object({
  packageId: z.string().min(1),
  buildId: z.string().min(1),
  businessOpportunityId: z.string().min(1),
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  businessName: z.string().min(1),
  listings: z.array(marketplaceListingPackageSchema).length(7),
  validationScore: z.number().int().min(0).max(100),
  complete: z.boolean(),
  executionTrace: executionTraceSchema,
  createdAt: z.string().datetime({ offset: true }),
});

export const campaignCreativeSchema = z.object({
  channel: z.string().min(1),
  headline: z.string().min(1),
  hook: z.string().min(1),
  copy: z.string().min(1),
  cta: z.string().min(1),
  creativePlaceholder: z.string().min(1),
});

export const marketingCampaignPackageSchema = z.object({
  packageId: z.string().min(1),
  buildId: z.string().min(1),
  simulationId: z.string().optional(),
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  businessName: z.string().min(1),
  organicCampaigns: z.array(campaignCreativeSchema),
  paidCampaigns: z.array(campaignCreativeSchema),
  audiences: z.array(z.string()),
  budgetRecommendation: z.number().min(0),
  roiProjection: z.number().min(0),
  executionBlocked: z.literal(true),
  executionTrace: executionTraceSchema,
  createdAt: z.string().datetime({ offset: true }),
});

export const fulfillmentPackageSchema = z.object({
  packageId: z.string().min(1),
  buildId: z.string().min(1),
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  businessName: z.string().min(1),
  supplierMapping: z.object({
    supplierId: z.string(),
    supplierName: z.string(),
    productId: z.string(),
    confidence: z.number().int().min(0).max(100),
  }),
  backupSupplier: z.object({
    supplierId: z.string(),
    supplierName: z.string(),
    confidence: z.number().int().min(0).max(100),
  }),
  skuMapping: z.object({
    internalSku: z.string(),
    supplierSku: z.string(),
    variantLabel: z.string(),
  }),
  shippingRules: z.array(z.string()),
  packagingRequirements: z.array(z.string()),
  qualityChecklist: z.array(z.string()),
  returnHandling: z.array(z.string()),
  fulfillmentValidation: z.object({
    valid: z.boolean(),
    blockers: z.array(z.string()),
  }),
  executionBlocked: z.literal(true),
  executionTrace: executionTraceSchema,
  createdAt: z.string().datetime({ offset: true }),
});

export const revenueActivationPackageSchema = z.object({
  packageId: z.string().min(1),
  buildId: z.string().min(1),
  simulationId: z.string().min(1),
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  businessName: z.string().min(1),
  revenueProjection: z.number(),
  grossProfit: z.number(),
  netProfit: z.number(),
  breakEvenMonths: z.number().min(0),
  cacEstimate: z.number().min(0),
  ltvEstimate: z.number().min(0),
  roiEstimate: z.number().min(0),
  cashflowForecast: z.array(z.object({
    month: z.number().int(),
    netCashflow: z.number(),
  })),
  transactionBlocked: z.literal(true),
  executionTrace: executionTraceSchema,
  createdAt: z.string().datetime({ offset: true }),
});

export const commerceOperationsDashboardSchema = z.object({
  businesses: z.number().int().min(0),
  products: z.number().int().min(0),
  marketplaces: z.number().int().min(0),
  publicationPackages: z.number().int().min(0),
  marketingPackages: z.number().int().min(0),
  fulfillmentPackages: z.number().int().min(0),
  revenuePackages: z.number().int().min(0),
  warnings: z.array(z.string()),
  errors: z.array(z.string()),
  recommendedNextAction: z.string(),
  overallHealth: z.number().int().min(0).max(100),
  computedAt: z.string().datetime({ offset: true }),
});

export const businessHealthRecordSchema = z.object({
  healthId: z.string().min(1),
  businessOpportunityId: z.string().min(1),
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  businessHealth: z.number().int().min(0).max(100),
  brandHealth: z.number().int().min(0).max(100),
  marketplaceHealth: z.number().int().min(0).max(100),
  supplierHealth: z.number().int().min(0).max(100),
  customerHealth: z.number().int().min(0).max(100),
  cashflowHealth: z.number().int().min(0).max(100),
  growthHealth: z.number().int().min(0).max(100),
  unifiedHealthScore: z.number().int().min(0).max(100),
  evaluatedAt: z.string().datetime({ offset: true }),
});

export const growthOptimizationRecordSchema = z.object({
  optimizationId: z.string().min(1),
  businessOpportunityId: z.string().min(1),
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  recommendations: z.array(z.object({
    category: z.string().min(1),
    recommendation: z.string().min(1),
    priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  })),
  explainability: explainableRecommendationSchema,
  recommendationOnly: z.literal(true),
  createdAt: z.string().datetime({ offset: true }),
});

export const customerLifetimeRecordSchema = z.object({
  recordId: z.string().min(1),
  businessOpportunityId: z.string().min(1),
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  repeatPurchasePotential: z.number().int().min(0).max(100),
  customerSegments: z.array(z.string()),
  purchaseFrequency: z.string().min(1),
  brandAffinity: z.number().int().min(0).max(100),
  loyaltyOpportunities: z.array(z.string()),
  emailOpportunities: z.array(z.string()),
  vipOpportunities: z.array(z.string()),
  subscriptionOpportunities: z.array(z.string()),
  recommendationOnly: z.literal(true),
  createdAt: z.string().datetime({ offset: true }),
});

export const executiveCommandCenterSchema = z.object({
  todaysRevenueProjection: z.number(),
  portfolioValue: z.number(),
  businesses: z.number().int().min(0),
  brands: z.number().int().min(0),
  launchQueue: z.array(z.string()),
  capitalUtilisation: z.number().min(0).max(100),
  monthlyBudget: z.number().min(0),
  expectedPayback: z.number().min(0),
  topRisks: z.array(z.string()),
  topOpportunities: z.array(z.string()),
  recommendedExecutiveActions: z.array(z.string()),
  missionStatus: z.record(z.string()),
  soulFileStatus: z.string(),
  systemHealth: z.number().int().min(0).max(100),
  computedAt: z.string().datetime({ offset: true }),
});

export const pipelineStageValidationSchema = z.object({
  stage: z.string().min(1),
  missionId: z.string().min(1),
  present: z.boolean(),
  packageId: z.string().optional(),
  blockers: z.array(z.string()),
});

export const pipelineValidationResultSchema = z.object({
  validationId: z.string().min(1),
  businessOpportunityId: z.string().min(1),
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  valid: z.boolean(),
  stages: z.array(pipelineStageValidationSchema),
  packageIntegrity: z.boolean(),
  dependencyChain: z.boolean(),
  governanceCompliant: z.boolean(),
  noDuplicatedLogic: z.literal(true),
  blockers: z.array(z.string()),
  validatedAt: z.string().datetime({ offset: true }),
});

export type PublicationPackage = z.infer<typeof publicationPackageSchema>;
export type MarketingCampaignPackage = z.infer<typeof marketingCampaignPackageSchema>;
export type FulfillmentPackage = z.infer<typeof fulfillmentPackageSchema>;
export type RevenueActivationPackage = z.infer<typeof revenueActivationPackageSchema>;
export type CommerceOperationsDashboard = z.infer<typeof commerceOperationsDashboardSchema>;
export type BusinessHealthRecord = z.infer<typeof businessHealthRecordSchema>;
export type GrowthOptimizationRecord = z.infer<typeof growthOptimizationRecordSchema>;
export type CustomerLifetimeRecord = z.infer<typeof customerLifetimeRecordSchema>;
export type ExecutiveCommandCenter = z.infer<typeof executiveCommandCenterSchema>;
export type PipelineValidationResult = z.infer<typeof pipelineValidationResultSchema>;

export type ExecutionPackageType =
  | "PUBLICATION_PACKAGE"
  | "MARKETING_CAMPAIGN_PACKAGE"
  | "FULFILLMENT_PACKAGE"
  | "REVENUE_ACTIVATION_PACKAGE"
  | "BUSINESS_HEALTH"
  | "GROWTH_OPTIMIZATION"
  | "CUSTOMER_LIFETIME"
  | "PIPELINE_VALIDATION";
