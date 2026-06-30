import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
  createInMemoryPricingIntelligenceRepository,
  createPricingIntelligenceModule,
  DISCOUNT_TYPES,
  generatePricingBlueprint,
  PRICING_FACTOR_TYPES,
  validatePricingIntelligenceBlueprint,
} from "../../execution/pricing-intelligence/index.js";

const WORKSPACE_ID = "ws-m086";

function buildPricingInput(storeId = randomUUID()) {
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
    supplierCost: 18.99,
    competitorPrice: 54.99,
    demandIndex: 78,
  };
}

describe("Mission 086 Pricing Intelligence Engine", () => {
  it("generates pricing blueprint with safety flags", async () => {
    const module = createPricingIntelligenceModule();
    const record = await module.persistBlueprint(WORKSPACE_ID, buildPricingInput());

    assert.ok(record.blueprintId);
    assert.match(record.blueprintName, /Kitchen Blender Supply Co\./);
    assert.equal(record.intelligenceOnly, true);
    assert.equal(record.deploymentEnabled, false);
    assert.equal(record.autoApplyEnabled, false);
    assert.ok(record.confidence >= 60);
    assert.ok(record.overallScore >= 60);
    assert.ok(record.signals.some((signal) => signal.signalType === "pricing_composite"));
  });

  it("generates optimal price with margin and bounds", () => {
    const price = generatePricingBlueprint(buildPricingInput()).optimalPrice;

    assert.ok(price.recommendedPrice > 0);
    assert.ok(price.compareAtPrice > price.recommendedPrice);
    assert.ok(price.priceFloor < price.recommendedPrice);
    assert.ok(price.priceCeiling >= price.recommendedPrice);
    assert.equal(price.currency, "USD");
    assert.ok(price.marginPercent >= 40);
    assert.ok(price.marginDollars > 0);
    assert.ok(price.supplierCost > 0);
    assert.ok(price.confidence >= 60);
    assert.ok(price.rationale.length > 0);
  });

  it("compares all eight pricing factors", () => {
    const analyses = generatePricingBlueprint(buildPricingInput()).factorAnalyses;

    assert.equal(analyses.length, 8);
    assert.deepEqual(
      analyses.map((analysis) => analysis.factorType),
      [...PRICING_FACTOR_TYPES],
    );

    for (const analysis of analyses) {
      assert.ok(analysis.score >= 0 && analysis.score <= 100);
      assert.ok(analysis.findings.length >= 1);
      assert.ok(analysis.recommendation.length > 0);
      assert.ok(analysis.unit.length > 0);
    }
  });

  it("analyzes supplier cost and competition", () => {
    const analyses = generatePricingBlueprint(buildPricingInput()).factorAnalyses;

    const cost = analyses.find((entry) => entry.factorType === "SUPPLIER_COST");
    const competition = analyses.find((entry) => entry.factorType === "COMPETITION");

    assert.ok(cost);
    assert.ok(competition);
    assert.equal(cost!.currentValue, 18.99);
    assert.equal(competition!.currentValue, 54.99);
    assert.ok(cost!.findings.some((finding) => finding.includes("Supplier cost")));
    assert.ok(competition!.findings.some((finding) => finding.includes("Competitor")));
  });

  it("analyzes margin, demand, and elasticity", () => {
    const analyses = generatePricingBlueprint(buildPricingInput()).factorAnalyses;

    const margin = analyses.find((entry) => entry.factorType === "MARGIN");
    const demand = analyses.find((entry) => entry.factorType === "DEMAND");
    const elasticity = analyses.find((entry) => entry.factorType === "ELASTICITY");

    assert.ok(margin);
    assert.ok(demand);
    assert.ok(elasticity);
    assert.equal(demand!.currentValue, 78);
    assert.equal(margin!.unit, "percent");
    assert.equal(elasticity!.unit, "coefficient");
  });

  it("generates psychological pricing tactics", () => {
    const psych = generatePricingBlueprint(buildPricingInput()).psychologicalPricing;
    const optimal = generatePricingBlueprint(buildPricingInput()).optimalPrice;

    assert.equal(psych.charmPrice, optimal.recommendedPrice);
    assert.ok(psych.anchorPrice > psych.charmPrice);
    assert.ok(psych.installmentPrice > 0);
    assert.ok(psych.installmentMonths >= 1);
    assert.ok(psych.tactics.length >= 3);
    assert.ok(psych.tactics.some((tactic) => tactic.includes("Charm")));
  });

  it("generates bundle pricing recommendations", () => {
    const bundles = generatePricingBlueprint(buildPricingInput()).bundles;

    assert.ok(bundles.length >= 3);
    for (const bundle of bundles) {
      assert.ok(bundle.itemCount >= 2);
      assert.ok(bundle.bundlePrice < bundle.individualTotal);
      assert.ok(bundle.savingsPercent > 0);
      assert.ok(bundle.savingsDollars > 0);
      assert.ok(bundle.score >= 0 && bundle.score <= 100);
    }
  });

  it("generates discount strategy with tiers", () => {
    const strategy = generatePricingBlueprint(buildPricingInput()).discountStrategy;

    assert.ok(strategy.maxDiscountPercent <= 20);
    assert.ok(strategy.minMarginFloorPercent >= 0);
    assert.ok(strategy.tiers.length >= 4);

    for (const tier of strategy.tiers) {
      assert.ok(DISCOUNT_TYPES.includes(tier.discountType));
      assert.ok(tier.discountPercent <= strategy.maxDiscountPercent);
      assert.ok(tier.trigger.length > 0);
    }
  });

  it("validates pricing intelligence blueprint schema", () => {
    const blueprint = generatePricingBlueprint(buildPricingInput());
    const validated = validatePricingIntelligenceBlueprint({
      blueprintId: randomUUID(),
      ...blueprint,
    });

    assert.equal(validated.factorAnalyses.length, 8);
    assert.equal(validated.intelligenceOnly, true);
    assert.equal(validated.autoApplyEnabled, false);
  });

  it("persists pricing intelligence records in the repository", async () => {
    const repository = createInMemoryPricingIntelligenceRepository();
    const module = createPricingIntelligenceModule(repository);
    const input = buildPricingInput();

    const saved = await module.persistBlueprint(WORKSPACE_ID, input);
    const loadedByStore = await module.getBlueprintByStore(WORKSPACE_ID, input.storeId);
    const loadedById = await module.getBlueprintRecord(WORKSPACE_ID, saved.recordId);

    assert.ok(loadedByStore);
    assert.ok(loadedById);
    assert.equal(loadedByStore!.optimalPrice.recommendedPrice, saved.optimalPrice.recommendedPrice);
    assert.equal(loadedById!.bundles.length, saved.bundles.length);

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      storeId: input.storeId,
    });
    assert.equal(listed.length, 1);
  });
});
