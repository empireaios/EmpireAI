import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createInMemoryRevenueOpportunityRepository,
  createRevenueOpportunityModule,
  scoreRevenueOpportunity,
} from "../../revenue/revenue-opportunity-synthesis/index.js";
import type {
  RevenueForecastInput,
  RevenueLaunchDecisionInput,
  RevenueLearningInput,
  RevenueOpportunityInput,
  RevenueOpportunitySynthesisInput,
  RevenueTrustInput,
} from "../../revenue/revenue-opportunity-synthesis/index.js";

const WORKSPACE_ID = "ws-m043";

function makeOpportunity(
  productId: string,
  overrides: Partial<RevenueOpportunityInput> = {},
): RevenueOpportunityInput {
  return {
    productId,
    opportunityScore: 72,
    opportunityTier: "high",
    confidence: 70,
    strengths: ["Strong buyer demand", "Good channel fit"],
    weaknesses: ["Moderate competition"],
    recommendedChannels: ["Amazon", "Google Search"],
    ...overrides,
  };
}

function makeLaunch(
  productId: string,
  overrides: Partial<RevenueLaunchDecisionInput> = {},
): RevenueLaunchDecisionInput {
  return {
    productId,
    decision: "WATCH",
    launchScore: 62,
    confidence: 68,
    reasons: ["Solid launch readiness"],
    risks: ["Competition pressure"],
    recommendedChannels: ["Amazon", "Google Search"],
    expectedOutcome: "Moderate launch potential",
    ...overrides,
  };
}

function makeForecast(
  productId: string,
  overrides: Partial<RevenueForecastInput> = {},
): RevenueForecastInput {
  return {
    productId,
    forecastDirection: "STABLE",
    forecastConfidence: 66,
    momentumProjection: 58,
    riskProjection: 42,
    opportunityProjection: 60,
    recommendedAction: "WATCH",
    ...overrides,
  };
}

function makeTrustProfiles(profiles: RevenueTrustInput[] = []): RevenueTrustInput[] {
  return profiles.length > 0
    ? profiles
    : [
        {
          source: "AMAZON",
          trustScore: 74,
          trustTier: "MEDIUM_TRUST",
          manipulationRisk: 18,
          noiseLevel: 22,
        },
      ];
}

function makeLearning(
  productId: string,
  overrides: Partial<RevenueLearningInput> = {},
): RevenueLearningInput {
  return {
    productId,
    executionStatus: "COMPLETED",
    confidenceAdjustment: {
      baseConfidence: 68,
      adjustedConfidence: 74,
      delta: 6,
      reason: "Completed investigation improved confidence",
    },
    investigationRecommendations: [],
    repeatedFailures: [],
    repeatedSuccesses: [],
    ...overrides,
  };
}

function buildSynthesisInput(
  productId: string,
  overrides: {
    opportunity?: Partial<RevenueOpportunityInput>;
    launch?: Partial<RevenueLaunchDecisionInput>;
    forecast?: Partial<RevenueForecastInput>;
    trustProfiles?: RevenueTrustInput[];
    learning?: RevenueLearningInput | null;
  } = {},
): RevenueOpportunitySynthesisInput {
  return {
    productId,
    opportunity: makeOpportunity(productId, overrides.opportunity),
    launch: makeLaunch(productId, overrides.launch),
    forecast: makeForecast(productId, overrides.forecast),
    trustProfiles: makeTrustProfiles(overrides.trustProfiles),
    learning: overrides.learning ?? makeLearning(productId),
  };
}

describe("Mission 043 Revenue Opportunity Synthesis Engine", () => {
  it("synthesizes a high value revenue opportunity", async () => {
    const module = createRevenueOpportunityModule();
    const productId = "prod-m043-high";
    const input = buildSynthesisInput(productId, {
      opportunity: {
        opportunityScore: 88,
        opportunityTier: "high",
        confidence: 82,
        strengths: ["High demand", "Strong margins"],
        weaknesses: ["Moderate competition"],
      },
      launch: {
        decision: "LAUNCH",
        launchScore: 84,
        confidence: 80,
        reasons: ["Launch-ready supplier match", "Strong buyer alignment"],
        risks: ["Seasonal volatility"],
        recommendedChannels: ["Amazon", "Google Search"],
        expectedOutcome: "Strong test launch candidate",
      },
      forecast: {
        forecastDirection: "RISING",
        forecastConfidence: 78,
        momentumProjection: 82,
        opportunityProjection: 85,
        riskProjection: 35,
        recommendedAction: "ACCUMULATE",
      },
    });

    const opportunity = await module.persistRevenueOpportunity(WORKSPACE_ID, input);

    assert.equal(opportunity.productId, productId);
    assert.equal(opportunity.opportunityType, "DROPSHIPPING");
    assert.ok(opportunity.expectedValue >= 75);
    assert.ok(opportunity.confidence >= 70);
    assert.ok(opportunity.reasons.length >= 2);
  });

  it("synthesizes a low value revenue opportunity", async () => {
    const module = createRevenueOpportunityModule();
    const productId = "prod-m043-low";
    const input = buildSynthesisInput(productId, {
      opportunity: {
        opportunityScore: 28,
        opportunityTier: "low",
        confidence: 35,
        strengths: [],
        weaknesses: ["Weak demand", "High competition", "Supplier risk"],
      },
      launch: {
        decision: "REJECT",
        launchScore: 22,
        confidence: 30,
        reasons: ["Insufficient launch readiness"],
        risks: ["Weak demand", "Supplier instability", "Low margin"],
        expectedOutcome: "Not launch ready",
      },
      forecast: {
        forecastDirection: "DECLINING",
        forecastConfidence: 40,
        momentumProjection: 20,
        opportunityProjection: 18,
        riskProjection: 78,
        recommendedAction: "AVOID",
      },
      trustProfiles: [
        {
          source: "REDDIT",
          trustScore: 38,
          trustTier: "LOW_TRUST",
          manipulationRisk: 42,
          noiseLevel: 48,
        },
      ],
      learning: makeLearning(productId, {
        executionStatus: "FAILED",
        confidenceAdjustment: {
          baseConfidence: 40,
          adjustedConfidence: 28,
          delta: -12,
          reason: "Failed investigation reduced confidence",
        },
        repeatedFailures: [
          {
            patternKey: "CHECK_DEMAND:amazon",
            taskType: "CHECK_DEMAND",
            connectorId: "amazon",
            occurrenceCount: 2,
            lastSeenAt: new Date().toISOString(),
            description: "CHECK_DEMAND failed via amazon",
          },
        ],
      }),
    });

    const opportunity = await module.persistRevenueOpportunity(WORKSPACE_ID, input);

    assert.ok(opportunity.expectedValue < 45);
    assert.ok(opportunity.expectedDifficulty >= 55);
    assert.ok(opportunity.risks.length >= 3);
    assert.equal(opportunity.opportunityType, "DIGITAL_PRODUCT");
  });

  it("calculates confidence from intelligence inputs", () => {
    const productId = "prod-m043-confidence";
    const highConfidence = scoreRevenueOpportunity(
      buildSynthesisInput(productId, {
        opportunity: { confidence: 85 },
        launch: { confidence: 82 },
        forecast: { forecastConfidence: 80 },
      }),
    );
    const lowConfidence = scoreRevenueOpportunity(
      buildSynthesisInput(productId, {
        opportunity: { confidence: 35, opportunityScore: 30, opportunityTier: "low" },
        launch: { decision: "REJECT", confidence: 28, launchScore: 25 },
        forecast: { forecastConfidence: 32, riskProjection: 75 },
        learning: makeLearning(productId, {
          confidenceAdjustment: {
            baseConfidence: 35,
            adjustedConfidence: 25,
            delta: -10,
            reason: "Low confidence after failures",
          },
          repeatedFailures: [
            {
              patternKey: "CHECK_TREND:google-trends",
              taskType: "CHECK_TREND",
              connectorId: "google-trends",
              occurrenceCount: 2,
              lastSeenAt: new Date().toISOString(),
              description: "CHECK_TREND failed via google-trends",
            },
          ],
        }),
      }),
    );

    assert.ok(highConfidence.confidence > lowConfidence.confidence);
    assert.ok(highConfidence.signals.some((signal) => signal.signalType === "confidence_composite"));
  });

  it("handles risks from launch, trust, and learning inputs", () => {
    const productId = "prod-m043-risks";
    const breakdown = scoreRevenueOpportunity(
      buildSynthesisInput(productId, {
        launch: {
          risks: ["Pricing volatility", "Supplier lead time"],
        },
        forecast: {
          recommendedAction: "AVOID",
          riskProjection: 72,
        },
        trustProfiles: [
          {
            source: "TIKTOK",
            trustScore: 40,
            trustTier: "LOW_TRUST",
            manipulationRisk: 45,
            noiseLevel: 50,
          },
        ],
        learning: makeLearning(productId, {
          repeatedFailures: [
            {
              patternKey: "CHECK_SUPPLIER:cj-dropshipping",
              taskType: "CHECK_SUPPLIER",
              connectorId: "cj-dropshipping",
              occurrenceCount: 3,
              lastSeenAt: new Date().toISOString(),
              description: "CHECK_SUPPLIER failed via cj-dropshipping",
            },
          ],
        }),
      }),
    );

    assert.ok(breakdown.risks.some((risk) => risk.includes("Pricing volatility")));
    assert.ok(breakdown.risks.some((risk) => risk.includes("Trend forecast recommends avoiding")));
    assert.ok(breakdown.risks.some((risk) => risk.includes("Low trust source TIKTOK")));
    assert.ok(breakdown.risks.some((risk) => risk.includes("CHECK_SUPPLIER failed")));
  });

  it("generates recommended actions by opportunity type", () => {
    const productId = "prod-m043-recommend";

    const dropshipping = scoreRevenueOpportunity(
      buildSynthesisInput(productId, {
        opportunity: { opportunityScore: 82, opportunityTier: "high" },
        launch: { decision: "LAUNCH", launchScore: 80 },
      }),
    );
    assert.equal(dropshipping.opportunityType, "DROPSHIPPING");
    assert.match(dropshipping.recommendedAction, /dropshipping/i);

    const content = scoreRevenueOpportunity(
      buildSynthesisInput(`${productId}-content`, {
        launch: {
          decision: "WATCH",
          recommendedChannels: ["YouTube", "TikTok Content"],
        },
        forecast: {
          forecastDirection: "STRONGLY_RISING",
          recommendedAction: "ACCUMULATE",
        },
      }),
    );
    assert.equal(content.opportunityType, "CONTENT");
    assert.match(content.recommendedAction, /content funnel/i);
  });

  it("persists revenue opportunities in the repository", async () => {
    const repository = createInMemoryRevenueOpportunityRepository();
    const module = createRevenueOpportunityModule(repository);
    const productId = "prod-m043-persist";
    const input = buildSynthesisInput(productId);

    const saved = await module.persistRevenueOpportunity(WORKSPACE_ID, input);
    const loaded = await module.getRevenueOpportunityByProduct(WORKSPACE_ID, productId);

    assert.ok(loaded);
    assert.equal(loaded!.opportunityId, saved.opportunityId);
    assert.equal(loaded!.productId, productId);

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      minExpectedValue: 40,
    });
    assert.equal(listed.length, 1);
    assert.equal(listed[0]!.opportunityId, saved.opportunityId);
  });
});
