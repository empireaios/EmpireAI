import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
  CAMPAIGN_OBJECTIVES,
  CAMPAIGN_STRATEGY_TIERS,
  createInMemoryCampaignIntelligenceRepository,
  createMarketingCampaignIntelligenceModule,
  generateMarketingCampaignIntelligence,
  MARKETING_CHANNELS,
} from "../../execution/marketing-campaign-intelligence/index.js";

const WORKSPACE_ID = "ws-m077";

function buildIntelligenceInput(brandId = randomUUID()) {
  return {
    brand: {
      brandId,
      brandName: "Kitchen Blender Supply Co.",
      slogan: "Quality you can ship today",
      niche: "Curated ecommerce essentials",
      targetAudience: "Online shoppers seeking fast, reliable product discovery",
      positioning: "Trusted direct-to-consumer category leader",
      confidence: 82,
    },
    offer: {
      offerTitle: "Premium Kitchen Blender Offer",
      headline: "Elevate your kitchen blender experience with Kitchen Blender Supply Co.",
      valueProposition:
        "Kitchen Blender delivers premium positioning for curated ecommerce essentials.",
      keyBenefits: [
        "Premium positioning buyers trust immediately",
        "Higher perceived quality and brand credibility",
        "Stronger conversion for high-intent shoppers",
      ],
      callToAction: "Shop the premium offer",
      confidence: 84,
    },
    storeId: randomUUID(),
    launchConfidence: 81,
    opportunityType: "launch",
  };
}

describe("Mission 077 Marketing Campaign Intelligence Engine", () => {
  it("generates intelligence with required output fields and safety flags", async () => {
    const module = createMarketingCampaignIntelligenceModule();
    const record = await module.persistIntelligence(WORKSPACE_ID, buildIntelligenceInput());

    assert.ok(record.intelligenceId);
    assert.match(record.campaignName, /Kitchen Blender Supply Co\./);
    assert.equal(record.intelligenceOnly, true);
    assert.equal(record.liveAdvertisingEnabled, false);
    assert.ok(record.confidence >= 70);
    assert.ok(record.signals.some((signal) => signal.signalType === "intelligence_composite"));
  });

  it("determines optimal campaign objective from opportunity and audience signals", () => {
    const intelligence = generateMarketingCampaignIntelligence(buildIntelligenceInput());

    assert.ok(CAMPAIGN_OBJECTIVES.includes(intelligence.objectiveIntelligence.recommendedObjective));
    assert.equal(intelligence.objectiveIntelligence.objectiveScores.length, CAMPAIGN_OBJECTIVES.length);
    assert.ok(intelligence.objectiveIntelligence.rationale.length > 0);

    const ecommerceInput = buildIntelligenceInput();
    ecommerceInput.brand.niche = "Direct-to-consumer ecommerce";
    ecommerceInput.brand.targetAudience = "High-intent online shoppers";
    const salesIntel = generateMarketingCampaignIntelligence(ecommerceInput);
    assert.equal(salesIntel.objectiveIntelligence.recommendedObjective, "SALES");
  });

  it("ranks all eight advertising channels with confidence scores", () => {
    const intelligence = generateMarketingCampaignIntelligence(buildIntelligenceInput());

    assert.equal(intelligence.channelRecommendations.length, MARKETING_CHANNELS.length);
    assert.deepEqual(
      intelligence.channelRecommendations.map((entry) => entry.rank),
      MARKETING_CHANNELS.map((_, index) => index + 1),
    );

    for (const channel of MARKETING_CHANNELS) {
      assert.ok(intelligence.channelRecommendations.some((entry) => entry.channel === channel));
    }

    assert.ok(intelligence.channelRecommendations.every((entry) => entry.confidence >= 50));
    assert.equal(intelligence.channelRecommendations[0]!.rank, 1);
  });

  it("generates audience intelligence with targeting recommendations", () => {
    const intelligence = generateMarketingCampaignIntelligence(buildIntelligenceInput());
    const audience = intelligence.audienceIntelligence;

    assert.ok(audience.countries.length >= 1);
    assert.ok(audience.ageRanges.length >= 1);
    assert.ok(audience.genders.length >= 1);
    assert.ok(audience.interests.length >= 3);
    assert.ok(audience.behaviors.length >= 2);
    assert.match(audience.lookalikeRecommendation, /lookalike/i);
    assert.match(audience.customAudienceRecommendation, /Retarget/i);
  });

  it("recommends budget tiers and performance estimates", () => {
    const intelligence = generateMarketingCampaignIntelligence(buildIntelligenceInput());
    const budget = intelligence.budgetIntelligence;

    assert.ok(budget.minimumTestBudget > 0);
    assert.ok(budget.recommendedBudget >= budget.minimumTestBudget);
    assert.ok(budget.aggressiveBudget >= budget.recommendedBudget);
    assert.equal(budget.currency, "USD");
    assert.ok(budget.expectedCpc > 0);
    assert.ok(budget.expectedCpm > 0);
    assert.ok(budget.expectedCtr > 0);
    assert.ok(budget.expectedCpa > 0);
    assert.ok(budget.estimatedRoas > 0);
    assert.ok(budget.estimatedBreakeven > 0);
  });

  it("generates conservative, balanced, and aggressive strategies with rationale", () => {
    const intelligence = generateMarketingCampaignIntelligence(buildIntelligenceInput());

    assert.equal(intelligence.strategies.length, 3);
    assert.deepEqual(
      intelligence.strategies.map((strategy) => strategy.tier),
      [...CAMPAIGN_STRATEGY_TIERS],
    );

    for (const strategy of intelligence.strategies) {
      assert.ok(strategy.primaryChannels.length >= 2);
      assert.ok(strategy.rationale.length > 0);
      assert.ok(strategy.expectedOutcome.length > 0);
      assert.equal(strategy.objective, intelligence.objectiveIntelligence.recommendedObjective);
    }
  });

  it("calculates campaign risk metrics and learning period", () => {
    const intelligence = generateMarketingCampaignIntelligence(buildIntelligenceInput());
    const risk = intelligence.riskAssessment;

    assert.ok(risk.marketSaturation >= 0 && risk.marketSaturation <= 100);
    assert.ok(risk.competitionLevel >= 0 && risk.competitionLevel <= 100);
    assert.ok(risk.creativeFatigueRisk >= 0 && risk.creativeFatigueRisk <= 100);
    assert.ok(risk.budgetRisk >= 0 && risk.budgetRisk <= 100);
    assert.ok(risk.expectedLearningPeriodDays >= 7);
    assert.ok(["LOW", "MODERATE", "HIGH"].includes(risk.riskTier));
    assert.ok(risk.summary.length > 0);
  });

  it("returns final campaign recommendation with confidence score", () => {
    const intelligence = generateMarketingCampaignIntelligence(buildIntelligenceInput());
    const recommendation = intelligence.recommendation;

    assert.ok(CAMPAIGN_STRATEGY_TIERS.includes(recommendation.recommendedStrategy));
    assert.ok(MARKETING_CHANNELS.includes(recommendation.recommendedChannel));
    assert.ok(recommendation.recommendedAudience.countries.length >= 1);
    assert.ok(recommendation.recommendedBudget.recommendedBudget > 0);
    assert.ok(recommendation.expectedOutcome.length > 0);
    assert.ok(recommendation.confidenceScore >= 70);
    assert.equal(recommendation.recommendedChannel, intelligence.channelRecommendations[0]!.channel);
  });

  it("persists campaign intelligence records in the repository", async () => {
    const repository = createInMemoryCampaignIntelligenceRepository();
    const module = createMarketingCampaignIntelligenceModule(repository);
    const input = buildIntelligenceInput();

    const saved = await module.persistIntelligence(WORKSPACE_ID, input);
    const loadedByBrand = await module.getIntelligenceByBrand(WORKSPACE_ID, input.brand.brandId);
    const loadedById = await module.getIntelligenceRecord(WORKSPACE_ID, saved.recordId);

    assert.ok(loadedByBrand);
    assert.ok(loadedById);
    assert.equal(loadedByBrand!.campaignName, saved.campaignName);
    assert.equal(loadedById!.strategies.length, 3);

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      storeId: input.storeId,
    });
    assert.equal(listed.length, 1);
  });
});
