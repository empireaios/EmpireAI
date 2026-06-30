import { z } from "zod";

export const GRAND_KING_LAUNCH_RECOMMENDATIONS = [
  "DO_NOT_BUILD",
  "BUILD_WITH_CAUTION",
  "BUILD",
  "HIGH_PRIORITY_BUILD",
] as const;

export type GrandKingLaunchRecommendation = (typeof GRAND_KING_LAUNCH_RECOMMENDATIONS)[number];

export const STRATEGY_MARKETPLACES = [
  "amazon",
  "tiktok-shop",
  "shopify",
  "ebay",
  "google-merchant",
  "facebook-shop",
  "instagram-shop",
] as const;

export type StrategyMarketplaceId = (typeof STRATEGY_MARKETPLACES)[number];

export const strategyIdentitySchema = z.object({
  businessMission: z.string().min(1),
  brandPosition: z.string().min(1),
  targetCustomer: z.string().min(1),
  customerPersona: z.string().min(1),
  coreValueProposition: z.string().min(1),
  brandPromise: z.string().min(1),
});

export const battlefieldAnalysisSchema = z.object({
  primaryMarketplace: z.string().min(1),
  secondaryMarketplace: z.string().min(1),
  expansionMarketplaces: z.array(z.string()),
  competitorOverview: z.string().min(1),
  competitorWeaknesses: z.array(z.string()),
  marketGaps: z.array(z.string()),
  underservedSegments: z.array(z.string()),
});

export const competitiveAdvantageSchema = z.object({
  name: z.string().min(1),
  rationale: z.string().min(1),
  strength: z.number().int().min(0).max(100),
});

export const customerPsychologySchema = z.object({
  painPoints: z.array(z.string()),
  buyingMotivations: z.array(z.string()),
  emotionalDrivers: z.array(z.string()),
  trustBuilders: z.array(z.string()),
  purchaseTriggers: z.array(z.string()),
  objections: z.array(z.string()),
  recommendedResponses: z.array(z.string()),
});

export const pricingStrategySchema = z.object({
  launchPrice: z.number().min(0),
  targetPrice: z.number().min(0),
  premiumCeiling: z.number().min(0),
  discountFloor: z.number().min(0),
  recommendedMargin: z.number().min(0).max(100),
  psychologicalPricing: z.string().min(1),
});

export const marketplaceStrategyEntrySchema = z.object({
  marketplaceId: z.enum(STRATEGY_MARKETPLACES),
  launchPriority: z.number().int().min(1).max(7),
  confidence: z.number().int().min(0).max(100),
  reason: z.string().min(1),
  expectedDifficulty: z.number().int().min(0).max(100),
  expectedGrowth: z.number().int().min(0).max(100),
});

export const brandGrowthRoadmapSchema = z.object({
  phase1InitialNiche: z.string().min(1),
  phase2ProductExpansion: z.string().min(1),
  phase3BrandExpansion: z.string().min(1),
  phase4CategoryLeadership: z.string().min(1),
});

export const riskAssessmentSchema = z.object({
  topRisks: z.array(z.string()),
  mitigations: z.array(z.string()),
  fallbackStrategy: z.string().min(1),
  killConditions: z.array(z.string()),
});

export const grandKingRecommendationSchema = z.object({
  recommendation: z.enum(GRAND_KING_LAUNCH_RECOMMENDATIONS),
  reasoning: z.string().min(1),
});

export const marketDominationStrategyDocumentSchema = z.object({
  strategyId: z.string().min(1),
  businessOpportunityId: z.string().min(1),
  previewId: z.string().optional(),
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  businessName: z.string().min(1),
  identity: strategyIdentitySchema,
  battlefield: battlefieldAnalysisSchema,
  competitiveAdvantages: z.array(competitiveAdvantageSchema).min(8),
  customerPsychology: customerPsychologySchema,
  pricingStrategy: pricingStrategySchema,
  marketplaceStrategy: z.array(marketplaceStrategyEntrySchema).length(7),
  brandGrowthRoadmap: brandGrowthRoadmapSchema,
  riskAssessment: riskAssessmentSchema,
  grandKingRecommendation: grandKingRecommendationSchema,
  overallConfidence: z.number().int().min(0).max(100),
  winningStrategySummary: z.string().min(1),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export type MarketDominationStrategyDocument = z.infer<typeof marketDominationStrategyDocumentSchema>;
export type StrategyIdentity = z.infer<typeof strategyIdentitySchema>;
export type BattlefieldAnalysis = z.infer<typeof battlefieldAnalysisSchema>;
export type CompetitiveAdvantage = z.infer<typeof competitiveAdvantageSchema>;
export type CustomerPsychology = z.infer<typeof customerPsychologySchema>;
export type PricingStrategy = z.infer<typeof pricingStrategySchema>;
export type MarketplaceStrategyEntry = z.infer<typeof marketplaceStrategyEntrySchema>;
export type BrandGrowthRoadmap = z.infer<typeof brandGrowthRoadmapSchema>;
export type RiskAssessment = z.infer<typeof riskAssessmentSchema>;
export type GrandKingRecommendation = z.infer<typeof grandKingRecommendationSchema>;

export const marketStrategyComparisonSchema = z.object({
  strategyA: marketDominationStrategyDocumentSchema,
  strategyB: marketDominationStrategyDocumentSchema,
  highlights: z.object({
    higherConfidence: z.enum(["A", "B", "TIE"]),
    strongerRecommendation: z.enum(["A", "B", "TIE"]),
    betterPricingAdvantage: z.enum(["A", "B", "TIE"]),
    strongerBattlefield: z.enum(["A", "B", "TIE"]),
    lowerRisk: z.enum(["A", "B", "TIE"]),
  }),
  summary: z.string().min(1),
});

export type MarketStrategyComparison = z.infer<typeof marketStrategyComparisonSchema>;

export const marketStrategyDashboardSchema = z.object({
  mission: z.string(),
  winningStrategy: z.string(),
  competitiveAdvantages: z.array(z.string()),
  primaryBattlefield: z.string(),
  launchRecommendation: z.enum(GRAND_KING_LAUNCH_RECOMMENDATIONS).optional(),
  overallConfidence: z.number().int().min(0).max(100),
  latestStrategyId: z.string().optional(),
  computedAt: z.string().datetime({ offset: true }),
});

export type MarketStrategyDashboard = z.infer<typeof marketStrategyDashboardSchema>;

export const marketStrategySummarySchema = z.object({
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  totalStrategies: z.number().int().min(0),
  highPriorityBuilds: z.number().int().min(0),
  buildRecommendations: z.number().int().min(0),
  doNotBuildCount: z.number().int().min(0),
  averageConfidence: z.number().min(0).max(100),
  topStrategy: marketDominationStrategyDocumentSchema.optional(),
  computedAt: z.string().datetime({ offset: true }),
});

export type MarketStrategySummary = z.infer<typeof marketStrategySummarySchema>;
