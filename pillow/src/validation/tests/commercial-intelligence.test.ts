import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { assembleCommerceOperatingModel } from "../../commerce-operating-model/assembler.js";
import { assembleBusinessFactoryArchitecture } from "../../business-factory/assembler.js";
import {
  assembleCommercialIntelligenceArchitecture,
  buildFallbackCommercialIntelligenceArchitecture,
  INTELLIGENCE_PIPELINE,
  INSIGHT_CLASSIFICATIONS,
} from "../../commercial-intelligence/index.js";
import type { CommerceIntelligenceReport } from "../../commerce-intelligence/types.js";

function mockReport(): CommerceIntelligenceReport {
  return {
    version: "PILLOW-CI-001",
    generatedAt: new Date().toISOString(),
    recommendedProducts: [
      {
        product: {
          id: "p1",
          name: "Bamboo Organizer",
          category: "Home",
          supplierId: "s1",
          marketIds: ["us"],
          costUsd: 12,
          suggestedPriceUsd: 34,
          profitMarginPercent: 42,
          competitionLevel: "medium",
          demandScore: 78,
          seasonality: "year-round",
          growthTrend: "rising",
          advertisingPotential: 70,
          customerInterest: 75,
        },
        evaluation: {
          product: {} as never,
          profitScore: 85,
          competitionScore: 70,
          demandScore: 78,
          growthScore: 80,
          advertisingScore: 72,
          overallScore: 80,
          qualityTier: "recommended",
          rationale: "Strong margin and demand in home category",
        },
        supplierRanking: null,
        marketFit: 82,
        sustainabilityScore: 75,
        compositeScore: 81,
        aboveThreshold: true,
      },
    ],
    supplierRankings: [
      {
        supplier: {
          id: "s1",
          name: "CJ Premium",
          country: "CN",
          reliabilityScore: 88,
          shippingDaysAvg: 12,
          costIndex: 0.9,
          qualityScore: 85,
          returnRatePercent: 2,
          communicationScore: 80,
          capacityScore: 90,
          stabilityScore: 85,
        },
        compositeScore: 86,
        preferred: true,
        strengths: ["Fast shipping", "Quality tier"],
        risks: [],
      },
    ],
    marketOpportunities: [
      {
        market: {
          id: "us",
          name: "United States",
          country: "US",
          language: "en",
          currency: "USD",
          marketSizeUsd: 1_000_000,
          growthPercent: 12,
          saturation: "medium",
          demandScore: 80,
          shippingFeasible: true,
        },
        opportunityScore: 85,
        launchPriority: 1,
        recommendation: "Primary launch market for home goods",
      },
    ],
    competitorThreats: [
      {
        competitor: {
          id: "c1",
          name: "HomeBasics Co",
          positioning: "Budget home",
          priceIndex: 0.85,
          brandingScore: 60,
          reviewSentiment: 72,
          marketingIntensity: 65,
          websiteQuality: 70,
          strengths: ["Price"],
          weaknesses: ["Brand"],
        },
        threatLevel: "medium",
        competitiveAdvantage: ["Differentiate on sustainability"],
      },
    ],
    launchPlans: [],
    riskAssessment: "Manageable competitive landscape",
    recommendedActions: ["Launch Bamboo Organizer", "Run CRIR before live storefront"],
    executiveBrief: "Commerce Intelligence recommends Bamboo Organizer as top launch candidate",
  };
}

describe("P8-05 Commercial Intelligence Architecture", () => {
  test("assembles intelligence from commerce report with insight classification", () => {
    const report = mockReport();
    const factory = assembleBusinessFactoryArchitecture({ commerceReport: report });
    const commerce = assembleCommerceOperatingModel({ factory, commerceReport: report });

    const view = assembleCommercialIntelligenceArchitecture({
      report,
      commerce,
    });

    assert.equal(view.architectureVersion, "P8-05");
    assert.equal(view.pipeline.length, INTELLIGENCE_PIPELINE.length);
    assert.equal(view.winningProducts.length, 1);
    assert.ok(view.currentOpportunities.length >= 1);
    assert.ok(view.recommendations.length >= 1);
    const rec = view.recommendations[0]!;
    assert.ok(rec.why.length > 0);
    assert.ok(rec.what.length > 0);
    assert.ok(rec.how.length > 0);
    assert.ok(rec.proof.length > 0);
    assert.ok(rec.confidencePercent > 0);
    assert.ok(INSIGHT_CLASSIFICATIONS.includes(rec.classification as (typeof INSIGHT_CLASSIFICATIONS)[number]));
    assert.equal(view.integrations.intelligenceEngine, "PILLOW-CI-001 active");
  });

  test("fallback view when Pillow unavailable", () => {
    const view = buildFallbackCommercialIntelligenceArchitecture();
    assert.equal(view.architectureVersion, "P8-05");
    assert.match(view.grandKingSummary, /Intelligence|Commerce/i);
  });
});
