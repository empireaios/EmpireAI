import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
  createInMemoryCampaignGenesisRepository,
  createMarketingCampaignGenesisModule,
  generateMarketingCampaign,
  MARKETING_PLATFORMS,
} from "../../execution/marketing-campaign-genesis/index.js";

const WORKSPACE_ID = "ws-m069";

function buildCampaignInput(brandId = randomUUID()) {
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
  };
}

describe("Mission 069 Marketing Campaign Genesis", () => {
  it("generates a launch campaign with required output fields", async () => {
    const module = createMarketingCampaignGenesisModule();
    const input = buildCampaignInput();
    const record = await module.persistCampaign(WORKSPACE_ID, input);

    assert.ok(record.campaignId);
    assert.match(record.campaignName, /Kitchen Blender Supply Co\./);
    assert.match(record.campaignName, /Launch$/);
    assert.match(record.targetAudience, /Online shoppers/);
    assert.ok(record.adAngles.length >= 4);
    assert.ok(record.creativeIdeas.length >= 4);
    assert.equal(record.platformRecommendations.length, MARKETING_PLATFORMS.length);
    assert.ok(record.confidence >= 75);
    assert.ok(record.signals.some((signal) => signal.signalType === "campaign_composite"));
  });

  it("generates ad angles from offer positioning and benefits", () => {
    const campaign = generateMarketingCampaign(buildCampaignInput());

    assert.ok(campaign.adAngles.some((angle) => angle.title === "Problem-solution"));
    assert.ok(campaign.adAngles.some((angle) => angle.title === "Value proposition"));
    assert.ok(campaign.adAngles.some((angle) => angle.title.startsWith("Benefit-led")));
    assert.ok(campaign.adAngles.every((angle) => angle.hook.length > 0));
  });

  it("generates creative ideas mapped to supported platforms", () => {
    const campaign = generateMarketingCampaign(buildCampaignInput());
    const platforms = new Set(campaign.creativeIdeas.map((idea) => idea.platform));

    assert.ok(platforms.has("TIKTOK"));
    assert.ok(platforms.has("INSTAGRAM"));
    assert.ok(platforms.has("FACEBOOK"));
    assert.ok(platforms.has("GOOGLE"));
    assert.ok(campaign.creativeIdeas.every((idea) => idea.callToAction.length > 0));
  });

  it("recommends all launch platforms with scored rationale", () => {
    const campaign = generateMarketingCampaign(buildCampaignInput());

    for (const platform of MARKETING_PLATFORMS) {
      assert.ok(
        campaign.platformRecommendations.some((entry) => entry.platform === platform),
      );
    }

    assert.ok(campaign.platformRecommendations.every((entry) => entry.score >= 50));
    assert.ok(campaign.platformRecommendations.every((entry) => entry.objective.length > 0));
    assert.equal(
      campaign.platformRecommendations[0]!.score,
      Math.max(...campaign.platformRecommendations.map((entry) => entry.score)),
    );
  });

  it("derives target audience from brand niche and positioning", () => {
    const campaign = generateMarketingCampaign({
      ...buildCampaignInput(),
      brand: {
        ...buildCampaignInput().brand,
        targetAudience: "Health-conscious home cooks",
        niche: "Premium kitchen appliances",
        positioning: "Performance-first culinary tools",
      },
    });

    assert.match(campaign.targetAudience, /Health-conscious home cooks/);
    assert.match(campaign.targetAudience, /Premium kitchen appliances/);
    assert.match(campaign.targetAudience, /performance-first culinary tools/i);
  });

  it("persists campaign genesis records in the repository", async () => {
    const repository = createInMemoryCampaignGenesisRepository();
    const module = createMarketingCampaignGenesisModule(repository);
    const input = buildCampaignInput();

    const saved = await module.persistCampaign(WORKSPACE_ID, input);
    const loadedByBrand = await module.getCampaignByBrand(WORKSPACE_ID, input.brand.brandId);
    const loadedById = await module.getCampaignRecord(WORKSPACE_ID, saved.recordId);

    assert.ok(loadedByBrand);
    assert.ok(loadedById);
    assert.equal(loadedByBrand!.campaignName, saved.campaignName);
    assert.equal(loadedById!.adAngles.length, saved.adAngles.length);

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      storeId: input.storeId,
    });
    assert.equal(listed.length, 1);
  });
});
