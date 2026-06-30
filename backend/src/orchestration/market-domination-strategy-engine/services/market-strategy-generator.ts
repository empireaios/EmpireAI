import { randomUUID } from "node:crypto";

import { scoreBrandGenesis } from "../../../execution/brand-genesis/scoring/brand-scoring.js";
import { generateMarketingCampaignIntelligence } from "../../../execution/marketing-campaign-intelligence/scoring/marketing-campaign-intelligence-scoring.js";
import { evaluateSupplier } from "../../../intelligence/supplier-intelligence-engine/index.js";
import type { BusinessOpportunityRecord } from "../../business-opportunity-workspace/models/business-opportunity.js";
import type { BusinessPreviewRecord } from "../../business-preview-studio/models/business-preview.js";
import { getCommerceReadinessSummary } from "../../commerce-readiness-engine/index.js";
import type {
  BattlefieldAnalysis,
  BrandGrowthRoadmap,
  CompetitiveAdvantage,
  CustomerPsychology,
  GrandKingLaunchRecommendation,
  MarketDominationStrategyDocument,
  MarketplaceStrategyEntry,
  PricingStrategy,
  RiskAssessment,
  StrategyIdentity,
  StrategyMarketplaceId,
} from "../models/market-domination-strategy.js";
import { STRATEGY_MARKETPLACES } from "../models/market-domination-strategy.js";

const MARKETPLACE_LABELS: Record<StrategyMarketplaceId, string> = {
  amazon: "Amazon",
  "tiktok-shop": "TikTok Shop",
  shopify: "Shopify",
  ebay: "eBay",
  "google-merchant": "Google Shopping",
  "facebook-shop": "Facebook Shop",
  "instagram-shop": "Instagram Shop",
};

const MARKETPLACE_BASE_SCORES: Record<StrategyMarketplaceId, number> = {
  amazon: 85,
  "tiktok-shop": 78,
  shopify: 80,
  ebay: 65,
  "google-merchant": 72,
  "facebook-shop": 68,
  "instagram-shop": 70,
};

function buildBrandBreakdown(opportunity: BusinessOpportunityRecord) {
  return scoreBrandGenesis({
    revenueOpportunity: {
      opportunityId: opportunity.sourceOpportunityId,
      productId: opportunity.economics.productId,
      opportunityType: "DROPSHIPPING",
      confidence: opportunity.economics.dominationScore,
      expectedValue: opportunity.economics.expectedRoi,
      expectedDifficulty: 100 - opportunity.economics.estimatedMargin,
      recommendedAction: "LAUNCH",
      reasons: [opportunity.investmentThesis],
    },
    portfolioEntry: {
      entryId: `entry:${opportunity.businessOpportunityId}`,
      revenueOpportunityId: opportunity.sourceOpportunityId,
      productId: opportunity.economics.productId,
      state: "ACTIVE",
      portfolioScore: opportunity.economics.dominationScore,
      capitalPriority: "HIGH",
    },
    capitalAllocation: {
      allocationId: `alloc:${opportunity.businessOpportunityId}`,
      opportunityId: opportunity.sourceOpportunityId,
      productId: opportunity.economics.productId,
      portfolioState: "ACTIVE",
      allocationPercentage: 100,
      riskAdjustedAllocation: opportunity.economics.expectedRoi,
      confidence: opportunity.economics.launchConfidence,
    },
  });
}

function buildMarketingIntelligence(opportunity: BusinessOpportunityRecord, brandName: string) {
  return generateMarketingCampaignIntelligence({
    brand: {
      brandId: `brand:${opportunity.brand.brand}`,
      brandName: brandName,
      slogan: `${brandName} — ${opportunity.brand.category}`,
      niche: opportunity.brand.category,
      targetAudience: "US ecommerce buyers",
      positioning: opportunity.assetsPreview.brandStory.slice(0, 120),
      confidence: opportunity.brand.brandConfidence,
    },
    offer: {
      offerTitle: opportunity.economics.productName,
      headline: opportunity.assetsPreview.listingTitle,
      valueProposition: opportunity.assetsPreview.listingDescription.slice(0, 160),
      keyBenefits: opportunity.assetsPreview.seoKeywords.slice(0, 4),
      callToAction: "Shop now",
      confidence: opportunity.economics.launchConfidence,
    },
    launchConfidence: opportunity.economics.launchConfidence,
    opportunityType: "DROPSHIPPING",
  });
}

function buildIdentity(
  opportunity: BusinessOpportunityRecord,
  brandBreakdown: ReturnType<typeof buildBrandBreakdown>,
): StrategyIdentity {
  return {
    businessMission: `Dominate ${opportunity.brand.category} through ${brandBreakdown.brandName} — repeatable revenue with defensible brand equity.`,
    brandPosition: brandBreakdown.positioning,
    targetCustomer: brandBreakdown.targetAudience,
    customerPersona: `${brandBreakdown.niche} buyer seeking ${opportunity.economics.productName} with reliable fulfillment and clear value.`,
    coreValueProposition: brandBreakdown.valueProposition,
    brandPromise: `${brandBreakdown.brandName} delivers ${opportunity.economics.productName} with ${opportunity.brand.brand} quality standards — or we make it right.`,
  };
}

function buildBattlefield(opportunity: BusinessOpportunityRecord): BattlefieldAnalysis {
  const rec = opportunity.economics.marketplaceRecommendation;
  return {
    primaryMarketplace: rec.primaryMarketplace,
    secondaryMarketplace: rec.secondaryMarketplace ?? "shopify",
    expansionMarketplaces: rec.futureExpansionMarketplaces,
    competitorOverview: opportunity.marketIntelligence.competitorSummary,
    competitorWeaknesses: [
      "Slow shipping on commodity listings",
      "Weak brand storytelling on competitor pages",
      "Generic product photography",
    ],
    marketGaps: [
      opportunity.marketIntelligence.marketOpportunitySummary,
      `Underserved ${opportunity.brand.category} niche with domination score ${opportunity.economics.dominationScore}/100`,
    ],
    underservedSegments: [
      `${opportunity.brand.category} buyers wanting premium presentation`,
      "Repeat-purchase customers underserved by one-off sellers",
    ],
  };
}

function buildCompetitiveAdvantages(
  opportunity: BusinessOpportunityRecord,
  marketingIntel: ReturnType<typeof buildMarketingIntelligence>,
): CompetitiveAdvantage[] {
  let supplierScore = opportunity.economics.supplierConfidence;
  try {
    const evaluation = evaluateSupplier({
      workspaceId: opportunity.workspaceId,
      supplierId: opportunity.economics.supplier,
    });
    supplierScore = Math.round(evaluation.reliabilityScore ?? evaluation.trustScore ?? supplierScore);
  } catch {
    // use existing score
  }

  return [
    {
      name: "Pricing Advantage",
      rationale: `Target margin ${opportunity.economics.estimatedMargin}% with expected ROI ${opportunity.economics.expectedRoi}/100 — priced to win without race-to-bottom.`,
      strength: Math.round(opportunity.economics.estimatedMargin * 0.8 + opportunity.economics.expectedRoi * 0.2),
    },
    {
      name: "Brand Advantage",
      rationale: `${opportunity.brand.businessName} brand confidence ${opportunity.brand.brandConfidence}/100 with differentiated positioning vs generic listings.`,
      strength: opportunity.brand.brandConfidence,
    },
    {
      name: "Customer Experience Advantage",
      rationale: `Shipping confidence ${opportunity.economics.shippingEstimate}/100 and repeat purchase potential ${opportunity.economics.repeatPurchasePotential}/100.`,
      strength: Math.round(
        (opportunity.economics.shippingEstimate + opportunity.economics.repeatPurchasePotential) / 2,
      ),
    },
    {
      name: "Product Advantage",
      rationale: `${opportunity.economics.productName} selected via EA discovery with domination score ${opportunity.economics.dominationScore}/100.`,
      strength: opportunity.economics.dominationScore,
    },
    {
      name: "Supplier Advantage",
      rationale: `${opportunity.economics.supplier} at ${supplierScore}/100 reliability — ${opportunity.economics.supplierConfidence}% discovery confidence.`,
      strength: supplierScore,
    },
    {
      name: "Fulfillment Advantage",
      rationale: `Dropship fulfillment path with shipping estimate ${opportunity.economics.shippingEstimate}/100 and supplier network integration.`,
      strength: opportunity.economics.shippingEstimate,
    },
    {
      name: "Content Advantage",
      rationale: marketingIntel.recommendation?.recommendedStrategy
        ? `${marketingIntel.recommendation.recommendedStrategy} content strategy via marketing intelligence — story-driven listings.`
        : "Story-driven listings and video storyboard assets prepared in preview studio.",
      strength: Math.round(marketingIntel.confidence ?? 70),
    },
    {
      name: "SEO Advantage",
      rationale: `Keywords: ${opportunity.assetsPreview.seoKeywords.slice(0, 5).join(", ")} — optimized for ${opportunity.economics.recommendedMarketplace}.`,
      strength: Math.min(100, opportunity.assetsPreview.seoKeywords.length * 15 + 25),
    },
  ];
}

function buildCustomerPsychology(
  opportunity: BusinessOpportunityRecord,
  marketingIntel: ReturnType<typeof buildMarketingIntelligence>,
): CustomerPsychology {
  const audienceSignals = marketingIntel.audienceIntelligence;
  return {
    painPoints: [
      `Frustration with low-quality ${opportunity.brand.category} products`,
      "Uncertain delivery timelines from unknown sellers",
      "Difficulty finding trusted brands in crowded marketplaces",
    ],
    buyingMotivations: [
      "Solve a specific problem quickly",
      "Buy from a brand that looks established",
      audienceSignals?.interests[0] ?? "Value for money with fast shipping",
    ],
    emotionalDrivers: ["Trust", "Convenience", "Status through quality purchase"],
    trustBuilders: [
      "Professional brand presentation",
      "Clear shipping and return policy",
      `${opportunity.brand.businessName} brand promise`,
    ],
    purchaseTriggers: [
      "Limited-time launch pricing",
      "Social proof and reviews",
      "Free shipping threshold",
    ],
    objections: [
      "Is this brand legitimate?",
      "Will shipping be fast enough?",
      "Can I find it cheaper elsewhere?",
    ],
    recommendedResponses: [
      "Lead with brand story and professional assets from preview studio",
      "Highlight supplier reliability and shipping confidence scores",
      "Anchor price against premium ceiling with value justification",
    ],
  };
}

function buildPricingStrategy(opportunity: BusinessOpportunityRecord): PricingStrategy {
  const basePrice = Math.max(19.99, 29.99 + opportunity.economics.dominationScore * 0.5);
  const launchPrice = Math.round(basePrice * 100) / 100;
  const targetPrice = Math.round((launchPrice * 1.15) * 100) / 100;
  const premiumCeiling = Math.round((targetPrice * 1.35) * 100) / 100;
  const discountFloor = Math.round((launchPrice * 0.85) * 100) / 100;

  return {
    launchPrice,
    targetPrice,
    premiumCeiling,
    discountFloor,
    recommendedMargin: opportunity.economics.estimatedMargin,
    psychologicalPricing: `Launch at $${launchPrice.toFixed(2)} (.99 charm) → scale to $${targetPrice.toFixed(2)} once reviews accumulate.`,
  };
}

function buildMarketplaceStrategy(opportunity: BusinessOpportunityRecord): MarketplaceStrategyEntry[] {
  const primary = opportunity.economics.recommendedMarketplace as StrategyMarketplaceId;
  const secondary = (opportunity.economics.marketplaceRecommendation.secondaryMarketplace ??
    "shopify") as StrategyMarketplaceId;

  return STRATEGY_MARKETPLACES.map((marketplaceId, index) => {
    let priority = index + 1;
    let confidence = MARKETPLACE_BASE_SCORES[marketplaceId];
    let reason = `Standard ${MARKETPLACE_LABELS[marketplaceId]} expansion path for ${opportunity.brand.category}.`;

    if (marketplaceId === primary) {
      priority = 1;
      confidence = Math.min(100, confidence + 15);
      reason = `Primary battlefield — EA discovery recommends ${marketplaceId} with highest domination fit.`;
    } else if (marketplaceId === secondary) {
      priority = 2;
      confidence = Math.min(100, confidence + 10);
      reason = "Secondary launch channel for diversification and brand-owned traffic.";
    } else if (
      opportunity.economics.marketplaceRecommendation.futureExpansionMarketplaces.includes(marketplaceId)
    ) {
      priority = 4;
      confidence = Math.min(100, confidence + 5);
      reason = "Flagged for future expansion in discovery marketplace recommendation.";
    }

    const difficulty = Math.max(20, 100 - confidence + (marketplaceId === "amazon" ? 10 : 0));
    const growth = Math.min(100, confidence + opportunity.economics.expectedRoi * 0.2);

    return {
      marketplaceId,
      launchPriority: priority,
      confidence: Math.round(confidence),
      reason,
      expectedDifficulty: Math.round(difficulty),
      expectedGrowth: Math.round(growth),
    };
  }).sort((a, b) => a.launchPriority - b.launchPriority);
}

function buildBrandGrowthRoadmap(opportunity: BusinessOpportunityRecord): BrandGrowthRoadmap {
  return {
    phase1InitialNiche: `Launch ${opportunity.economics.productName} on ${opportunity.economics.recommendedMarketplace} — own ${opportunity.brand.category} niche.`,
    phase2ProductExpansion: `Add complementary ${opportunity.brand.category} SKUs with ${opportunity.economics.repeatPurchasePotential}/100 repeat potential.`,
    phase3BrandExpansion: `Extend ${opportunity.brand.businessName} to adjacent categories via ${opportunity.marketIntelligence.expansionPotential}.`,
    phase4CategoryLeadership: `Category leadership through content, SEO, and multi-marketplace presence — target domination score 90+.`,
  };
}

function buildRiskAssessment(opportunity: BusinessOpportunityRecord): RiskAssessment {
  return {
    topRisks: [
      opportunity.marketIntelligence.riskSummary,
      `Competition estimate ${opportunity.economics.competitionEstimate}/100`,
      `Supplier dependency on ${opportunity.economics.supplier}`,
    ],
    mitigations: [
      "Diversify to secondary marketplace within 90 days",
      "Maintain margin floor — never below discount floor",
      "Monitor supplier health weekly via supplier intelligence",
    ],
    fallbackStrategy: `Pivot to ${opportunity.economics.marketplaceRecommendation.secondaryMarketplace ?? "shopify"} with reduced ad spend if primary channel underperforms after 60 days.`,
    killConditions: [
      "Zero sales after 90 days with >$500 ad spend",
      "Supplier reliability drops below 50",
      "Margin compresses below 15% sustained for 30 days",
    ],
  };
}

function resolveGrandKingRecommendation(
  opportunity: BusinessOpportunityRecord,
  overallConfidence: number,
): { recommendation: GrandKingLaunchRecommendation; reasoning: string } {
  const { dominationScore, launchConfidence, expectedRoi, competitionEstimate } = opportunity.economics;

  if (dominationScore < 40 || launchConfidence < 40 || competitionEstimate >= 90) {
    return {
      recommendation: "DO_NOT_BUILD",
      reasoning: `Domination ${dominationScore}/100, launch confidence ${launchConfidence}/100 — market too hostile or opportunity too weak.`,
    };
  }
  if (dominationScore < 60 || launchConfidence < 55 || overallConfidence < 55) {
    return {
      recommendation: "BUILD_WITH_CAUTION",
      reasoning: `Viable but risky — domination ${dominationScore}/100. Launch with tight kill conditions and limited initial spend.`,
    };
  }
  if (dominationScore >= 80 && launchConfidence >= 75 && expectedRoi >= 70) {
    return {
      recommendation: "HIGH_PRIORITY_BUILD",
      reasoning: `Exceptional opportunity — domination ${dominationScore}/100, ROI ${expectedRoi}/100, confidence ${overallConfidence}/100. Prioritize for Grand King build.`,
    };
  }
  return {
    recommendation: "BUILD",
    reasoning: `Solid market strategy — domination ${dominationScore}/100 with clear competitive advantages. Proceed to build when preview approved.`,
  };
}

function computeOverallConfidence(
  opportunity: BusinessOpportunityRecord,
  advantages: CompetitiveAdvantage[],
  readinessScore: number,
): number {
  const avgAdvantage = advantages.reduce((sum, entry) => sum + entry.strength, 0) / advantages.length;
  return Math.round(
    opportunity.economics.dominationScore * 0.35 +
      opportunity.economics.launchConfidence * 0.25 +
      avgAdvantage * 0.2 +
      readinessScore * 0.2,
  );
}

/** Generates complete market domination strategy — strategy only, no execution. */
export function generateMarketDominationStrategy(
  opportunity: BusinessOpportunityRecord,
  preview?: BusinessPreviewRecord | null,
): MarketDominationStrategyDocument {
  const brandBreakdown = buildBrandBreakdown(opportunity);
  const marketingIntel = buildMarketingIntelligence(opportunity, brandBreakdown.brandName);
  const readiness = getCommerceReadinessSummary({
    workspaceId: opportunity.workspaceId,
    companyId: opportunity.companyId,
    accountType: "grand_king",
  });

  const identity = buildIdentity(opportunity, brandBreakdown);
  const battlefield = buildBattlefield(opportunity);
  const competitiveAdvantages = buildCompetitiveAdvantages(opportunity, marketingIntel);
  const customerPsychology = buildCustomerPsychology(opportunity, marketingIntel);
  const pricingStrategy = buildPricingStrategy(opportunity);
  const marketplaceStrategy = buildMarketplaceStrategy(opportunity);
  const brandGrowthRoadmap = buildBrandGrowthRoadmap(opportunity);
  const riskAssessment = buildRiskAssessment(opportunity);
  const overallConfidence = computeOverallConfidence(
    opportunity,
    competitiveAdvantages,
    readiness.overallReadinessScore,
  );
  const grandKingRecommendation = resolveGrandKingRecommendation(opportunity, overallConfidence);

  const topAdvantages = competitiveAdvantages
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 3)
    .map((entry) => entry.name)
    .join(", ");

  const winningStrategySummary =
    `Win on ${battlefield.primaryMarketplace} via ${topAdvantages}. ` +
    `${grandKingRecommendation.recommendation}: ${grandKingRecommendation.reasoning}` +
    (preview ? ` Preview quality ${preview.quality.overallScore}/100.` : "");

  const timestamp = new Date().toISOString();

  return {
    strategyId: `strategy:${randomUUID()}`,
    businessOpportunityId: opportunity.businessOpportunityId,
    previewId: preview?.previewId,
    workspaceId: opportunity.workspaceId,
    companyId: opportunity.companyId,
    businessName: opportunity.brand.businessName,
    identity,
    battlefield,
    competitiveAdvantages,
    customerPsychology,
    pricingStrategy,
    marketplaceStrategy,
    brandGrowthRoadmap,
    riskAssessment,
    grandKingRecommendation,
    overallConfidence,
    winningStrategySummary,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
