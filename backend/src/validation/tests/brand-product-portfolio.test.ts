import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
  createBrandProductPortfolioModule,
  createInMemoryBrandProductRepository,
  scoreBrandProductPortfolio,
} from "../../execution/brand-product-portfolio/index.js";
import type { BrandProductPortfolioInput } from "../../execution/brand-product-portfolio/index.js";

const WORKSPACE_ID = "ws-m047";

function buildPortfolioInput(
  overrides: {
    brandConfidence?: number;
    includePremiumRecommendation?: boolean;
  } = {},
): BrandProductPortfolioInput {
  const brandId = randomUUID();
  const heroProductId = "prod-m047-kitchen-blender";
  const accessoryProductId = "prod-m047-blender-pitcher";
  const experimentalProductId = "prod-m047-travel-blender";

  return {
    brand: {
      brandId,
      productId: heroProductId,
      brandName: "Kitchen Blender Supply Co.",
      niche: "Curated ecommerce essentials",
      recommendedProducts: [
        "Kitchen Blender",
        "Starter bundle kit",
        "Kitchen Blender premium edition",
        ...(overrides.includePremiumRecommendation ? ["Kitchen Blender launch bundle"] : []),
      ],
      confidence: overrides.brandConfidence ?? 80,
    },
    heroProduct: {
      id: heroProductId,
      displayName: "Kitchen Blender",
      categoryId: "cat-kitchen-appliances",
      confidence: 84,
      tags: ["kitchen", "blender", "hero"],
    },
    relatedProducts: [
      {
        id: accessoryProductId,
        displayName: "Replacement Pitcher",
        categoryId: "cat-kitchen-accessories",
        confidence: 72,
        tags: ["accessory", "supporting"],
      },
      {
        id: experimentalProductId,
        displayName: "Travel Mini Blender",
        categoryId: "cat-kitchen-appliances",
        confidence: 58,
        tags: ["experimental", "portable"],
      },
    ],
    relationships: [
      {
        sourceProductId: heroProductId,
        targetProductId: accessoryProductId,
        relationshipType: "complementary",
        strength: 78,
      },
      {
        sourceProductId: heroProductId,
        targetProductId: experimentalProductId,
        relationshipType: "related",
        strength: 42,
      },
    ],
    opportunities: [
      {
        productId: heroProductId,
        opportunityScore: 86,
        opportunityTier: "high",
        confidence: 82,
        strengths: ["Strong buyer demand"],
      },
      {
        productId: accessoryProductId,
        opportunityScore: 68,
        opportunityTier: "medium",
        confidence: 70,
        strengths: ["High attach rate"],
      },
      {
        productId: experimentalProductId,
        opportunityScore: 46,
        opportunityTier: "medium",
        confidence: 52,
        strengths: ["Portable use case"],
      },
    ],
    supplierMatches: [
      {
        productId: heroProductId,
        matchScore: 84,
        matchTier: "high",
        confidence: 80,
        recommendedUse: "primary fulfillment partner",
      },
      {
        productId: accessoryProductId,
        matchScore: 72,
        matchTier: "medium",
        confidence: 68,
        recommendedUse: "accessory fulfillment",
      },
      {
        productId: experimentalProductId,
        matchScore: 55,
        matchTier: "medium",
        confidence: 50,
        recommendedUse: "test supplier",
      },
    ],
  };
}

describe("Mission 047 Brand Product Portfolio Engine", () => {
  it("selects the hero product for the brand", async () => {
    const module = createBrandProductPortfolioModule();
    const input = buildPortfolioInput();
    const portfolio = await module.persistBrandProductPortfolio(WORKSPACE_ID, input);

    assert.equal(portfolio.heroProducts.length, 1);
    assert.equal(portfolio.heroProducts[0]!.productId, input.heroProduct.id);
    assert.equal(portfolio.heroProducts[0]!.role, "HERO");
    assert.ok(portfolio.heroProducts[0]!.productScore >= 70);
  });

  it("selects supporting products from complementary relationships", async () => {
    const module = createBrandProductPortfolioModule();
    const input = buildPortfolioInput();
    const portfolio = await module.persistBrandProductPortfolio(WORKSPACE_ID, input);

    assert.equal(portfolio.supportingProducts.length, 1);
    assert.equal(portfolio.supportingProducts[0]!.displayName, "Replacement Pitcher");
    assert.equal(portfolio.supportingProducts[0]!.role, "SUPPORTING");
    assert.ok(portfolio.supportingProducts[0]!.relationshipStrength >= 55);
  });

  it("generates bundle products from hero and supporting products", async () => {
    const input = buildPortfolioInput({ includePremiumRecommendation: true });
    const portfolio = scoreBrandProductPortfolio(input);

    assert.ok(portfolio.bundleProducts.length >= 2);
    assert.ok(
      portfolio.bundleProducts.some((product) => product.displayName.includes("Starter Bundle")),
    );
    assert.ok(
      portfolio.bundleProducts.some((product) => product.displayName.includes("Launch Bundle")),
    );
    assert.ok(portfolio.bundleProducts.every((product) => product.role === "BUNDLE"));
  });

  it("scores the overall brand product portfolio", () => {
    const highPortfolio = scoreBrandProductPortfolio(buildPortfolioInput({ brandConfidence: 85 }));
    const lowPortfolio = scoreBrandProductPortfolio({
      ...buildPortfolioInput({ brandConfidence: 45 }),
      opportunities: buildPortfolioInput().opportunities.map((entry) => ({
        ...entry,
        opportunityScore: Math.max(20, entry.opportunityScore - 30),
        confidence: Math.max(20, entry.confidence - 25),
      })),
      supplierMatches: buildPortfolioInput().supplierMatches.map((entry) => ({
        ...entry,
        matchScore: Math.max(20, entry.matchScore - 25),
      })),
      relatedProducts: buildPortfolioInput().relatedProducts.map((entry) => ({
        ...entry,
        confidence: Math.max(20, entry.confidence - 20),
      })),
    });

    assert.ok(highPortfolio.portfolioScore >= 60);
    assert.ok(highPortfolio.portfolioScore > lowPortfolio.portfolioScore);
    assert.ok(highPortfolio.recommendedProducts.length > portfolioMinCount(highPortfolio));
    assert.ok(highPortfolio.signals.some((signal) => signal.signalType === "portfolio_composite"));
  });

  it("calculates confidence from brand, opportunity, and supplier inputs", () => {
    const baseInput = buildPortfolioInput();
    const highConfidence = scoreBrandProductPortfolio(
      buildPortfolioInput({ brandConfidence: 88 }),
    );
    const lowConfidence = scoreBrandProductPortfolio({
      ...baseInput,
      brand: { ...baseInput.brand, confidence: 42 },
      opportunities: baseInput.opportunities.map((entry) => ({
        ...entry,
        confidence: 38,
      })),
      supplierMatches: baseInput.supplierMatches.map((entry) => ({
        ...entry,
        confidence: 36,
      })),
    });

    assert.ok(highConfidence.confidence > lowConfidence.confidence);
    assert.ok(highConfidence.confidence >= 65);
  });

  it("persists brand product portfolios in the repository", async () => {
    const repository = createInMemoryBrandProductRepository();
    const module = createBrandProductPortfolioModule(repository);
    const input = buildPortfolioInput();
    const saved = await module.persistBrandProductPortfolio(WORKSPACE_ID, input);

    const loaded = await module.getPortfolioByBrand(WORKSPACE_ID, input.brand.brandId);
    assert.ok(loaded);
    assert.equal(loaded!.portfolioId, saved.portfolioId);
    assert.equal(loaded!.brandId, input.brand.brandId);
    assert.equal(loaded!.heroProducts[0]!.productId, input.heroProduct.id);

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      brandId: input.brand.brandId,
    });
    assert.equal(listed.length, 1);
    assert.ok(listed[0]!.bundleProducts.length >= 1);
  });
});

function portfolioMinCount(portfolio: ReturnType<typeof scoreBrandProductPortfolio>): number {
  return (
    portfolio.heroProducts.length +
    portfolio.supportingProducts.length +
    portfolio.bundleProducts.length
  );
}
