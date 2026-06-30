import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
  AD_CREATIVE_PLATFORMS,
  createAdCreativeGenerationModule,
  createInMemoryAdCreativeRepository,
  generateAdCreativePackage,
  STATIC_AD_FORMATS,
  VIDEO_AD_DURATIONS,
} from "../../execution/ad-creative-generation/index.js";
import { generateMarketingCampaign } from "../../execution/marketing-campaign-genesis/index.js";

const WORKSPACE_ID = "ws-m078";

function buildBrandInput(brandId = randomUUID()) {
  return {
    brandId,
    brandName: "Kitchen Blender Supply Co.",
    slogan: "Quality you can ship today",
    niche: "Curated ecommerce essentials",
    targetAudience: "Online shoppers seeking fast, reliable product discovery",
    positioning: "Trusted direct-to-consumer category leader",
    confidence: 82,
  };
}

function buildOfferInput() {
  return {
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
  };
}

function buildGenerationInput() {
  const brand = buildBrandInput();
  const offer = buildOfferInput();
  const campaign = generateMarketingCampaign({ brand, offer });

  return {
    brand,
    offer,
    campaignId: randomUUID(),
    storeId: randomUUID(),
    campaignName: campaign.campaignName,
    adAngles: campaign.adAngles.map((angle) => ({
      title: angle.title,
      hook: angle.hook,
    })),
  };
}

describe("Mission 078 AI Advertisement Creative Generation Engine", () => {
  it("generates ad creative package with safety flags and required fields", async () => {
    const module = createAdCreativeGenerationModule();
    const record = await module.persistPackage(WORKSPACE_ID, buildGenerationInput());

    assert.ok(record.packageId);
    assert.match(record.packageName, /Kitchen Blender Supply Co\./);
    assert.equal(record.blueprintOnly, true);
    assert.equal(record.liveSubmissionEnabled, false);
    assert.equal(record.imageGenerationEnabled, false);
    assert.ok(record.creativeScoring.confidence >= 70);
    assert.ok(record.signals.some((signal) => signal.signalType === "package_composite"));
  });

  it("generates creative strategy with hooks, angles, pain points, and outcomes", () => {
    const pkg = generateAdCreativePackage(buildGenerationInput());
    const strategy = pkg.creativeStrategy;

    assert.ok(strategy.primaryHook.length > 0);
    assert.ok(strategy.secondaryHook.length > 0);
    assert.ok(strategy.emotionalAngle.length > 0);
    assert.ok(strategy.rationalAngle.length > 0);
    assert.ok(strategy.painPoints.length >= 2);
    assert.ok(strategy.desiredOutcomes.length >= 2);
  });

  it("generates square, portrait, and landscape static ad creatives", () => {
    const pkg = generateAdCreativePackage(buildGenerationInput());

    assert.equal(pkg.staticCreatives.length, STATIC_AD_FORMATS.length);
    assert.deepEqual(
      pkg.staticCreatives.map((creative) => creative.format),
      [...STATIC_AD_FORMATS],
    );

    for (const creative of pkg.staticCreatives) {
      assert.ok(creative.headline.length > 0);
      assert.ok(creative.primaryText.length > 0);
      assert.ok(creative.description.length > 0);
      assert.ok(creative.callToAction.length > 0);
      assert.ok(creative.visualBrief.length > 0);
    }
  });

  it("generates 15s, 30s, and 60s video ad blueprints with storyboards", () => {
    const pkg = generateAdCreativePackage(buildGenerationInput());

    assert.equal(pkg.videoBlueprints.length, VIDEO_AD_DURATIONS.length);
    assert.deepEqual(
      pkg.videoBlueprints.map((blueprint) => blueprint.durationSeconds),
      [...VIDEO_AD_DURATIONS],
    );

    for (const blueprint of pkg.videoBlueprints) {
      assert.ok(blueprint.openingHook.length > 0);
      assert.ok(blueprint.storyboard.length >= 3);
      assert.ok(blueprint.voiceover.length > 0);
      assert.ok(blueprint.onScreenCaptions.length >= 3);
      assert.ok(blueprint.closingCallToAction.length > 0);
      assert.equal(blueprint.onScreenCaptions.length, blueprint.storyboard.length);
    }
  });

  it("produces platform variants for Facebook, Instagram, TikTok, YouTube Shorts, and Pinterest", () => {
    const pkg = generateAdCreativePackage(buildGenerationInput());

    assert.equal(pkg.platformVariants.length, AD_CREATIVE_PLATFORMS.length);
    for (const platform of AD_CREATIVE_PLATFORMS) {
      assert.ok(pkg.platformVariants.some((variant) => variant.platform === platform));
    }

    assert.ok(pkg.platformVariants.every((variant) => variant.optimizationNotes.length > 0));
    assert.ok(pkg.platformVariants.every((variant) => variant.formatRecommendation.length > 0));
  });

  it("calculates creative scoring dimensions", () => {
    const scoring = generateAdCreativePackage(buildGenerationInput()).creativeScoring;

    assert.ok(scoring.scrollStoppingScore >= 0 && scoring.scrollStoppingScore <= 100);
    assert.ok(scoring.emotionalScore >= 0 && scoring.emotionalScore <= 100);
    assert.ok(scoring.clarityScore >= 0 && scoring.clarityScore <= 100);
    assert.ok(scoring.conversionScore >= 0 && scoring.conversionScore <= 100);
    assert.ok(scoring.confidence >= 70);
  });

  it("returns full creative package with recommended primary creative and summaries", () => {
    const pkg = generateAdCreativePackage(buildGenerationInput());

    assert.ok(["STATIC", "VIDEO"].includes(pkg.recommendedPrimaryCreative.type));
    assert.ok(pkg.recommendedPrimaryCreative.creativeId.length > 0);
    assert.ok(AD_CREATIVE_PLATFORMS.includes(pkg.recommendedPrimaryCreative.platform));
    assert.ok(pkg.recommendedPrimaryCreative.rationale.length > 0);
    assert.ok(pkg.copySummary.length > 0);
    assert.ok(pkg.storyboardSummary.length > 0);
    assert.ok(pkg.staticCreatives.length >= 3);
    assert.ok(pkg.videoBlueprints.length >= 3);
    assert.ok(pkg.platformVariants.length >= 5);
  });

  it("chains from marketing campaign genesis ad angles", () => {
    const brand = buildBrandInput();
    const offer = buildOfferInput();
    const campaign = generateMarketingCampaign({ brand, offer });

    const pkg = generateAdCreativePackage({
      brand,
      offer,
      adAngles: campaign.adAngles.map((angle) => ({
        title: angle.title,
        hook: angle.hook,
      })),
    });

    assert.equal(pkg.creativeStrategy.primaryHook, campaign.adAngles[0]!.hook);
  });

  it("persists ad creative records in the repository", async () => {
    const repository = createInMemoryAdCreativeRepository();
    const module = createAdCreativeGenerationModule(repository);
    const input = buildGenerationInput();

    const saved = await module.persistPackage(WORKSPACE_ID, input);
    const loadedByBrand = await module.getPackageByBrand(WORKSPACE_ID, input.brand.brandId);
    const loadedById = await module.getPackageRecord(WORKSPACE_ID, saved.recordId);

    assert.ok(loadedByBrand);
    assert.ok(loadedById);
    assert.equal(loadedByBrand!.packageName, saved.packageName);
    assert.equal(loadedById!.staticCreatives.length, 3);

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      storeId: input.storeId,
    });
    assert.equal(listed.length, 1);
  });
});
