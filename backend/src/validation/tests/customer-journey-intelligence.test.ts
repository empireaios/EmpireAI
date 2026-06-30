import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
  createCustomerJourneyIntelligenceModule,
  createInMemoryCustomerJourneyRepository,
  generateCustomerJourney,
  JOURNEY_STAGE_TYPES,
  validateCustomerJourney,
} from "../../execution/customer-journey-intelligence/index.js";

const WORKSPACE_ID = "ws-m082";

function buildJourneyInput(storeId = randomUUID()) {
  return {
    brand: {
      brandId: randomUUID(),
      brandName: "Kitchen Blender Supply Co.",
      slogan: "Quality you can ship today",
      niche: "Curated ecommerce essentials",
      targetAudience: "Online shoppers seeking fast, reliable product discovery",
      positioning: "Trusted direct-to-consumer category leader",
      confidence: 82,
    },
    offer: {
      offerTitle: "Premium Kitchen Blender Offer",
      headline: "Elevate your kitchen blender experience",
      valueProposition: "Premium positioning for curated ecommerce essentials.",
      keyBenefits: [
        "Premium positioning buyers trust immediately",
        "Higher perceived quality and brand credibility",
        "Stronger conversion for high-intent shoppers",
      ],
      callToAction: "Shop the premium offer",
      averageOrderValue: 49.99,
    },
    storeId,
    storeSlug: "kitchen-blender-supply-co",
  };
}

describe("Mission 082 Customer Journey Intelligence Engine", () => {
  it("generates customer journey with safety flags", async () => {
    const module = createCustomerJourneyIntelligenceModule();
    const record = await module.persistJourney(WORKSPACE_ID, buildJourneyInput());

    assert.ok(record.journeyId);
    assert.match(record.journeyName, /Kitchen Blender Supply Co\./);
    assert.equal(record.intelligenceOnly, true);
    assert.equal(record.deploymentEnabled, false);
    assert.equal(record.autoApplyEnabled, false);
    assert.ok(record.confidence >= 60);
    assert.ok(record.overallScore >= 60);
    assert.ok(record.signals.some((signal) => signal.signalType === "journey_composite"));
  });

  it("generates all ten journey stages with scores", () => {
    const journey = generateCustomerJourney(buildJourneyInput());

    assert.equal(journey.stages.length, 10);
    assert.deepEqual(
      journey.stages.map((stage) => stage.stageType),
      [...JOURNEY_STAGE_TYPES],
    );

    for (const stage of journey.stages) {
      assert.ok(stage.score >= 0 && stage.score <= 100);
      assert.ok(stage.benchmarkScore >= 0);
      assert.ok(["STRONG", "ADEQUATE", "NEEDS_IMPROVEMENT"].includes(stage.status));
      assert.ok(stage.metrics.length >= 1);
      assert.ok(stage.touchpoints.length >= 1);
      assert.equal(stage.order, JOURNEY_STAGE_TYPES.indexOf(stage.stageType) + 1);
    }
  });

  it("scores discovery through checkout conversion path", () => {
    const stages = generateCustomerJourney(buildJourneyInput()).stages;
    const conversionStages = ["DISCOVERY", "LANDING", "BROWSE", "CART", "CHECKOUT"] as const;

    for (const stageType of conversionStages) {
      const stage = stages.find((entry) => entry.stageType === stageType);
      assert.ok(stage, `Missing stage ${stageType}`);
      assert.ok(stage!.score >= 50);
    }
  });

  it("scores post-purchase retention stages", () => {
    const stages = generateCustomerJourney(buildJourneyInput()).stages;
    const retentionStages = ["POST_PURCHASE", "UPSELL", "REPEAT_PURCHASE"] as const;

    for (const stageType of retentionStages) {
      const stage = stages.find((entry) => entry.stageType === stageType);
      assert.ok(stage);
      assert.ok(stage!.metrics.length >= 3);
    }
  });

  it("scores abandonment and return customer stages", () => {
    const stages = generateCustomerJourney(buildJourneyInput()).stages;

    const abandonment = stages.find((stage) => stage.stageType === "ABANDONMENT");
    const returnCustomer = stages.find((stage) => stage.stageType === "RETURN_CUSTOMER");

    assert.ok(abandonment);
    assert.ok(returnCustomer);
    assert.ok(abandonment!.frictionPoints.length >= 1);
    assert.ok(returnCustomer!.touchpoints.some((touchpoint) => touchpoint.includes("Referral")));
  });

  it("generates optimization recommendations linked to stages", () => {
    const journey = generateCustomerJourney(buildJourneyInput());

    assert.ok(journey.recommendations.length >= 1);
    for (const recommendation of journey.recommendations) {
      assert.ok(JOURNEY_STAGE_TYPES.includes(recommendation.stageType));
      assert.ok(["HIGH", "MEDIUM", "LOW"].includes(recommendation.priority));
      assert.ok(["LOW", "MEDIUM", "HIGH"].includes(recommendation.effortLevel));
      assert.ok(recommendation.metricTargets.length >= 1);
      assert.ok(recommendation.expectedImpact.length > 0);
    }
  });

  it("computes weighted confidence signals", () => {
    const journey = generateCustomerJourney(buildJourneyInput());

    assert.ok(journey.signals.length >= 6);
    const composite = journey.signals.find((signal) => signal.signalType === "journey_composite");
    assert.ok(composite);
    assert.equal(composite!.score, journey.confidence);
  });

  it("validates customer journey schema", () => {
    const journey = generateCustomerJourney(buildJourneyInput());
    const validated = validateCustomerJourney({ journeyId: randomUUID(), ...journey });

    assert.equal(validated.stages.length, 10);
    assert.equal(validated.intelligenceOnly, true);
  });

  it("persists customer journey records in the repository", async () => {
    const repository = createInMemoryCustomerJourneyRepository();
    const module = createCustomerJourneyIntelligenceModule(repository);
    const input = buildJourneyInput();

    const saved = await module.persistJourney(WORKSPACE_ID, input);
    const loadedByStore = await module.getJourneyByStore(WORKSPACE_ID, input.storeId);
    const loadedById = await module.getJourneyRecord(WORKSPACE_ID, saved.recordId);

    assert.ok(loadedByStore);
    assert.ok(loadedById);
    assert.equal(loadedByStore!.overallScore, saved.overallScore);
    assert.equal(loadedById!.recommendations.length, saved.recommendations.length);

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      storeId: input.storeId,
    });
    assert.equal(listed.length, 1);
  });
});
