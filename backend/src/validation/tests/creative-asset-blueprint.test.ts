import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
  createCreativeAssetBlueprintModule,
  createInMemoryCreativeAssetBlueprintRepository,
  CREATIVE_TOOLS,
  generateCreativeAssetBlueprint,
} from "../../execution/creative-asset-blueprint/index.js";
import {
  createMarketingCampaignGenesisModule,
  generateMarketingCampaign,
} from "../../execution/marketing-campaign-genesis/index.js";

const WORKSPACE_ID = "ws-m070";

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

function buildBlueprintInput(campaignId?: string) {
  const brand = buildBrandInput();
  const offer = buildOfferInput();
  const campaign = generateMarketingCampaign({ brand, offer });

  return {
    brand,
    offer,
    campaignId: campaignId ?? randomUUID(),
    storeId: randomUUID(),
    campaignName: campaign.campaignName,
    adAngles: campaign.adAngles.map((angle) => ({
      title: angle.title,
      hook: angle.hook,
    })),
  };
}

describe("Mission 070 Creative Asset Blueprint Engine", () => {
  it("generates a creative asset blueprint with required output fields", async () => {
    const module = createCreativeAssetBlueprintModule();
    const input = buildBlueprintInput();
    const record = await module.persistBlueprint(WORKSPACE_ID, input);

    assert.ok(record.blueprintId);
    assert.ok(record.imagePrompts.length >= 3);
    assert.ok(record.videoPrompts.length >= 2);
    assert.ok(record.hooks.length >= 3);
    assert.ok(record.scripts.length >= 2);
    assert.equal(record.cta, input.offer.callToAction);
    assert.ok(record.confidence >= 75);
    assert.ok(record.signals.some((signal) => signal.signalType === "blueprint_composite"));
  });

  it("supports Canva, Veo, and Image Generation tool targets", () => {
    const blueprint = generateCreativeAssetBlueprint(buildBlueprintInput());

    assert.ok(blueprint.imagePrompts.some((prompt) => prompt.tool === "CANVA"));
    assert.ok(blueprint.imagePrompts.some((prompt) => prompt.tool === "IMAGE_GENERATION"));
    assert.ok(blueprint.videoPrompts.every((prompt) => prompt.tool === "VEO"));

    const tools = new Set([
      ...blueprint.imagePrompts.map((prompt) => prompt.tool),
      ...blueprint.videoPrompts.map((prompt) => prompt.tool),
    ]);
    for (const tool of CREATIVE_TOOLS) {
      assert.ok(tools.has(tool));
    }
  });

  it("generates hooks and scripts from campaign ad angles", () => {
    const input = buildBlueprintInput();
    const blueprint = generateCreativeAssetBlueprint(input);

    assert.ok(blueprint.hooks.some((hook) => hook.angle === "Problem-solution"));
    assert.ok(blueprint.hooks.every((hook) => hook.text.length > 0));
    assert.ok(blueprint.scripts.some((script) => script.format === "short-form video"));
    assert.match(blueprint.scripts[0]!.body, /\[CTA\]/);
  });

  it("chains with marketing campaign genesis outputs", async () => {
    const campaignModule = createMarketingCampaignGenesisModule();
    const brand = buildBrandInput();
    const offer = buildOfferInput();
    const campaign = await campaignModule.persistCampaign(WORKSPACE_ID, { brand, offer });

    const blueprintModule = createCreativeAssetBlueprintModule();
    const record = await blueprintModule.persistBlueprint(WORKSPACE_ID, {
      brand,
      offer,
      campaignId: campaign.campaignId,
      adAngles: campaign.adAngles.map((angle) => ({
        title: angle.title,
        hook: angle.hook,
      })),
    });

    assert.equal(record.campaignId, campaign.campaignId);
    assert.equal(record.cta, offer.callToAction);
    assert.ok(record.hooks.length >= campaign.adAngles.length - 1);
  });

  it("builds image and video prompts with production-ready metadata", () => {
    const blueprint = generateCreativeAssetBlueprint(buildBlueprintInput());

    for (const prompt of blueprint.imagePrompts) {
      assert.ok(prompt.prompt.length > 20);
      assert.ok(prompt.aspectRatio.length > 0);
      assert.ok(prompt.style.length > 0);
    }

    for (const prompt of blueprint.videoPrompts) {
      assert.ok(prompt.prompt.includes("Veo"));
      assert.ok(prompt.durationSeconds >= 15);
      assert.ok(prompt.format.length > 0);
    }
  });

  it("persists creative asset blueprint records in the repository", async () => {
    const repository = createInMemoryCreativeAssetBlueprintRepository();
    const module = createCreativeAssetBlueprintModule(repository);
    const input = buildBlueprintInput();

    const saved = await module.persistBlueprint(WORKSPACE_ID, input);
    const loadedByCampaign = await module.getBlueprintByCampaign(
      WORKSPACE_ID,
      input.campaignId!,
    );
    const loadedById = await module.getBlueprintRecord(WORKSPACE_ID, saved.recordId);

    assert.ok(loadedByCampaign);
    assert.ok(loadedById);
    assert.equal(loadedByCampaign!.cta, saved.cta);
    assert.equal(loadedById!.imagePrompts.length, saved.imagePrompts.length);

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      brandId: input.brand.brandId,
    });
    assert.equal(listed.length, 1);
  });
});
