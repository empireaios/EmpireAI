import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
  createInMemoryBlueprintRepository,
  createLandingPageBlueprintModule,
  scoreLandingPageBlueprint,
} from "../../execution/landing-page-blueprint/index.js";
import type { LandingPageBlueprintInput } from "../../execution/landing-page-blueprint/index.js";

const WORKSPACE_ID = "ws-m049";

function buildBlueprintInput(
  overrides: {
    offerConfidence?: number;
    brandConfidence?: number;
    offerStyle?: LandingPageBlueprintInput["offer"]["offerStyle"];
  } = {},
): LandingPageBlueprintInput {
  const brandId = randomUUID();
  const offerId = randomUUID();
  const productId = "prod-m049-kitchen-blender";

  return {
    offer: {
      offerId,
      brandId,
      productId,
      offerStyle: overrides.offerStyle ?? "PREMIUM",
      offerTitle: "Premium Kitchen Blender Offer",
      headline: "Elevate your kitchen blender experience with Kitchen Blender Supply Co.",
      valueProposition:
        "Launch a low-budget dropshipping test on the highest-confidence marketplace channels. Kitchen Blender delivers premium positioning for curated ecommerce essentials.",
      keyBenefits: [
        "Premium positioning buyers trust immediately",
        "Higher perceived quality and brand credibility",
        "Stronger conversion for high-intent shoppers",
      ],
      keyFeatures: [
        "High-performance kitchen blender for everyday use",
        "Curated premium presentation",
        "Brand-backed quality promise",
      ],
      customerProblem:
        "Buyers in curated ecommerce essentials struggle to find products that feel premium and trustworthy",
      customerOutcome:
        "Online shoppers seeking fast, reliable product discovery get a polished, high-confidence purchase they feel proud to own",
      callToAction: "Shop the premium offer",
      confidence: overrides.offerConfidence ?? 82,
    },
    brand: {
      brandId,
      brandName: "Kitchen Blender Supply Co.",
      slogan: "Quality you can ship today",
      niche: "Curated ecommerce essentials",
      targetAudience: "Online shoppers seeking fast, reliable product discovery",
      positioning: "Trusted direct-to-consumer category leader ready to scale in curated ecommerce essentials",
      confidence: overrides.brandConfidence ?? 80,
    },
  };
}

describe("Mission 049 Landing Page Blueprint Engine", () => {
  it("generates a landing page blueprint from a product offer", async () => {
    const module = createLandingPageBlueprintModule();
    const input = buildBlueprintInput();
    const blueprint = await module.persistLandingPageBlueprint(WORKSPACE_ID, input);

    assert.ok(blueprint.pageId);
    assert.equal(blueprint.offerId, input.offer.offerId);
    assert.equal(blueprint.brandId, input.brand.brandId);
    assert.match(blueprint.pageTitle, /Kitchen Blender Supply Co\./);
    assert.equal(blueprint.heroSection.sectionType, "HERO");
    assert.equal(blueprint.problemSection.sectionType, "PROBLEM");
    assert.equal(blueprint.ctaSection.sectionType, "CTA");
    assert.ok(blueprint.signals.length >= 6);
  });

  it("generates a hero section from offer and brand inputs", () => {
    const input = buildBlueprintInput();
    const blueprint = scoreLandingPageBlueprint(input);

    assert.equal(blueprint.heroSection.sectionType, "HERO");
    assert.equal(blueprint.heroSection.headline, input.offer.headline);
    assert.match(blueprint.heroSection.body, /Quality you can ship today/);
    assert.equal(blueprint.heroSection.callToAction, "Shop the premium offer");
    assert.equal(blueprint.heroSection.order, 1);
  });

  it("generates a benefits section from offer key benefits", () => {
    const blueprint = scoreLandingPageBlueprint(buildBlueprintInput());

    assert.equal(blueprint.benefitsSection.sectionType, "BENEFITS");
    assert.equal(blueprint.benefitsSection.bullets.length, 3);
    assert.ok(
      blueprint.benefitsSection.bullets.some((benefit) =>
        /premium positioning/i.test(benefit),
      ),
    );
    assert.match(blueprint.benefitsSection.body, /polished, high-confidence purchase/i);
  });

  it("generates a CTA section with the offer call to action", () => {
    const blueprint = scoreLandingPageBlueprint(buildBlueprintInput());

    assert.equal(blueprint.ctaSection.sectionType, "CTA");
    assert.equal(blueprint.ctaSection.callToAction, "Shop the premium offer");
    assert.match(blueprint.ctaSection.headline, /Ready to buy/i);
    assert.ok(blueprint.ctaSection.bullets.length >= 2);
    assert.equal(blueprint.ctaSection.order, 8);
  });

  it("calculates confidence from offer and brand alignment", () => {
    const highConfidence = scoreLandingPageBlueprint(
      buildBlueprintInput({ offerConfidence: 88, brandConfidence: 86 }),
    );
    const lowConfidence = scoreLandingPageBlueprint(
      buildBlueprintInput({ offerConfidence: 42, brandConfidence: 40 }),
    );

    assert.ok(highConfidence.confidence > lowConfidence.confidence);
    assert.ok(highConfidence.confidence >= 70);
    assert.ok(
      highConfidence.signals.some((signal) => signal.signalType === "blueprint_composite"),
    );
  });

  it("persists landing page blueprints in the repository", async () => {
    const repository = createInMemoryBlueprintRepository();
    const module = createLandingPageBlueprintModule(repository);
    const input = buildBlueprintInput();

    const saved = await module.persistLandingPageBlueprint(WORKSPACE_ID, input);
    const loaded = await module.getBlueprintByOffer(WORKSPACE_ID, input.offer.offerId);

    assert.ok(loaded);
    assert.equal(loaded!.pageId, saved.pageId);
    assert.equal(loaded!.heroSection.headline, saved.heroSection.headline);
    assert.equal(loaded!.ctaSection.callToAction, saved.ctaSection.callToAction);

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      brandId: input.brand.brandId,
    });
    assert.equal(listed.length, 1);
  });
});
