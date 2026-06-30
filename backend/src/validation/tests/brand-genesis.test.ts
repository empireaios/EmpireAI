import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
  createBrandGenesisModule,
  createInMemoryBrandRepository,
  scoreBrandGenesis,
} from "../../execution/brand-genesis/index.js";
import type { BrandGenesisInput } from "../../execution/brand-genesis/index.js";

const WORKSPACE_ID = "ws-m046";

function buildBrandGenesisInput(
  overrides: {
    opportunityType?: BrandGenesisInput["revenueOpportunity"]["opportunityType"];
    productId?: string;
    revenueConfidence?: number;
    portfolioScore?: number;
    portfolioState?: BrandGenesisInput["portfolioEntry"]["state"];
    allocationConfidence?: number;
    allocationPercentage?: number;
    riskAdjustedAllocation?: number;
    reasons?: string[];
    recommendedAction?: string;
  } = {},
): BrandGenesisInput {
  const productId = overrides.productId ?? "prod-m046-kitchen-blender";
  const opportunityId = randomUUID();

  return {
    revenueOpportunity: {
      opportunityId,
      productId,
      opportunityType: overrides.opportunityType ?? "DROPSHIPPING",
      confidence: overrides.revenueConfidence ?? 78,
      expectedValue: 82,
      expectedDifficulty: 38,
      recommendedAction:
        overrides.recommendedAction ??
        "Launch a low-budget dropshipping test on the highest-confidence marketplace channels",
      reasons: overrides.reasons ?? ["Strong buyer demand", "Good channel fit"],
    },
    portfolioEntry: {
      entryId: randomUUID(),
      revenueOpportunityId: opportunityId,
      productId,
      state: overrides.portfolioState ?? "SCALING",
      portfolioScore: overrides.portfolioScore ?? 84,
      capitalPriority: "HIGH",
    },
    capitalAllocation: {
      allocationId: randomUUID(),
      opportunityId,
      productId,
      portfolioState: overrides.portfolioState ?? "SCALING",
      allocationPercentage: overrides.allocationPercentage ?? 42,
      riskAdjustedAllocation: overrides.riskAdjustedAllocation ?? 4200,
      confidence: overrides.allocationConfidence ?? 76,
    },
  };
}

describe("Mission 046 Brand Genesis Engine", () => {
  it("generates a brand profile from a revenue opportunity", async () => {
    const module = createBrandGenesisModule();
    const input = buildBrandGenesisInput();

    const brand = await module.persistBrandProfile(WORKSPACE_ID, input);

    assert.ok(brand.brandId);
    assert.equal(brand.opportunityId, input.revenueOpportunity.opportunityId);
    assert.equal(brand.productId, input.revenueOpportunity.productId);
    assert.match(brand.brandName, /Kitchen Blender Supply Co\./);
    assert.ok(brand.slogan.length > 0);
    assert.ok(brand.recommendedProducts.length >= 3);
    assert.equal(brand.identity.brandName, brand.brandName);
    assert.equal(brand.positioningProfile.targetAudience, brand.targetAudience);
  });

  it("assigns a niche based on opportunity type", () => {
    const dropshipping = scoreBrandGenesis(
      buildBrandGenesisInput({ opportunityType: "DROPSHIPPING" }),
    );
    const content = scoreBrandGenesis(
      buildBrandGenesisInput({
        opportunityType: "CONTENT",
        productId: "prod-m046-content-brand",
      }),
    );

    assert.equal(dropshipping.niche, "Curated ecommerce essentials");
    assert.equal(content.niche, "Trend-led lifestyle content");
    assert.equal(dropshipping.identity.niche, dropshipping.niche);
  });

  it("assigns a target audience based on opportunity type", () => {
    const affiliate = scoreBrandGenesis(
      buildBrandGenesisInput({
        opportunityType: "AFFILIATE",
        productId: "prod-m046-affiliate-brand",
      }),
    );
    const leadGen = scoreBrandGenesis(
      buildBrandGenesisInput({
        opportunityType: "LEAD_GENERATION",
        productId: "prod-m046-lead-brand",
      }),
    );

    assert.match(affiliate.targetAudience, /Research-driven buyers/i);
    assert.match(leadGen.targetAudience, /Prospects ready to evaluate/i);
    assert.equal(affiliate.positioningProfile.targetAudience, affiliate.targetAudience);
  });

  it("generates positioning from portfolio state and opportunity type", () => {
    const scaling = scoreBrandGenesis(
      buildBrandGenesisInput({
        portfolioState: "SCALING",
        opportunityType: "DROPSHIPPING",
      }),
    );
    const watchlist = scoreBrandGenesis(
      buildBrandGenesisInput({
        portfolioState: "WATCHLIST",
        opportunityType: "CONTENT",
        productId: "prod-m046-watch-brand",
      }),
    );

    assert.match(scaling.positioning, /category leader ready to scale/i);
    assert.match(watchlist.positioning, /emerging niche explorer/i);
    assert.match(scaling.valueProposition, /Launch a low-budget dropshipping test/i);
  });

  it("calculates confidence from revenue, portfolio, and allocation inputs", () => {
    const highConfidence = scoreBrandGenesis(
      buildBrandGenesisInput({
        revenueConfidence: 88,
        portfolioScore: 86,
        allocationConfidence: 82,
        allocationPercentage: 50,
      }),
    );
    const lowConfidence = scoreBrandGenesis(
      buildBrandGenesisInput({
        revenueConfidence: 42,
        portfolioScore: 38,
        allocationConfidence: 40,
        allocationPercentage: 8,
        portfolioState: "DISCOVERED",
      }),
    );

    assert.ok(highConfidence.confidence > lowConfidence.confidence);
    assert.ok(highConfidence.confidence >= 70);
    assert.ok(lowConfidence.confidence < 55);
  });

  it("persists generated brand profiles in the repository", async () => {
    const repository = createInMemoryBrandRepository();
    const module = createBrandGenesisModule(repository);
    const input = buildBrandGenesisInput({
      productId: "prod-m046-persist-brand",
      opportunityType: "DIGITAL_PRODUCT",
    });

    const saved = await module.persistBrandProfile(WORKSPACE_ID, input);
    const loaded = await module.getBrandByOpportunity(
      WORKSPACE_ID,
      input.revenueOpportunity.opportunityId,
    );

    assert.ok(loaded);
    assert.equal(loaded!.brandId, saved.brandId);
    assert.equal(loaded!.niche, "Expert digital offers");

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      productId: input.revenueOpportunity.productId,
    });
    assert.equal(listed.length, 1);
    assert.equal(listed[0]!.allocationId, input.capitalAllocation.allocationId);
  });
});
