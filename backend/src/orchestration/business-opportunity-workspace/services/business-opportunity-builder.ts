import { randomUUID } from "node:crypto";

import { scoreBrandGenesis } from "../../../execution/brand-genesis/scoring/brand-scoring.js";
import { getCommerceReadinessSummary } from "../../commerce-readiness-engine/index.js";
import type { ProductOpportunity } from "../../product-discovery-opportunity-engine/models/product-opportunity.js";
import type { DiscoverySession } from "../../product-discovery-opportunity-engine/models/product-opportunity.js";
import type {
  BusinessOpportunityRecord,
  GeneratedAssetsPreview,
  MarketIntelligence,
} from "../models/business-opportunity.js";

function buildBrandBlock(
  session: DiscoverySession,
  opportunity: ProductOpportunity,
): BusinessOpportunityRecord["brand"] {
  const brandBreakdown = scoreBrandGenesis({
    revenueOpportunity: {
      opportunityId: opportunity.opportunityId,
      productId: opportunity.product.productId,
      opportunityType: "DROPSHIPPING",
      confidence: opportunity.dominationScore,
      expectedValue: opportunity.expectedRoi,
      expectedDifficulty: 100 - opportunity.estimatedMargin,
      recommendedAction: "LAUNCH",
      reasons: opportunity.rationale.slice(0, 3),
    },
    portfolioEntry: {
      entryId: `entry:${opportunity.opportunityId}`,
      revenueOpportunityId: opportunity.opportunityId,
      productId: opportunity.product.productId,
      state: "ACTIVE",
      portfolioScore: opportunity.dominationScore,
      capitalPriority: "HIGH",
    },
    capitalAllocation: {
      allocationId: `alloc:${opportunity.opportunityId}`,
      opportunityId: opportunity.opportunityId,
      productId: opportunity.product.productId,
      portfolioState: "ACTIVE",
      allocationPercentage: 100,
      riskAdjustedAllocation: opportunity.expectedRoi,
      confidence: opportunity.confidence,
    },
  });

  return {
    brand: session.brand,
    category: session.category,
    businessName: brandBreakdown.brandName,
    logoPlaceholder: `placeholder://logo/${encodeURIComponent(brandBreakdown.brandName)}`,
    brandConfidence: Math.round(
      (brandBreakdown.confidence * 0.6 + opportunity.brandingPotential * 0.4),
    ),
  };
}

function projectEconomics(
  opportunity: ProductOpportunity,
  launchConfidence: number,
): BusinessOpportunityRecord["economics"] {
  const baseRevenue = 2000 + opportunity.dominationScore * 120 + opportunity.marketplaceSuitability * 20;
  const expectedMonthlyRevenue = Math.round(baseRevenue);
  const expectedMonthlyProfit = Math.round(expectedMonthlyRevenue * (opportunity.estimatedMargin / 100));
  const initialInvestment = Math.max(500, 5000 - opportunity.expectedRoi * 30);
  const expectedBreakevenMonths =
    expectedMonthlyProfit <= 0
      ? 24
      : Math.max(1, Math.round(initialInvestment / expectedMonthlyProfit));

  return {
    productName: opportunity.product.productName,
    productId: opportunity.product.productId,
    supplier: opportunity.supplierAvailability.supplierName,
    supplierConfidence: opportunity.supplierAvailability.confidence,
    estimatedMargin: opportunity.estimatedMargin,
    shippingEstimate: opportunity.shippingConfidence,
    repeatPurchasePotential: opportunity.repeatPurchasePotential,
    dominationScore: opportunity.dominationScore,
    competitionEstimate: opportunity.competitionEstimate,
    expectedRoi: opportunity.expectedRoi,
    marketplaceRecommendation: opportunity.marketplaceRecommendation,
    recommendedMarketplace: opportunity.recommendedMarketplace,
    expectedMonthlyRevenue,
    expectedMonthlyProfit,
    expectedBreakevenMonths,
    launchConfidence,
  };
}

function buildAssetsPreview(
  brand: BusinessOpportunityRecord["brand"],
  opportunity: ProductOpportunity,
): GeneratedAssetsPreview {
  const productSlug = opportunity.product.productName.toLowerCase().replace(/\s+/g, "-");
  return {
    listingTitle: `${brand.businessName} — ${opportunity.product.productName}`,
    listingDescription: `${brand.businessName} delivers ${opportunity.product.productName} for ${brand.category} buyers. ${brand.brand} positioning: premium quality with reliable fulfillment.`,
    seoKeywords: [
      brand.category,
      opportunity.product.productName,
      brand.brand,
      opportunity.recommendedMarketplace,
      "dropshipping",
    ],
    heroImagePlaceholder: `placeholder://hero/${productSlug}`,
    productImagePlaceholders: [
      `placeholder://product/${productSlug}/1`,
      `placeholder://product/${productSlug}/2`,
      `placeholder://product/${productSlug}/3`,
    ],
    shortVideoStoryboard: [
      "Hook: problem the product solves in 3 seconds",
      "Demo: product in use with brand overlay",
      "Proof: margin and supplier confidence callout",
      "CTA: shop now on primary marketplace",
    ],
    brandStory: `${brand.businessName} exists to dominate ${brand.category} with ${brand.brand}'s vision — built for repeat purchase and marketplace expansion.`,
  };
}

function buildMarketIntelligence(
  opportunity: ProductOpportunity,
): MarketIntelligence {
  const competitionLevel =
    opportunity.competitionEstimate >= 70
      ? "moderate-to-high"
      : opportunity.competitionEstimate >= 40
        ? "moderate"
        : "low";

  return {
    competitorSummary: `Competition estimate ${opportunity.competitionEstimate}/100 (${competitionLevel}). Scout signals: ${opportunity.rationale.slice(0, 2).join("; ")}`,
    marketOpportunitySummary: `Domination score ${opportunity.dominationScore}/100 with marketplace suitability ${opportunity.marketplaceSuitability}/100 on ${opportunity.recommendedMarketplace}.`,
    riskSummary:
      opportunity.scoutRecommendation === "REJECT"
        ? "Elevated risk — scout recommends rejection."
        : opportunity.scoutRecommendation === "REVIEW"
          ? "Moderate risk — manual Grand King review advised."
          : "Acceptable risk profile for Grand King investment review.",
    expansionPotential: `Secondary: ${opportunity.marketplaceRecommendation.secondaryMarketplace ?? "shopify"}. Future: ${opportunity.marketplaceRecommendation.futureExpansionMarketplaces.join(", ") || "none"}.`,
  };
}

/** Builds investment-grade business opportunity cards from LIVE-005 discovery — preview only. */
export function buildBusinessOpportunityRecord(
  session: DiscoverySession,
  opportunity: ProductOpportunity,
): BusinessOpportunityRecord {
  const readiness = getCommerceReadinessSummary({
    workspaceId: session.workspaceId,
    companyId: session.companyId,
    accountType: session.accountType,
  });
  const launchConfidence = Math.round(
    opportunity.confidence * 0.5 +
      readiness.overallReadinessScore * 0.3 +
      opportunity.dominationScore * 0.2,
  );

  const brand = buildBrandBlock(session, opportunity);
  const economics = projectEconomics(opportunity, launchConfidence);
  const timestamp = new Date().toISOString();

  return {
    businessOpportunityId: `biz:${opportunity.opportunityId}`,
    sourceOpportunityId: opportunity.opportunityId,
    workspaceId: session.workspaceId,
    companyId: session.companyId,
    discoverySessionId: session.sessionId,
    status: "DISCOVERED",
    rank: opportunity.rank,
    favorite: false,
    notes: "",
    brand,
    economics,
    assetsPreview: buildAssetsPreview(brand, opportunity),
    marketIntelligence: buildMarketIntelligence(opportunity),
    investmentThesis: `Would I invest? Domination ${economics.dominationScore}/100, ROI ${economics.expectedRoi}/100, breakeven ~${economics.expectedBreakevenMonths}mo, launch confidence ${launchConfidence}/100.`,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function buildBusinessOpportunitiesFromSession(session: DiscoverySession): BusinessOpportunityRecord[] {
  return session.opportunities.map((opportunity) => buildBusinessOpportunityRecord(session, opportunity));
}
