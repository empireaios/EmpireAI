import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createInMemoryInvestigationRepository,
  createInvestigationPriorityModule,
  scoreInvestigationPriority,
} from "../../eye/investigation-priority-intelligence/index.js";
import type {
  InvestigationForecastInput,
  InvestigationOpportunityInput,
  InvestigationPriorityAnalysisInput,
  InvestigationTrustInput,
} from "../../eye/investigation-priority-intelligence/index.js";

const WORKSPACE_ID = "ws-m039";

function makeOpportunity(
  productId: string,
  overrides: Partial<InvestigationOpportunityInput> = {},
): InvestigationOpportunityInput {
  return {
    productId,
    opportunityScore: 60,
    opportunityTier: "medium",
    confidence: 70,
    strengths: ["baseline demand"],
    weaknesses: ["limited proof"],
    ...overrides,
  };
}

function makeForecast(
  productId: string,
  overrides: Partial<InvestigationForecastInput> = {},
): InvestigationForecastInput {
  return {
    productId,
    forecastDirection: "STABLE",
    forecastConfidence: 70,
    momentumProjection: 55,
    riskProjection: 40,
    opportunityProjection: 60,
    recommendedAction: "WATCH",
    ...overrides,
  };
}

function makeTrustProfiles(profiles: InvestigationTrustInput[]): InvestigationTrustInput[] {
  return profiles;
}

function buildAnalysisInput(
  productId: string,
  opportunity: Partial<InvestigationOpportunityInput>,
  forecast: Partial<InvestigationForecastInput>,
  trustProfiles: InvestigationTrustInput[],
): InvestigationPriorityAnalysisInput {
  return {
    target: { productId, label: `Investigate ${productId}` },
    opportunity: makeOpportunity(productId, opportunity),
    forecast: makeForecast(productId, forecast),
    trustProfiles: makeTrustProfiles(trustProfiles),
  };
}

describe("Mission 039 Investigation Priority Intelligence Engine", () => {
  it("prioritizes a critical investigation target", async () => {
    const module = createInvestigationPriorityModule();
    const input = buildAnalysisInput(
      "prod-m039-critical",
      {
        opportunityScore: 92,
        opportunityTier: "high",
        confidence: 50,
        weaknesses: ["unverified supplier", "thin social proof", "pricing volatility"],
      },
      {
        forecastDirection: "STRONGLY_RISING",
        forecastConfidence: 55,
        momentumProjection: 90,
        opportunityProjection: 88,
        riskProjection: 42,
        recommendedAction: "ACCUMULATE",
      },
      [
        { source: "TIKTOK", trustScore: 42, trustTier: "LOW_TRUST", manipulationRisk: 38, noiseLevel: 45 },
        { source: "REDDIT", trustScore: 48, trustTier: "MEDIUM_TRUST", manipulationRisk: 32, noiseLevel: 40 },
      ],
    );

    const { priority } = await module.prioritizeTarget(WORKSPACE_ID, input);

    assert.equal(priority.priorityLevel, "CRITICAL");
    assert.ok(priority.investigationPriorityScore >= 82);
    assert.ok(priority.urgencyScore >= 80);
    assert.ok(priority.uncertaintyScore >= 45);
  });

  it("prioritizes a high investigation target", async () => {
    const module = createInvestigationPriorityModule();
    const input = buildAnalysisInput(
      "prod-m039-high",
      {
        opportunityScore: 78,
        opportunityTier: "high",
        confidence: 72,
        weaknesses: ["moderate competition"],
      },
      {
        forecastDirection: "RISING",
        forecastConfidence: 74,
        momentumProjection: 76,
        opportunityProjection: 75,
        riskProjection: 38,
        recommendedAction: "ACCUMULATE",
      },
      [{ source: "AMAZON", trustScore: 74, trustTier: "MEDIUM_TRUST", manipulationRisk: 18, noiseLevel: 20 }],
    );

    const { priority } = await module.prioritizeTarget(WORKSPACE_ID, input);

    assert.equal(priority.priorityLevel, "HIGH");
    assert.ok(priority.investigationPriorityScore >= 60);
    assert.ok(priority.investigationPriorityScore < 82);
  });

  it("prioritizes a medium investigation target", async () => {
    const module = createInvestigationPriorityModule();
    const input = buildAnalysisInput(
      "prod-m039-medium",
      {
        opportunityScore: 55,
        opportunityTier: "medium",
        confidence: 66,
        weaknesses: ["mixed demand signals"],
      },
      {
        forecastDirection: "STABLE",
        forecastConfidence: 68,
        momentumProjection: 52,
        opportunityProjection: 54,
        riskProjection: 48,
        recommendedAction: "WATCH",
      },
      [{ source: "PINTEREST", trustScore: 68, trustTier: "MEDIUM_TRUST", manipulationRisk: 22, noiseLevel: 28 }],
    );

    const { priority } = await module.prioritizeTarget(WORKSPACE_ID, input);

    assert.equal(priority.priorityLevel, "MEDIUM");
    assert.ok(priority.investigationPriorityScore >= 38);
    assert.ok(priority.investigationPriorityScore < 60);
  });

  it("prioritizes a low investigation target", async () => {
    const module = createInvestigationPriorityModule();
    const input = buildAnalysisInput(
      "prod-m039-low",
      {
        opportunityScore: 28,
        opportunityTier: "low",
        confidence: 82,
        weaknesses: [],
        strengths: ["stable niche"],
      },
      {
        forecastDirection: "DECLINING",
        forecastConfidence: 80,
        momentumProjection: 25,
        opportunityProjection: 22,
        riskProjection: 72,
        recommendedAction: "AVOID",
      },
      [{ source: "GOOGLE_TRENDS", trustScore: 86, trustTier: "HIGH_TRUST", manipulationRisk: 10, noiseLevel: 12 }],
    );

    const { priority } = await module.prioritizeTarget(WORKSPACE_ID, input);

    assert.equal(priority.priorityLevel, "LOW");
    assert.ok(priority.investigationPriorityScore < 38);
  });

  it("increases priority when uncertainty rises", () => {
    const baseInput = buildAnalysisInput(
      "prod-m039-uncertainty",
      {
        opportunityScore: 70,
        opportunityTier: "high",
        confidence: 82,
        weaknesses: ["one channel dependency"],
      },
      {
        forecastDirection: "RISING",
        forecastConfidence: 78,
        momentumProjection: 70,
        opportunityProjection: 68,
        recommendedAction: "WATCH",
      },
      [{ source: "AMAZON", trustScore: 76, trustTier: "HIGH_TRUST", manipulationRisk: 12, noiseLevel: 15 }],
    );

    const uncertainInput = buildAnalysisInput(
      "prod-m039-uncertainty",
      {
        opportunityScore: 70,
        opportunityTier: "high",
        confidence: 48,
        weaknesses: ["unverified claims", "conflicting reviews", "thin evidence"],
      },
      {
        forecastDirection: "RISING",
        forecastConfidence: 46,
        momentumProjection: 70,
        opportunityProjection: 68,
        riskProjection: 62,
        recommendedAction: "WATCH",
      },
      [
        { source: "AMAZON", trustScore: 52, trustTier: "MEDIUM_TRUST", manipulationRisk: 34, noiseLevel: 36 },
        { source: "MANUAL", trustScore: 38, trustTier: "LOW_TRUST", manipulationRisk: 46, noiseLevel: 40 },
      ],
    );

    const stableScore = scoreInvestigationPriority(baseInput);
    const uncertainScore = scoreInvestigationPriority(uncertainInput);

    assert.ok(uncertainScore.uncertaintyScore > stableScore.uncertaintyScore);
    assert.ok(uncertainScore.investigationPriorityScore > stableScore.investigationPriorityScore);
  });

  it("persists investigation priorities in the repository", async () => {
    const repository = createInMemoryInvestigationRepository();
    const module = createInvestigationPriorityModule(repository);
    const input = buildAnalysisInput(
      "prod-m039-persist",
      {
        opportunityScore: 80,
        opportunityTier: "high",
        confidence: 70,
      },
      {
        forecastDirection: "RISING",
        recommendedAction: "ACCUMULATE",
        opportunityProjection: 78,
      },
      [{ source: "AMAZON", trustScore: 78, trustTier: "HIGH_TRUST", manipulationRisk: 14, noiseLevel: 16 }],
    );

    const { priority } = await module.prioritizeTarget(WORKSPACE_ID, input);
    const loaded = await module.getInvestigationPriority(WORKSPACE_ID, "prod-m039-persist");

    assert.ok(loaded);
    assert.equal(loaded!.id, priority.id);
    assert.equal(loaded!.priorityLevel, priority.priorityLevel);
    assert.equal(loaded!.investigationPriorityScore, priority.investigationPriorityScore);

    const listed = await module.listInvestigationPriorities(WORKSPACE_ID, { minPriorityScore: 60 });
    assert.equal(listed.length, 1);
    assert.equal(listed[0]!.productId, "prod-m039-persist");
  });
});
