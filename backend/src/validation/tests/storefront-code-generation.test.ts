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
import { scoreStorefrontAssembly } from "../../execution/storefront-assembly/index.js";
import {
  createInMemoryCodeGenerationRepository,
  createStorefrontCodeGenerationModule,
  scoreStorefrontCodeGeneration,
} from "../../execution/storefront-code-generation/index.js";
import type { StorefrontCodeGenerationInput } from "../../execution/storefront-code-generation/index.js";

const WORKSPACE_ID = "ws-m054";

function buildPortfolioInput(brandId: string): BrandProductPortfolioInput {
  const heroProductId = "prod-m054-kitchen-blender";
  const accessoryProductId = "prod-m054-blender-pitcher";

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

function buildStorefrontCodeGenerationInput(
  overrides: {
    offerConfidence?: number;
    brandConfidence?: number;
    blueprintConfidence?: number;
    contentConfidence?: number;
    storefrontConfidence?: number;
  } = {},
): StorefrontCodeGenerationInput {
  const brandId = randomUUID();
  const offerId = randomUUID();
  const pageId = randomUUID();
  const storeId = randomUUID();
  const storefrontId = randomUUID();
  const productId = "prod-m054-kitchen-blender";

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

  const assembly = scoreStorefrontAssembly({
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
  });

  return {
    storefront: {
      storefrontId,
      storeId,
      brandId,
      routes: assembly.routes,
      navigation: assembly.navigation,
      assets: assembly.assets,
      pageMap: assembly.pageMap,
      seoMap: assembly.seoMap,
      confidence: overrides.storefrontConfidence ?? assembly.confidence,
    },
    pages: pageGeneration.pages.map((page) => ({
      pageId: page.pageId,
      route: page.route,
      pageType: page.pageType,
      title: page.title,
      metadata: page.metadata,
      sections: page.sections,
      renderPayload: page.renderPayload,
      confidence: page.confidence,
    })),
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

describe("Mission 054 Storefront Code Generation Engine", () => {
  it("generates a complete deployable storefront project structure", async () => {
    const module = createStorefrontCodeGenerationModule();
    const input = buildStorefrontCodeGenerationInput();
    const generated = await module.persistGeneratedStorefront(WORKSPACE_ID, input);

    assert.ok(generated.generatedStorefrontId);
    assert.equal(generated.storefrontId, input.storefront.storefrontId);
    assert.equal(generated.storeId, input.storefront.storeId);
    assert.ok(generated.generatedPages.length >= 6);
    assert.ok(generated.generatedComponents.length >= 8);
    assert.ok(generated.projectStructure.files.length >= 10);
    assert.equal(generated.projectStructure.framework, "next");
  });

  it("generates page files for all renderable storefront routes", () => {
    const input = buildStorefrontCodeGenerationInput();
    const generated = scoreStorefrontCodeGeneration(input);

    assert.ok(generated.generatedPages.some((page) => page.route === "/" && page.filePath === "src/pages/index.tsx"));
    assert.ok(generated.generatedPages.some((page) => page.filePath.startsWith("src/pages/products/")));
    assert.ok(generated.generatedPages.some((page) => page.filePath.startsWith("src/pages/collections/")));
    assert.ok(generated.generatedPages.some((page) => page.filePath === "src/pages/about.tsx"));
    assert.equal(generated.generatedPages.length, input.pages.length);
    assert.ok(
      generated.generatedPages.every((page) => page.sourceCode.includes("export default function")),
    );
  });

  it("generates reusable section and layout components", () => {
    const generated = scoreStorefrontCodeGeneration(buildStorefrontCodeGenerationInput());

    assert.ok(generated.generatedComponents.some((component) => component.componentName === "Layout"));
    assert.ok(generated.generatedComponents.some((component) => component.componentName === "Navigation"));
    assert.ok(generated.generatedComponents.some((component) => component.componentName === "HeroSection"));
    assert.ok(generated.generatedComponents.some((component) => component.componentName === "ProductGrid"));
    assert.ok(
      generated.generatedComponents.every((component) => component.sourceCode.includes("export function")),
    );
  });

  it("generates deployment metadata for the storefront project", () => {
    const input = buildStorefrontCodeGenerationInput();
    const generated = scoreStorefrontCodeGeneration(input);

    assert.equal(generated.deploymentMetadata.platform, "node");
    assert.equal(generated.deploymentMetadata.buildCommand, "npm run build");
    assert.equal(generated.deploymentMetadata.outputDirectory, ".next");
    assert.equal(generated.deploymentMetadata.envVars.NEXT_PUBLIC_STORE_ID, input.storefront.storeId);
    assert.equal(generated.deploymentMetadata.envVars.NEXT_PUBLIC_BRAND_NAME, "Kitchen Blender Supply Co.");
    assert.match(generated.deploymentMetadata.deployNotes, /Kitchen Blender Supply Co\./);
  });

  it("calculates confidence from storefront, pages, and brand alignment", () => {
    const highConfidence = scoreStorefrontCodeGeneration(
      buildStorefrontCodeGenerationInput({
        brandConfidence: 88,
        storefrontConfidence: 86,
        contentConfidence: 84,
      }),
    );
    const lowConfidence = scoreStorefrontCodeGeneration(
      buildStorefrontCodeGenerationInput({
        brandConfidence: 42,
        storefrontConfidence: 40,
        contentConfidence: 38,
      }),
    );

    assert.ok(highConfidence.confidence > lowConfidence.confidence);
    assert.ok(highConfidence.confidence >= 70);
    assert.ok(
      highConfidence.signals.some((signal) => signal.signalType === "code_generation_composite"),
    );
  });

  it("persists generated storefront code in the repository", async () => {
    const repository = createInMemoryCodeGenerationRepository();
    const module = createStorefrontCodeGenerationModule(repository);
    const input = buildStorefrontCodeGenerationInput();

    const saved = await module.persistGeneratedStorefront(WORKSPACE_ID, input);
    const loadedByAssembly = await module.getGeneratedStorefrontByAssembly(
      WORKSPACE_ID,
      input.storefront.storefrontId,
    );
    const loadedByStore = await module.getGeneratedStorefrontByStore(
      WORKSPACE_ID,
      input.storefront.storeId,
    );

    assert.ok(loadedByAssembly);
    assert.ok(loadedByStore);
    assert.equal(loadedByAssembly!.generatedStorefrontId, saved.generatedStorefrontId);
    assert.equal(loadedByStore!.generatedPages.length, saved.generatedPages.length);
    assert.equal(loadedByStore!.projectStructure.rootDirectory, saved.projectStructure.rootDirectory);

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      brandId: input.brand.brandId,
    });
    assert.equal(listed.length, 1);
  });
});
