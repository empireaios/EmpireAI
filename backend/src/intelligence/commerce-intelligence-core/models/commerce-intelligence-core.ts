import { z } from "zod";

/** Pillow-owned normalized product candidate — supplier raw data never leaves normalization boundary. */
export const ProductCandidateVariantSchema = z.object({
  variantId: z.string(),
  sku: z.string(),
  label: z.string(),
  supplierCostUsd: z.number().nonnegative(),
  inventory: z.number().int().nonnegative(),
  warehouseRegion: z.string(),
});

export const ProductCandidateSchema = z.object({
  candidateId: z.string(),
  workspaceId: z.string(),
  companyId: z.string(),
  supplierId: z.literal("cj-dropshipping"),
  supplierProductId: z.string(),
  title: z.string(),
  category: z.string(),
  supplierCostUsd: z.number().nonnegative(),
  variants: z.array(ProductCandidateVariantSchema),
  inventoryTotal: z.number().int().nonnegative(),
  shippingCountries: z.array(z.string()),
  estimatedDeliveryDays: z.object({ min: z.number().int(), max: z.number().int() }),
  images: z.array(z.string()),
  mediaUrls: z.array(z.string()),
  supplierReliabilityScore: z.number().min(0).max(100),
  fulfilmentReadiness: z.boolean(),
  normalizedAt: z.string(),
});

export const SupplierIntelligenceSchema = z.object({
  viabilityScore: z.number().min(0).max(100),
  supplyRisk: z.enum(["low", "medium", "high"]),
  fulfilmentReadiness: z.boolean(),
  candidateStatus: z.enum(["viable", "at_risk", "not_ready"]),
});

export const CandidateQueueStatusSchema = z.enum([
  "discovered",
  "analyzing",
  "shortlisted",
  "rejected",
  "deferred",
  "mission_ready",
  "not_ready",
]);

export const MarketplaceStudySchema = z.object({
  marketplaceId: z.literal("amazon-us"),
  categoryFitScore: z.number().min(0).max(100),
  marketplaceFitScore: z.number().min(0).max(100),
  competitorPriceRangeUsd: z.object({ min: z.number(), max: z.number() }),
  reviewSaturation: z.enum(["low", "medium", "high"]),
  competitionDensity: z.enum(["low", "medium", "high"]),
  listingQualityGaps: z.array(z.string()),
  estimatedMarketplaceFeesUsd: z.number().nonnegative(),
  publishingReadinessScore: z.number().min(0).max(100),
  recommendedMarketRoute: z.enum(["marketplace", "shopify"]),
  marketplaceRisk: z.enum(["low", "medium", "high"]),
  restrictionRisk: z.enum(["low", "medium", "high"]),
});

export const ArbitrageAnalysisSchema = z.object({
  supplierCostUsd: z.number().nonnegative(),
  shippingCostUsd: z.number().nonnegative(),
  marketplaceFeesUsd: z.number().nonnegative(),
  paymentFeesUsd: z.number().nonnegative(),
  advertisingAllowanceUsd: z.number().nonnegative(),
  expectedSellingPriceUsd: z.number().nonnegative(),
  estimatedGrossMarginPercent: z.number(),
  estimatedNetMarginPercent: z.number(),
  estimatedNetProfitUsd: z.number(),
  arbitrageScore: z.number().min(0).max(100),
  launchBudgetEstimateUsd: z.number().nonnegative(),
  downsideRisk: z.enum(["low", "medium", "high"]),
  passesThreshold: z.boolean(),
  rejectionReason: z.string().optional(),
});

export const ProductRouteSchema = z.enum(["marketplace", "shopify"]);

export const ProductFitIntelligenceSchema = z.object({
  buyerPersona: z.string(),
  painPoint: z.string(),
  impulsePotential: z.number().min(0).max(100),
  giftingPotential: z.number().min(0).max(100),
  premiumPotential: z.number().min(0).max(100),
  adFriendliness: z.number().min(0).max(100),
  refundRisk: z.enum(["low", "medium", "high"]),
  visualAppeal: z.number().min(0).max(100),
  repeatPurchasePotential: z.number().min(0).max(100),
  seasonality: z.string(),
  productFitScore: z.number().min(0).max(100),
  route: ProductRouteSchema,
  routeRationale: z.string(),
  buyerRationale: z.string(),
});

export const MediaGenerationTaskSchema = z.object({
  taskId: z.string(),
  taskType: z.enum(["image", "video", "infographic"]),
  description: z.string(),
  status: z.enum(["planned", "ready", "blocked"]),
});

export const CreativePackageSchema = z.object({
  title: z.string(),
  bulletPoints: z.array(z.string()),
  productDescription: z.string(),
  seoCopy: z.string(),
  amazonListingCopy: z.string(),
  shopifyBrandCopy: z.string(),
  imageImprovementPlan: z.array(z.string()),
  infographicConcept: z.string(),
  shortVideoConcept: z.string(),
  adHooks: z.array(z.string()),
  metaAdCopy: z.string(),
  tiktokScript: z.string(),
  positioningAngle: z.string(),
  mediaGenerationTasks: z.array(MediaGenerationTaskSchema),
  creativePackageStatus: z.enum(["complete", "partial", "planned"]),
  mediaReadiness: z.enum(["ready", "needs_assets", "blocked"]),
});

export const ExecutiveLensSchema = z.object({
  profitRelevance: z.number().min(0).max(100),
  strategicFit: z.number().min(0).max(100),
  capitalEfficiency: z.number().min(0).max(100),
  simplicityOfDecision: z.number().min(0).max(100),
  attentionWorthiness: z.number().min(0).max(100),
  overallScore: z.number().min(0).max(100),
  passes: z.boolean(),
  summary: z.string(),
  evidence: z.array(z.string()),
});

export const CtoLensSchema = z.object({
  supplierConnectionReady: z.boolean(),
  marketplaceConnectionReady: z.boolean(),
  publishingTechnicallySupported: z.boolean(),
  inventorySyncReady: z.boolean(),
  fulfillmentRouteReady: z.boolean(),
  recoveryPathAvailable: z.boolean(),
  monitoringReady: z.boolean(),
  overallScore: z.number().min(0).max(100),
  passes: z.boolean(),
  summary: z.string(),
  evidence: z.array(z.string()),
});

export const ProposalReadinessSchema = z.enum(["READY", "NOT_READY"]);

export const ProductLaunchMissionStatusSchema = z.enum([
  "pending_review",
  "approved",
  "rejected",
  "deferred",
  "publishing",
  "live",
  "monitoring",
  "blocked",
  "failed",
  "recovered",
]);

export const ProductLaunchMissionSchema = z.object({
  missionId: z.string(),
  workspaceId: z.string(),
  companyId: z.string(),
  candidateId: z.string(),
  status: ProductLaunchMissionStatusSchema,
  proposalReadiness: ProposalReadinessSchema,
  commercialScore: z.number().min(0).max(100),
  supplierId: z.literal("cj-dropshipping"),
  marketplaceId: z.literal("amazon-us"),
  route: ProductRouteSchema,
  product: ProductCandidateSchema,
  supplierIntelligence: SupplierIntelligenceSchema,
  marketplaceStudy: MarketplaceStudySchema,
  arbitrage: ArbitrageAnalysisSchema,
  productFit: ProductFitIntelligenceSchema,
  creative: CreativePackageSchema,
  ceoLens: ExecutiveLensSchema,
  ctoLens: CtoLensSchema,
  confidenceScore: z.number().min(0).max(100),
  expectedMarginPercent: z.number(),
  expectedNetProfitRangeUsd: z.object({ min: z.number(), max: z.number() }),
  launchBudgetUsd: z.number().nonnegative(),
  keyRisks: z.array(z.string()),
  whyThisProduct: z.string(),
  whyThisMarket: z.string(),
  whyNow: z.string(),
  recommendation: z.string(),
  whyEvidence: z.array(z.string()),
  gkrProductId: z.string().optional(),
  kingApproved: z.boolean(),
  intelligenceOwner: z.literal("pillow"),
  createdAt: z.string(),
  updatedAt: z.string(),
  decidedAt: z.string().optional(),
  decidedBy: z.string().optional(),
});

export const QueueEntrySchema = z.object({
  candidateId: z.string(),
  title: z.string(),
  category: z.string(),
  status: CandidateQueueStatusSchema,
  confidenceScore: z.number().min(0).max(100),
  commercialScore: z.number().min(0).max(100),
  netMarginPercent: z.number(),
  route: ProductRouteSchema,
  rejectionReason: z.string().optional(),
  deferReason: z.string().optional(),
  missionId: z.string().optional(),
  updatedAt: z.string(),
});

export const LaunchStatusEntrySchema = z.object({
  missionId: z.string(),
  title: z.string(),
  route: ProductRouteSchema,
  status: ProductLaunchMissionStatusSchema,
  gkrProductId: z.string().optional(),
  lastEvent: z.string(),
  updatedAt: z.string(),
});

export const PerformanceSnapshotSchema = z.object({
  snapshotId: z.string(),
  missionId: z.string(),
  sales: z.number().int().nonnegative(),
  revenueUsd: z.number().nonnegative(),
  conversionRate: z.number().min(0).max(100),
  adSpendUsd: z.number().nonnegative(),
  roas: z.number().nonnegative(),
  refunds: z.number().int().nonnegative(),
  reviewScore: z.number().min(0).max(5),
  rankingPercentile: z.number().min(0).max(100),
  netProfitUsd: z.number(),
  inventoryRemaining: z.number().int().nonnegative(),
  supplierHealthScore: z.number().min(0).max(100),
  competitorChangeDetected: z.boolean(),
  computedAt: z.string(),
});

export const FollowUpMissionTypeSchema = z.enum([
  "increase_ads",
  "reduce_ads",
  "pause_listing",
  "change_price",
  "replace_supplier",
  "improve_creative",
  "stop_product",
]);

export const FollowUpMissionSchema = z.object({
  followUpId: z.string(),
  missionId: z.string(),
  type: FollowUpMissionTypeSchema,
  title: z.string(),
  rationale: z.string(),
  status: z.enum(["pending_approval", "approved", "rejected", "executed"]),
  approvalRequired: z.literal(true),
  intelligenceOwner: z.literal("pillow"),
  createdAt: z.string(),
});

export const CommerceIntelligenceDashboardSchema = z.object({
  moduleId: z.literal("commerce-intelligence-core"),
  missionId: z.literal("PILLOW-020"),
  programLabel: z.literal("Commerce Intelligence Operating System"),
  intelligenceOwner: z.literal("pillow"),
  workspaceId: z.string(),
  companyId: z.string(),
  summary: z.string(),
  queue: z.object({
    total: z.number().int(),
    shortlisted: z.number().int(),
    rejected: z.number().int(),
    deferred: z.number().int(),
    missionReady: z.number().int(),
    notReady: z.number().int(),
  }),
  missions: z.object({
    pendingReview: z.number().int(),
    approved: z.number().int(),
    live: z.number().int(),
    blocked: z.number().int(),
    monitoring: z.number().int(),
  }),
  followUpMissions: z.object({
    pendingApproval: z.number().int(),
    total: z.number().int(),
  }),
  lastPullAt: z.string().nullable(),
  computedAt: z.string(),
});

export const CommercePillowContextSchema = z.object({
  intelligenceOwner: z.literal("pillow"),
  program: z.literal("PILLOW-020"),
  currentCandidate: z
    .object({
      candidateId: z.string(),
      title: z.string(),
      status: z.string(),
      commercialScore: z.number(),
    })
    .optional(),
  currentMission: z
    .object({
      missionId: z.string(),
      title: z.string(),
      status: z.string(),
      proposalReadiness: ProposalReadinessSchema,
      route: ProductRouteSchema,
      confidenceScore: z.number(),
      approvalState: z.string(),
      creativeReadiness: z.string(),
      whyEvidence: z.array(z.string()),
    })
    .optional(),
  supplier: z.string().optional(),
  marketplace: z.string().optional(),
  launchStatus: z.string().optional(),
});

export type ProductCandidate = z.infer<typeof ProductCandidateSchema>;
export type SupplierIntelligence = z.infer<typeof SupplierIntelligenceSchema>;
export type MarketplaceStudy = z.infer<typeof MarketplaceStudySchema>;
export type ArbitrageAnalysis = z.infer<typeof ArbitrageAnalysisSchema>;
export type ProductFitIntelligence = z.infer<typeof ProductFitIntelligenceSchema>;
export type CreativePackage = z.infer<typeof CreativePackageSchema>;
export type ExecutiveLens = z.infer<typeof ExecutiveLensSchema>;
export type CtoLens = z.infer<typeof CtoLensSchema>;
export type ProductLaunchMission = z.infer<typeof ProductLaunchMissionSchema>;
export type QueueEntry = z.infer<typeof QueueEntrySchema>;
export type LaunchStatusEntry = z.infer<typeof LaunchStatusEntrySchema>;
export type PerformanceSnapshot = z.infer<typeof PerformanceSnapshotSchema>;
export type FollowUpMission = z.infer<typeof FollowUpMissionSchema>;
export type CommerceIntelligenceDashboard = z.infer<typeof CommerceIntelligenceDashboardSchema>;
export type CommercePillowContext = z.infer<typeof CommercePillowContextSchema>;
export type CandidateQueueStatus = z.infer<typeof CandidateQueueStatusSchema>;
export type ProductLaunchMissionStatus = z.infer<typeof ProductLaunchMissionStatusSchema>;
export type ProposalReadiness = z.infer<typeof ProposalReadinessSchema>;
export type MissionDecision = "approve" | "reject" | "defer" | "why";
export type MissionWhyDecisionOutcome = {
  decisionKind: "why";
  whyEvidence: string[];
  mission: ProductLaunchMission;
};
export type MissionDecisionOutcome = ProductLaunchMission | MissionWhyDecisionOutcome;

export function isMissionWhyDecisionOutcome(
  outcome: MissionDecisionOutcome,
): outcome is MissionWhyDecisionOutcome {
  return "decisionKind" in outcome && outcome.decisionKind === "why";
}
