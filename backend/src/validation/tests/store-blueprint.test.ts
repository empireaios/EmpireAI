import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import { scoreBrandProductPortfolio } from "../../execution/brand-product-portfolio/index.js";
import type { BrandProductPortfolioInput } from "../../execution/brand-product-portfolio/index.js";
import { scoreLandingPageBlueprint } from "../../execution/landing-page-blueprint/index.js";
import type { LandingPageBlueprintInput } from "../../execution/landing-page-blueprint/index.js";
import { scoreLandingPageContent } from "../../execution/landing-page-content-generation/index.js";
import type { LandingPageContentInput } from "../../execution/landing-page-content-generation/index.js";
import {
  createInMemoryStoreBlueprintRepository,
  createStoreBlueprintModule,
  scoreStoreBlueprint,
} from "../../execution/store-blueprint/index.js";
import type { StoreBlueprintInput } from "../../execution/store-blueprint/index.js";

const WORKSPACE_ID = "ws-m051";

function buildPortfolioInput(brandId: string): BrandProductPortfolioInput {
  const heroProductId = "prod-m051-kitchen-blender";
  const accessoryProductId = "prod-m051-blender-pitcher";

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
        "Kitchen Blender launch bundle",
      ],
      confidence: 80,
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
    ],
    relationships: [
      {
        sourceProductId: heroProductId,
        targetProductId: accessoryProductId,
        relationshipType: "complementary",
        strength: 78,
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
    ],
  };
}

function buildLandingInputs(
  brandId: string,
  offerId: string,
  productId: string,
  overrides: {
    offerConfidence?: number;
    brandConfidence?: number;
  } = {},
): LandingPageBlueprintInput {
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

function buildStoreBlueprintInput(
  overrides: {
    offerConfidence?: number;
    brandConfidence?: number;
    portfolioConfidence?: number;
  } = {},
): StoreBlueprintInput {
  const brandId = randomUUID();
  const offerId = randomUUID();
  const pageId = randomUUID();
  const productId = "prod-m051-kitchen-blender";

  const portfolioInput = buildPortfolioInput(brandId);
  const portfolio = scoreBrandProductPortfolio(portfolioInput);

  const landingInput = buildLandingInputs(brandId, offerId, productId, overrides);
  const blueprint = scoreLandingPageBlueprint(landingInput);
  const contentInput: LandingPageContentInput = {
    blueprint: {
      pageId,
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
      ...landingInput.offer,
      valueProposition: landingInput.offer.valueProposition,
    },
    brand: {
      ...landingInput.brand,
      valueProposition: landingInput.offer.valueProposition,
    },
  };
  const content = scoreLandingPageContent(contentInput);

  return {
    brand: {
      brandId,
      brandName: landingInput.brand.brandName,
      slogan: landingInput.brand.slogan,
      niche: landingInput.brand.niche,
      targetAudience: landingInput.brand.targetAudience,
      positioning: landingInput.brand.positioning,
      valueProposition: landingInput.offer.valueProposition,
      confidence: overrides.brandConfidence ?? landingInput.brand.confidence,
    },
    portfolio: {
      brandId,
      recommendedProducts: portfolio.recommendedProducts,
      heroProducts: portfolio.heroProducts,
      supportingProducts: portfolio.supportingProducts,
      bundleProducts: portfolio.bundleProducts,
      portfolioScore: portfolio.portfolioScore,
      confidence: overrides.portfolioConfidence ?? portfolio.confidence,
    },
    offer: {
      offerId,
      brandId,
      productId,
      offerStyle: landingInput.offer.offerStyle,
      offerTitle: landingInput.offer.offerTitle,
      headline: landingInput.offer.headline,
      valueProposition: landingInput.offer.valueProposition,
      keyBenefits: landingInput.offer.keyBenefits,
      callToAction: landingInput.offer.callToAction,
      confidence: overrides.offerConfidence ?? landingInput.offer.confidence,
    },
    content: {
      pageId,
      offerId,
      brandId,
      productId,
      heroCopy: content.heroCopy,
      benefitsCopy: content.benefitsCopy,
      faqCopy: content.faqCopy,
      ctaCopy: content.ctaCopy,
      confidence: content.confidence,
    },
  };
}

describe("Mission 051 Store Blueprint Engine", () => {
  it("generates a complete store blueprint from brand, portfolio, offer, and content", async () => {
    const module = createStoreBlueprintModule();
    const input = buildStoreBlueprintInput();
    const store = await module.persistStoreBlueprint(WORKSPACE_ID, input);

    assert.ok(store.storeId);
    assert.equal(store.brandId, input.brand.brandId);
    assert.equal(store.homepage.pageType, "HOME");
    assert.ok(store.collectionPages.length >= 3);
    assert.ok(store.productPages.length >= 3);
    assert.equal(store.aboutPage.pageType, "ABOUT");
    assert.equal(store.faqPage.pageType, "FAQ");
    assert.equal(store.contactPage.pageType, "CONTACT");
    assert.ok(store.navigation.primaryLinks.length >= 5);
  });

  it("generates a conversion-focused homepage from offer and content", () => {
    const input = buildStoreBlueprintInput();
    const blueprint = scoreStoreBlueprint(input);

    assert.equal(blueprint.homepage.pageType, "HOME");
    assert.match(blueprint.homepage.headline, /Elevate your kitchen blender experience/i);
    assert.match(blueprint.homepage.title, /Kitchen Blender Supply Co\./);
    assert.match(blueprint.homepage.body, /Quality you can ship today|Kitchen Blender Supply Co\./i);
    assert.equal(blueprint.homepage.productIds[0], input.offer.productId);
  });

  it("generates store navigation linking homepage, collections, and support pages", () => {
    const blueprint = scoreStoreBlueprint(buildStoreBlueprintInput());

    assert.equal(blueprint.navigation.storeName, "Kitchen Blender Supply Co.");
    assert.ok(blueprint.navigation.primaryLinks.some((link) => link.label === "Home"));
    assert.ok(blueprint.navigation.primaryLinks.some((link) => link.href === "/about"));
    assert.ok(blueprint.navigation.primaryLinks.some((link) => link.href === "/faq"));
    assert.ok(blueprint.navigation.primaryLinks.some((link) => link.href === "/contact"));
    assert.ok(
      blueprint.navigation.primaryLinks.some((link) => link.href.includes("/collections/")),
    );
    assert.ok(blueprint.navigation.footerLinks.length >= blueprint.navigation.primaryLinks.length);
  });

  it("generates collection pages from portfolio hero and bundle products", () => {
    const input = buildStoreBlueprintInput();
    const blueprint = scoreStoreBlueprint(input);

    assert.equal(blueprint.collectionPages.length, 3);
    assert.ok(blueprint.collectionPages.some((page) => page.slug === "hero-products"));
    assert.ok(blueprint.collectionPages.some((page) => page.slug === "bundle-products"));
    assert.ok(blueprint.collectionPages.some((page) => page.slug === "products"));

    const heroCollection = blueprint.collectionPages.find((page) => page.slug === "hero-products");
    assert.ok(heroCollection);
    assert.ok(heroCollection!.productIds.includes(input.offer.productId));
    assert.ok(heroCollection!.bullets.some((name) => /Kitchen Blender/i.test(name)));
  });

  it("calculates confidence from brand, portfolio, offer, and content inputs", () => {
    const highConfidence = scoreStoreBlueprint(
      buildStoreBlueprintInput({
        offerConfidence: 88,
        brandConfidence: 86,
        portfolioConfidence: 84,
      }),
    );
    const lowConfidence = scoreStoreBlueprint(
      buildStoreBlueprintInput({
        offerConfidence: 42,
        brandConfidence: 40,
        portfolioConfidence: 38,
      }),
    );

    assert.ok(highConfidence.confidence > lowConfidence.confidence);
    assert.ok(highConfidence.confidence >= 70);
    assert.ok(
      highConfidence.signals.some((signal) => signal.signalType === "store_composite"),
    );
  });

  it("persists generated store blueprints in the repository", async () => {
    const repository = createInMemoryStoreBlueprintRepository();
    const module = createStoreBlueprintModule(repository);
    const input = buildStoreBlueprintInput();

    const saved = await module.persistStoreBlueprint(WORKSPACE_ID, input);
    const loaded = await module.getStoreBlueprintByBrand(WORKSPACE_ID, input.brand.brandId);

    assert.ok(loaded);
    assert.equal(loaded!.storeId, saved.storeId);
    assert.equal(loaded!.homepage.headline, saved.homepage.headline);
    assert.equal(loaded!.navigation.storeName, saved.navigation.storeName);

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      brandId: input.brand.brandId,
    });
    assert.equal(listed.length, 1);
  });
});
