import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
  createInMemoryOfferRepository,
  createProductOfferGenerationModule,
  scoreProductOffer,
} from "../../execution/product-offer-generation/index.js";
import type { ProductOfferGenerationInput } from "../../execution/product-offer-generation/index.js";

const WORKSPACE_ID = "ws-m048";

function buildOfferInput(
  overrides: {
    role?: ProductOfferGenerationInput["brandProduct"]["role"];
    productScore?: number;
    opportunityScore?: number;
    brandConfidence?: number;
    portfolioConfidence?: number;
  } = {},
): ProductOfferGenerationInput {
  const brandId = randomUUID();
  const productId = "prod-m048-kitchen-blender";

  return {
    brand: {
      brandId,
      brandName: "Kitchen Blender Supply Co.",
      slogan: "Quality you can ship today",
      niche: "Curated ecommerce essentials",
      targetAudience: "Online shoppers seeking fast, reliable product discovery",
      valueProposition: "Launch a low-budget dropshipping test on the highest-confidence marketplace channels.",
      confidence: overrides.brandConfidence ?? 82,
    },
    brandProduct: {
      productId,
      displayName: "Kitchen Blender",
      role: overrides.role ?? "HERO",
      productScore: overrides.productScore ?? 84,
      opportunityScore: overrides.opportunityScore ?? 86,
      supplierMatchScore: 80,
    },
    productEntity: {
      id: productId,
      displayName: "Kitchen Blender",
      description: "High-performance kitchen blender for everyday use",
      categoryId: "cat-kitchen-appliances",
      confidence: 83,
      tags: ["kitchen", "blender", "hero"],
    },
    portfolioConfidence: overrides.portfolioConfidence ?? 78,
  };
}

describe("Mission 048 Product Offer Generation Engine", () => {
  it("generates a sellable product offer from brand portfolio inputs", async () => {
    const module = createProductOfferGenerationModule();
    const input = buildOfferInput();
    const offer = await module.persistProductOffer(WORKSPACE_ID, input);

    assert.ok(offer.offerId);
    assert.equal(offer.productId, input.brandProduct.productId);
    assert.equal(offer.brandId, input.brand.brandId);
    assert.equal(offer.offerStyle, "PREMIUM");
    assert.match(offer.offerTitle, /Premium Kitchen Blender Offer/);
    assert.ok(offer.keyBenefits.length >= 3);
    assert.ok(offer.keyFeatures.length >= 3);
  });

  it("generates a headline aligned to brand and product", () => {
    const offer = scoreProductOffer(buildOfferInput());

    assert.match(offer.headline, /Kitchen Blender Supply Co\./i);
    assert.match(offer.headline, /kitchen blender/i);
    assert.ok(offer.headline.length > 20);
  });

  it("generates key benefits based on offer style", () => {
    const premium = scoreProductOffer(buildOfferInput({ role: "HERO", productScore: 84 }));
    const value = scoreProductOffer({
      ...buildOfferInput(),
      brandProduct: {
        ...buildOfferInput().brandProduct,
        role: "BUNDLE",
        displayName: "Kitchen Blender Starter Bundle",
        productScore: 72,
        opportunityScore: 68,
      },
    });

    assert.equal(premium.offerStyle, "PREMIUM");
    assert.ok(premium.keyBenefits.some((benefit) => /premium/i.test(benefit)));
    assert.equal(value.offerStyle, "VALUE");
    assert.ok(value.keyBenefits.some((benefit) => /value|bundle|savings/i.test(benefit)));
  });

  it("generates a call to action based on offer style", () => {
    const convenience = scoreProductOffer({
      ...buildOfferInput(),
      brandProduct: {
        ...buildOfferInput().brandProduct,
        role: "SUPPORTING",
        productScore: 62,
        opportunityScore: 58,
      },
      productEntity: {
        ...buildOfferInput().productEntity,
        tags: ["accessory", "portable"],
      },
    });

    assert.equal(convenience.offerStyle, "CONVENIENCE");
    assert.match(convenience.callToAction, /easy way/i);
    assert.ok(convenience.callToAction.length > 0);
  });

  it("calculates confidence from brand, product, and portfolio inputs", () => {
    const highConfidence = scoreProductOffer(
      buildOfferInput({ brandConfidence: 88, productScore: 86, portfolioConfidence: 84 }),
    );
    const lowConfidence = scoreProductOffer(
      buildOfferInput({
        brandConfidence: 45,
        productScore: 42,
        opportunityScore: 40,
        portfolioConfidence: 38,
      }),
    );

    assert.ok(highConfidence.confidence > lowConfidence.confidence);
    assert.ok(highConfidence.confidence >= 70);
    assert.ok(highConfidence.signals.some((signal) => signal.signalType === "offer_composite"));
  });

  it("persists generated offers in the repository", async () => {
    const repository = createInMemoryOfferRepository();
    const module = createProductOfferGenerationModule(repository);
    const input = buildOfferInput({ role: "HERO" });

    const saved = await module.persistProductOffer(WORKSPACE_ID, input);
    const loaded = await module.getOfferByProduct(WORKSPACE_ID, input.brandProduct.productId);

    assert.ok(loaded);
    assert.equal(loaded!.offerId, saved.offerId);
    assert.equal(loaded!.headline, saved.headline);
    assert.equal(loaded!.callToAction, saved.callToAction);

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      brandId: input.brand.brandId,
    });
    assert.equal(listed.length, 1);
  });
});
