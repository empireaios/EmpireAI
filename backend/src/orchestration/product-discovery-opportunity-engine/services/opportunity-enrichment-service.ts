import { randomUUID } from "node:crypto";

import { scoreBrandGenesis } from "../../../execution/brand-genesis/scoring/brand-scoring.js";
import { generateMarketingCampaignIntelligence } from "../../../execution/marketing-campaign-intelligence/scoring/marketing-campaign-intelligence-scoring.js";
import type { ProductScoutEvaluation } from "../../../intelligence/product-scout/types.js";
import { discoverSuppliers, evaluateSupplier } from "../../../intelligence/supplier-intelligence-engine/index.js";
import {
  mapScoutToRecommendation,
  rankRecommendations,
} from "../../ecommerce-os-orchestrator/services/product-recommendation-service.js";
import type { ProductRecommendation } from "../../ecommerce-os-orchestrator/models/ecommerce-os-workflow.js";
import { getCommerceReadinessSummary } from "../../commerce-readiness-engine/index.js";
import type {
  ProductDiscoveryInput,
  ProductOpportunity,
  SupplierAvailability,
} from "../models/product-opportunity.js";
import { normalizeProductDiscoveryInput } from "../models/product-opportunity.js";
import {
  computeMarketplaceSuitability,
  recommendMarketplaces,
} from "./marketplace-recommendation-service.js";

function invertScore(value: number): number {
  return Math.max(0, Math.min(100, 100 - value));
}

function resolveSupplierAvailability(
  workspaceId: string,
  supplierId: string,
  existingNetwork: string[],
): SupplierAvailability {
  try {
    const evaluation = evaluateSupplier({ workspaceId, supplierId });
    const suppliers = discoverSuppliers(workspaceId, { minReliability: 60 });
    const match = suppliers.suppliers.find((entry) => entry.id === supplierId);
    return {
      available: (evaluation.reliabilityScore ?? evaluation.trustScore ?? 0) >= 60,
      supplierId,
      supplierName: match?.name ?? supplierId,
      confidence: Math.round(evaluation.reliabilityScore ?? evaluation.trustScore ?? 70),
      inExistingNetwork: existingNetwork.includes(supplierId),
    };
  } catch {
    return {
      available: false,
      supplierId,
      supplierName: supplierId,
      confidence: 0,
      inExistingNetwork: existingNetwork.includes(supplierId),
    };
  }
}

function deriveBrandIntelligenceBoost(input: ProductDiscoveryInput, dominationScore: number): number {
  try {
    const opportunityId = `opp:discovery:${randomUUID()}`;
    const breakdown = scoreBrandGenesis({
      revenueOpportunity: {
        opportunityId,
        productId: `prod:${input.category}`,
        opportunityType: "DROPSHIPPING",
        confidence: dominationScore,
        expectedValue: dominationScore,
        expectedDifficulty: 100 - dominationScore,
        recommendedAction: "LAUNCH",
        reasons: [`Brand ${input.brand} in ${input.category}`],
      },
      portfolioEntry: {
        entryId: `entry:${opportunityId}`,
        revenueOpportunityId: opportunityId,
        productId: `prod:${input.category}`,
        state: "ACTIVE",
        portfolioScore: dominationScore,
        capitalPriority: "HIGH",
      },
      capitalAllocation: {
        allocationId: `alloc:${opportunityId}`,
        opportunityId,
        productId: `prod:${input.category}`,
        portfolioState: "ACTIVE",
        allocationPercentage: 100,
        riskAdjustedAllocation: dominationScore,
        confidence: dominationScore,
      },
    });
    return breakdown.confidence ?? 70;
  } catch {
    return 70;
  }
}

function deriveMarketingIntelligenceBoost(input: ProductDiscoveryInput, productName: string): number {
  try {
    const intelligence = generateMarketingCampaignIntelligence({
      brand: {
        brandId: `brand:${input.brand}`,
        brandName: input.brand,
        slogan: `${input.brand} — ${input.category}`,
        niche: input.category,
        targetAudience: input.targetMarket ?? "US",
        positioning: `Premium ${input.category} for ${input.targetMarket ?? "US"}`,
        confidence: 75,
      },
      offer: {
        offerTitle: productName,
        headline: productName,
        valueProposition: `High-margin ${input.category} opportunity`,
        keyBenefits: ["Strong margin", "Reliable supplier path"],
        callToAction: "Discover",
        confidence: 75,
      },
      launchConfidence: 70,
      opportunityType: "DROPSHIPPING",
    });
    return intelligence.confidence ?? 70;
  } catch {
    return 70;
  }
}

function recommendedNextAction(
  opportunity: Pick<ProductOpportunity, "scoutRecommendation" | "marketplaceRecommendation" | "supplierAvailability">,
  readinessLaunchDecision: string,
): string {
  if (opportunity.scoutRecommendation === "REJECT") {
    return "Skip this opportunity — scout recommends rejection.";
  }
  if (!opportunity.supplierAvailability.available) {
    return "Connect supplier or expand supplier network before product build.";
  }
  if (readinessLaunchDecision === "NOT_READY") {
    return `Complete commerce readiness, then build on ${opportunity.marketplaceRecommendation.primaryMarketplace}.`;
  }
  if (opportunity.scoutRecommendation === "REVIEW") {
    return "Grand King review recommended before approval.";
  }
  return `Approve and proceed to product build on ${opportunity.marketplaceRecommendation.primaryMarketplace}.`;
}

/** Enriches scout evaluations into full product opportunities — discovery only. */
export function enrichOpportunity(
  evaluation: ProductScoutEvaluation,
  input: ProductDiscoveryInput,
  rank: number,
): ProductOpportunity {
  const normalized = normalizeProductDiscoveryInput(input);
  const recommendation = mapScoutToRecommendation(evaluation, normalized.category);
  const supplierId = recommendation.supplierId ?? "cj-dropshipping";
  const supplierAvailability = resolveSupplierAvailability(
    normalized.workspaceId,
    supplierId,
    normalized.existingSupplierNetwork ?? [],
  );

  const competitionEstimate = invertScore(evaluation.competitionScore);
  const marketplaceRecommendation = recommendMarketplaces({
    workspaceId: normalized.workspaceId,
    category: normalized.category,
    targetMarket: normalized.targetMarket ?? "US",
    dominationScore: evaluation.finalEmpireScore,
    brandingPotential: evaluation.brandabilityScore,
    competitionEstimate,
  });

  const brandBoost = deriveBrandIntelligenceBoost(normalized, evaluation.finalEmpireScore);
  const marketingBoost = deriveMarketingIntelligenceBoost(normalized, evaluation.productName);
  const marketplaceSuitability = computeMarketplaceSuitability(
    marketplaceRecommendation,
    normalized.workspaceId,
  );

  const confidence = Math.round(
    evaluation.confidenceScore * 0.35 +
      supplierAvailability.confidence * 0.2 +
      marketplaceSuitability * 0.2 +
      brandBoost * 0.15 +
      marketingBoost * 0.1,
  );

  const readiness = getCommerceReadinessSummary({
    workspaceId: normalized.workspaceId,
    companyId: normalized.companyId,
    accountType: normalized.accountType ?? "grand_king",
  });

  const opportunity: ProductOpportunity = {
    opportunityId: `opp:${recommendation.productId}`,
    rank,
    product: {
      productId: recommendation.productId,
      productName: recommendation.productName,
      category: normalized.category,
    },
    supplierAvailability,
    estimatedMargin: recommendation.margin,
    shippingConfidence: recommendation.shippingConfidence,
    competitionEstimate,
    dominationScore: recommendation.dominationScore,
    brandingPotential: recommendation.brandingPotential,
    repeatPurchasePotential: recommendation.repeatPurchasePotential,
    marketplaceSuitability,
    confidence,
    expectedRoi: recommendation.expectedRoi,
    marketplaceRecommendation,
    recommendedSupplier: supplierId,
    recommendedMarketplace: marketplaceRecommendation.primaryMarketplace,
    recommendedNextAction: "",
    rationale: [...evaluation.why, ...marketplaceRecommendation.reasoning],
    scoutRecommendation: recommendation.recommendation,
  };

  opportunity.recommendedNextAction = recommendedNextAction(opportunity, readiness.launchDecision);
  return opportunity;
}

export function opportunitiesFromRecommendations(
  evaluations: ProductScoutEvaluation[],
  input: ProductDiscoveryInput,
): ProductOpportunity[] {
  const normalized = normalizeProductDiscoveryInput(input);
  const recommendations = rankRecommendations(
    evaluations.map((evaluation) => mapScoutToRecommendation(evaluation, normalized.category)),
  );

  const evaluationByProduct = new Map(
    evaluations.map((evaluation) => [
      evaluation.productId ?? `prod-${evaluation.productName}`,
      evaluation,
    ]),
  );

  return recommendations.map((rec: ProductRecommendation, index: number) => {
    const evaluation = evaluationByProduct.get(rec.productId);
    if (!evaluation) {
      throw new Error(`Missing scout evaluation for ${rec.productId}`);
    }
    return enrichOpportunity(evaluation, input, index + 1);
  });
}
