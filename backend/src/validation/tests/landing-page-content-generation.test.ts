import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import { scoreLandingPageBlueprint } from "../../execution/landing-page-blueprint/index.js";
import type { LandingPageBlueprintInput } from "../../execution/landing-page-blueprint/index.js";
import {
  createInMemoryContentRepository,
  createLandingPageContentGenerationModule,
  scoreLandingPageContent,
} from "../../execution/landing-page-content-generation/index.js";
import type { LandingPageContentInput } from "../../execution/landing-page-content-generation/index.js";

const WORKSPACE_ID = "ws-m050";

function buildBlueprintInput(
  overrides: {
    offerConfidence?: number;
    brandConfidence?: number;
  } = {},
): LandingPageBlueprintInput {
  const brandId = randomUUID();
  const offerId = randomUUID();
  const productId = "prod-m050-kitchen-blender";

  return {
    offer: {
      offerId,
      brandId,
      productId,
      offerStyle: "PREMIUM",
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
      positioning:
        "Trusted direct-to-consumer category leader ready to scale in curated ecommerce essentials",
      confidence: overrides.brandConfidence ?? 80,
    },
  };
}

function buildContentInput(
  overrides: {
    offerConfidence?: number;
    brandConfidence?: number;
  } = {},
): LandingPageContentInput {
  const blueprintInput = buildBlueprintInput(overrides);
  const blueprint = scoreLandingPageBlueprint(blueprintInput);

  return {
    blueprint: {
      pageId: randomUUID(),
      offerId: blueprint.offerId,
      brandId: blueprint.brandId,
      productId: blueprint.productId,
      pageTitle: blueprint.pageTitle,
      heroSection: blueprint.heroSection,
      problemSection: blueprint.problemSection,
      solutionSection: blueprint.solutionSection,
      benefitsSection: blueprint.benefitsSection,
      offerSection: blueprint.offerSection,
      socialProofSection: blueprint.socialProofSection,
      faqSection: blueprint.faqSection,
      ctaSection: blueprint.ctaSection,
      confidence: blueprint.confidence,
    },
    offer: {
      ...blueprintInput.offer,
      valueProposition: blueprintInput.offer.valueProposition,
    },
    brand: {
      ...blueprintInput.brand,
      valueProposition: blueprintInput.offer.valueProposition,
    },
  };
}

describe("Mission 050 Landing Page Content Generation Engine", () => {
  it("generates complete landing page content from a blueprint", async () => {
    const module = createLandingPageContentGenerationModule();
    const input = buildContentInput();
    const content = await module.persistLandingPageContent(WORKSPACE_ID, input);

    assert.ok(content.contentId);
    assert.equal(content.pageId, input.blueprint.pageId);
    assert.equal(content.offerId, input.offer.offerId);
    assert.ok(content.heroCopy.length > 0);
    assert.ok(content.problemCopy.length > 0);
    assert.ok(content.solutionCopy.length > 0);
    assert.ok(content.benefitsCopy.length > 0);
    assert.ok(content.offerCopy.length > 0);
    assert.ok(content.socialProofCopy.length > 0);
    assert.ok(content.faqCopy.length > 0);
    assert.ok(content.ctaCopy.length > 0);
  });

  it("generates conversion-focused hero copy aligned with brand and offer", () => {
    const input = buildContentInput();
    const content = scoreLandingPageContent(input);

    assert.match(content.heroCopy, /Elevate your kitchen blender experience/i);
    assert.match(content.heroCopy, /Quality you can ship today/);
    assert.match(content.heroCopy, /Kitchen Blender Supply Co\./i);
    assert.match(content.heroCopy, /premium and trustworthy/i);
    assert.match(content.heroCopy, /\[Shop the premium offer\]/);
  });

  it("generates benefits copy from offer key benefits", () => {
    const content = scoreLandingPageContent(buildContentInput());

    assert.match(content.benefitsCopy, /Why this offer wins/i);
    assert.match(content.benefitsCopy, /Premium positioning buyers trust immediately/);
    assert.match(content.benefitsCopy, /Higher perceived quality and brand credibility/);
    assert.match(content.benefitsCopy, /reduce hesitation and move buyers toward action/i);
  });

  it("generates FAQ copy from blueprint FAQ bullets", () => {
    const content = scoreLandingPageContent(buildContentInput());

    assert.match(content.faqCopy, /Common questions answered/i);
    assert.match(content.faqCopy, /Q1:/);
    assert.match(content.faqCopy, /Kitchen Blender Supply Co\./i);
    assert.ok(content.faqCopy.split("Q").length >= 3);
  });

  it("calculates confidence from blueprint, offer, and brand inputs", () => {
    const highConfidence = scoreLandingPageContent(
      buildContentInput({ offerConfidence: 88, brandConfidence: 86 }),
    );
    const lowConfidence = scoreLandingPageContent(
      buildContentInput({ offerConfidence: 42, brandConfidence: 40 }),
    );

    assert.ok(highConfidence.confidence > lowConfidence.confidence);
    assert.ok(highConfidence.confidence >= 70);
    assert.ok(
      highConfidence.signals.some((signal) => signal.signalType === "content_composite"),
    );
  });

  it("persists generated landing page content in the repository", async () => {
    const repository = createInMemoryContentRepository();
    const module = createLandingPageContentGenerationModule(repository);
    const input = buildContentInput();

    const saved = await module.persistLandingPageContent(WORKSPACE_ID, input);
    const loaded = await module.getContentByPage(WORKSPACE_ID, input.blueprint.pageId);

    assert.ok(loaded);
    assert.equal(loaded!.contentId, saved.contentId);
    assert.equal(loaded!.heroCopy, saved.heroCopy);
    assert.equal(loaded!.faqCopy, saved.faqCopy);

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      brandId: input.brand.brandId,
    });
    assert.equal(listed.length, 1);
  });
});
