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
import {
  createInMemoryStorePageRepository,
  createStorePageGenerationModule,
  scoreStorePageGeneration,
} from "../../execution/store-page-generation/index.js";
import type { StorePageGenerationInput } from "../../execution/store-page-generation/index.js";

const WORKSPACE_ID = "ws-m052";

function buildPortfolioInput(brandId: string): BrandProductPortfolioInput {
  const heroProductId = "prod-m052-kitchen-blender";
  const accessoryProductId = "prod-m052-blender-pitcher";

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

function buildStorePageGenerationInput(
  overrides: {
    offerConfidence?: number;
    brandConfidence?: number;
    blueprintConfidence?: number;
    contentConfidence?: number;
  } = {},
): StorePageGenerationInput {
  const brandId = randomUUID();
  const offerId = randomUUID();
  const pageId = randomUUID();
  const storeId = randomUUID();
  const productId = "prod-m052-kitchen-blender";

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

  return {
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
  };
}

describe("Mission 052 Store Page Generation Engine", () => {
  it("generates a renderable homepage from blueprint and landing page content", () => {
    const input = buildStorePageGenerationInput();
    const result = scoreStorePageGeneration(input);
    const homepage = result.pages.find((page) => page.pageType === "HOME");

    assert.ok(homepage);
    assert.equal(homepage!.route, "/");
    assert.match(homepage!.title, /Kitchen Blender Supply Co\./);
    assert.ok(homepage!.sections.some((section) => section.sectionType === "HERO"));
    assert.ok(homepage!.sections.some((section) => section.sectionType === "CTA"));
    assert.match(String(homepage!.renderPayload.layout), /home/);
  });

  it("generates renderable product pages with hero product content enrichment", () => {
    const input = buildStorePageGenerationInput();
    const result = scoreStorePageGeneration(input);
    const heroProductPage = result.pages.find(
      (page) =>
        page.pageType === "PRODUCT" &&
        page.renderPayload.page &&
        (page.renderPayload.page as { productIds: string[] }).productIds.includes(
          input.content.productId,
        ),
    );

    assert.ok(heroProductPage);
    assert.match(heroProductPage!.route, /^\/products\//);
    assert.ok(heroProductPage!.sections.some((section) => section.sectionType === "CTA"));
    assert.match(heroProductPage!.sections[0]!.body, /Why this offer wins|Premium positioning/i);
  });

  it("generates renderable collection pages with product grid sections", () => {
    const result = scoreStorePageGeneration(buildStorePageGenerationInput());
    const collectionPages = result.pages.filter((page) => page.pageType === "COLLECTION");

    assert.ok(collectionPages.length >= 3);
    assert.ok(collectionPages.every((page) => page.route.startsWith("/collections/")));
    assert.ok(
      collectionPages.every((page) =>
        page.sections.some((section) => section.sectionType === "PRODUCT_GRID"),
      ),
    );
    assert.ok(collectionPages.some((page) => page.route.includes("hero-products")));
  });

  it("generates SEO metadata for each renderable page", () => {
    const result = scoreStorePageGeneration(buildStorePageGenerationInput());

    assert.ok(result.pages.length >= 6);
    for (const page of result.pages) {
      assert.ok(page.metadata.description.length > 0);
      assert.ok(page.metadata.keywords.length >= 2);
      assert.equal(page.metadata.ogTitle, page.title);
      assert.ok(page.metadata.ogDescription.length > 0);
    }
  });

  it("calculates confidence from blueprint and content alignment", () => {
    const highConfidence = scoreStorePageGeneration(
      buildStorePageGenerationInput({
        blueprintConfidence: 88,
        contentConfidence: 86,
      }),
    );
    const lowConfidence = scoreStorePageGeneration(
      buildStorePageGenerationInput({
        blueprintConfidence: 42,
        contentConfidence: 40,
      }),
    );

    const highHome = highConfidence.pages.find((page) => page.pageType === "HOME")!;
    const lowHome = lowConfidence.pages.find((page) => page.pageType === "HOME")!;

    assert.ok(highHome.confidence > lowHome.confidence);
    assert.ok(highHome.confidence >= 70);
    assert.ok(highHome.signals.some((signal) => signal.signalType === "page_composite"));
  });

  it("persists generated renderable pages in the repository", async () => {
    const repository = createInMemoryStorePageRepository();
    const module = createStorePageGenerationModule(repository);
    const input = buildStorePageGenerationInput();

    const saved = await module.persistStorePages(WORKSPACE_ID, input);
    assert.ok(saved.length >= 6);

    const homepage = saved.find((page) => page.pageType === "HOME")!;
    const loadedByRoute = await module.getPageByRoute(WORKSPACE_ID, "/");
    const loadedByPage = await module.getPageByBlueprintPage(
      WORKSPACE_ID,
      input.blueprint.homepage.pageId,
    );

    assert.ok(loadedByRoute);
    assert.ok(loadedByPage);
    assert.equal(loadedByRoute!.renderablePageId, homepage.renderablePageId);
    assert.equal(loadedByPage!.route, "/");

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      storeId: input.blueprint.storeId,
    });
    assert.equal(listed.length, saved.length);
  });
});
