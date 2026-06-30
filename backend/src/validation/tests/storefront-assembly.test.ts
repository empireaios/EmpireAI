import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import { scoreBrandProductPortfolio } from "../../execution/brand-product-portfolio/index.js";
import type { BrandProductPortfolioInput } from "../../execution/brand-product-portfolio/index.js";
import { scoreLandingPageBlueprint } from "../../execution/landing-page-blueprint/index.js";
import type { LandingPageBlueprintInput } from "../../execution/landing-page-blueprint/index.js";
import { scoreLandingPageContent } from "../../execution/landing-page-content-generation/index.js";
import type { LandingPageContentInput } from "../../execution/landing-page-content-generation/index.js";
import { scoreStoreBlueprint } from "../../execution/store-blueprint/index.js";
import type { StoreBlueprintInput } from "../../execution/store-blueprint/index.js";
import { scoreStorePageGeneration } from "../../execution/store-page-generation/index.js";
import {
  createInMemoryStorefrontRepository,
  createStorefrontAssemblyModule,
  scoreStorefrontAssembly,
} from "../../execution/storefront-assembly/index.js";
import type { StorefrontAssemblyInput } from "../../execution/storefront-assembly/index.js";

const WORKSPACE_ID = "ws-m053";

function buildPortfolioInput(brandId: string): BrandProductPortfolioInput {
  const heroProductId = "prod-m053-kitchen-blender";
  const accessoryProductId = "prod-m053-blender-pitcher";

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

function buildStorefrontAssemblyInput(
  overrides: {
    offerConfidence?: number;
    brandConfidence?: number;
    blueprintConfidence?: number;
    contentConfidence?: number;
  } = {},
): StorefrontAssemblyInput {
  const brandId = randomUUID();
  const offerId = randomUUID();
  const pageId = randomUUID();
  const storeId = randomUUID();
  const productId = "prod-m053-kitchen-blender";

  const portfolioInput = buildPortfolioInput(brandId);
  const portfolio = scoreBrandProductPortfolio(portfolioInput);
  const landingInput = buildLandingInputs(brandId, offerId, productId, overrides);
  const landingBlueprint = scoreLandingPageBlueprint(landingInput);

  const contentInput: LandingPageContentInput = {
    blueprint: {
      pageId,
      offerId: landingBlueprint.offerId,
      brandId: landingBlueprint.brandId,
      productId: landingBlueprint.productId,
      pageTitle: landingBlueprint.pageTitle,
      heroSection: landingBlueprint.heroSection,
      problemSection: landingBlueprint.problemSection,
      solutionSection: landingBlueprint.solutionSection,
      benefitsSection: landingBlueprint.benefitsSection,
      offerSection: landingBlueprint.offerSection,
      socialProofSection: landingBlueprint.socialProofSection,
      faqSection: landingBlueprint.faqSection,
      ctaSection: landingBlueprint.ctaSection,
      confidence: landingBlueprint.confidence,
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

  const storeBlueprintInput: StoreBlueprintInput = {
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
      confidence: portfolio.confidence,
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

  const blueprint = scoreStoreBlueprint(storeBlueprintInput);
  const pageGeneration = scoreStorePageGeneration({
    blueprint: {
      storeId,
      brandId,
      homepage: blueprint.homepage,
      collectionPages: blueprint.collectionPages,
      productPages: blueprint.productPages,
      aboutPage: blueprint.aboutPage,
      faqPage: blueprint.faqPage,
      contactPage: blueprint.contactPage,
      navigation: blueprint.navigation,
      confidence: overrides.blueprintConfidence ?? blueprint.confidence,
    },
    content: {
      pageId,
      brandId,
      productId,
      heroCopy: content.heroCopy,
      problemCopy: content.problemCopy,
      solutionCopy: content.solutionCopy,
      benefitsCopy: content.benefitsCopy,
      offerCopy: content.offerCopy,
      socialProofCopy: content.socialProofCopy,
      faqCopy: content.faqCopy,
      ctaCopy: content.ctaCopy,
      confidence: overrides.contentConfidence ?? content.confidence,
    },
  });

  return {
    pages: pageGeneration.pages.map((page) => ({
      pageId: page.pageId,
      route: page.route,
      pageType: page.pageType,
      title: page.title,
      metadata: page.metadata,
      confidence: page.confidence,
      renderPayload: page.renderPayload,
    })),
    blueprint: {
      storeId,
      brandId,
      navigation: blueprint.navigation,
      confidence: overrides.blueprintConfidence ?? blueprint.confidence,
    },
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
  };
}

describe("Mission 053 Storefront Assembly Engine", () => {
  it("assembles a complete deployable storefront from pages, blueprint, and brand", async () => {
    const module = createStorefrontAssemblyModule();
    const input = buildStorefrontAssemblyInput();
    const storefront = await module.persistStorefront(WORKSPACE_ID, input);

    assert.ok(storefront.storefrontId);
    assert.equal(storefront.storeId, input.blueprint.storeId);
    assert.equal(storefront.brandId, input.brand.brandId);
    assert.ok(storefront.routes.length >= 6);
    assert.ok(storefront.assets.length >= 5);
    assert.equal(Object.keys(storefront.pageMap).length, input.pages.length);
    assert.equal(Object.keys(storefront.seoMap).length, input.pages.length);
  });

  it("generates deployable routes for all renderable store pages", () => {
    const input = buildStorefrontAssemblyInput();
    const storefront = scoreStorefrontAssembly(input);

    assert.ok(storefront.routes.some((route) => route.path === "/" && route.pageType === "HOME"));
    assert.ok(storefront.routes.some((route) => route.path.startsWith("/products/")));
    assert.ok(storefront.routes.some((route) => route.path.startsWith("/collections/")));
    assert.ok(storefront.routes.some((route) => route.path === "/about"));
    assert.ok(storefront.routes.some((route) => route.path === "/faq"));
    assert.ok(storefront.routes.some((route) => route.path === "/contact"));
    assert.equal(storefront.pageMap["/"], input.pages.find((page) => page.route === "/")!.pageId);
  });

  it("generates storefront navigation from blueprint and brand", () => {
    const storefront = scoreStorefrontAssembly(buildStorefrontAssemblyInput());

    assert.equal(storefront.navigation.storeName, "Kitchen Blender Supply Co.");
    assert.ok(storefront.navigation.primaryLinks.some((link) => link.label === "Home"));
    assert.ok(storefront.navigation.primaryLinks.some((link) => link.href === "/about"));
    assert.ok(storefront.navigation.footerLinks.length >= storefront.navigation.primaryLinks.length);
  });

  it("generates brand-aligned storefront assets for deployment", () => {
    const input = buildStorefrontAssemblyInput();
    const storefront = scoreStorefrontAssembly(input);

    assert.ok(storefront.assets.some((asset) => asset.assetType === "LOGO"));
    assert.ok(storefront.assets.some((asset) => asset.assetType === "FAVICON"));
    assert.ok(storefront.assets.some((asset) => asset.assetType === "THEME"));
    assert.ok(storefront.assets.some((asset) => asset.assetType === "STYLE"));
    assert.ok(
      storefront.assets.every((asset) => asset.path.includes(input.blueprint.storeId)),
    );
    assert.ok(
      storefront.assets.some((asset) => /kitchen-blender-supply-co/i.test(asset.path)),
    );
  });

  it("calculates confidence from pages, blueprint, and brand alignment", () => {
    const highConfidence = scoreStorefrontAssembly(
      buildStorefrontAssemblyInput({
        brandConfidence: 88,
        blueprintConfidence: 86,
        contentConfidence: 84,
      }),
    );
    const lowConfidence = scoreStorefrontAssembly(
      buildStorefrontAssemblyInput({
        brandConfidence: 42,
        blueprintConfidence: 40,
        contentConfidence: 38,
      }),
    );

    assert.ok(highConfidence.confidence > lowConfidence.confidence);
    assert.ok(highConfidence.confidence >= 70);
    assert.ok(
      highConfidence.signals.some((signal) => signal.signalType === "storefront_composite"),
    );
  });

  it("persists assembled storefronts in the repository", async () => {
    const repository = createInMemoryStorefrontRepository();
    const module = createStorefrontAssemblyModule(repository);
    const input = buildStorefrontAssemblyInput();

    const saved = await module.persistStorefront(WORKSPACE_ID, input);
    const loadedByStore = await module.getStorefrontByStore(
      WORKSPACE_ID,
      input.blueprint.storeId,
    );
    const loadedByBrand = await module.getStorefrontByBrand(WORKSPACE_ID, input.brand.brandId);

    assert.ok(loadedByStore);
    assert.ok(loadedByBrand);
    assert.equal(loadedByStore!.storefrontId, saved.storefrontId);
    assert.equal(loadedByBrand!.routes.length, saved.routes.length);
    assert.equal(loadedByStore!.pageMap["/"], saved.pageMap["/"]);

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      brandId: input.brand.brandId,
    });
    assert.equal(listed.length, 1);
  });
});
