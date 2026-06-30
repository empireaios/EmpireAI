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
import { scoreStorefrontCodeGeneration } from "../../execution/storefront-code-generation/index.js";
import type { StorefrontCodeGenerationInput } from "../../execution/storefront-code-generation/index.js";
import {
  createInMemoryArtifactRepository,
  createStorefrontArtifactGenerationModule,
  scoreStorefrontArtifactGeneration,
} from "../../execution/storefront-artifact-generation/index.js";
import type { StorefrontArtifactGenerationInput } from "../../execution/storefront-artifact-generation/index.js";

const WORKSPACE_ID = "ws-m055";

function buildPortfolioInput(brandId: string): BrandProductPortfolioInput {
  const heroProductId = "prod-m055-kitchen-blender";
  const accessoryProductId = "prod-m055-blender-pitcher";

  return {
    brand: {
      brandId,
      productId: heroProductId,
      brandName: "Kitchen Blender Supply Co.",
      niche: "Curated ecommerce essentials",
      recommendedProducts: ["Kitchen Blender", "Starter bundle kit"],
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
  overrides: { offerConfidence?: number; brandConfidence?: number } = {},
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
        "Kitchen Blender delivers premium positioning for curated ecommerce essentials.",
      keyBenefits: ["Premium positioning buyers trust immediately"],
      keyFeatures: ["High-performance kitchen blender for everyday use"],
      customerProblem: "Buyers struggle to find products that feel premium and trustworthy",
      customerOutcome: "Shoppers get a polished, high-confidence purchase they feel proud to own",
      callToAction: "Shop the premium offer",
      confidence: overrides.offerConfidence ?? 82,
    },
    brand: {
      brandId,
      brandName: "Kitchen Blender Supply Co.",
      slogan: "Quality you can ship today",
      niche: "Curated ecommerce essentials",
      targetAudience: "Online shoppers seeking fast, reliable product discovery",
      positioning: "Trusted direct-to-consumer category leader",
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
  const productId = "prod-m055-kitchen-blender";

  const portfolio = scoreBrandProductPortfolio(buildPortfolioInput(brandId));
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
    offer: { ...landingInput.offer, valueProposition: landingInput.offer.valueProposition },
    brand: { ...landingInput.brand, valueProposition: landingInput.offer.valueProposition },
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

function buildArtifactGenerationInput(
  overrides: {
    offerConfidence?: number;
    brandConfidence?: number;
    codeConfidence?: number;
  } = {},
): StorefrontArtifactGenerationInput {
  const codeInput = buildStorefrontCodeGenerationInput(overrides);
  const codeGen = scoreStorefrontCodeGeneration(codeInput);

  return {
    codeGeneration: {
      generatedStorefrontId: randomUUID(),
      storefrontId: codeInput.storefront.storefrontId,
      storeId: codeGen.storeId,
      brandId: codeGen.brandId,
      generatedPages: codeGen.generatedPages,
      generatedComponents: codeGen.generatedComponents,
      projectStructure: codeGen.projectStructure,
      deploymentMetadata: codeGen.deploymentMetadata,
      confidence: overrides.codeConfidence ?? codeGen.confidence,
    },
  };
}

describe("Mission 055 Storefront Artifact Generation Engine", () => {
  it("generates page artifacts from storefront code generation outputs", () => {
    const result = scoreStorefrontArtifactGeneration(buildArtifactGenerationInput());
    const pageArtifacts = result.artifacts.filter((artifact) => artifact.fileType === "PAGE");

    assert.ok(pageArtifacts.length >= 6);
    assert.ok(pageArtifacts.some((artifact) => artifact.filePath === "src/pages/index.tsx"));
    assert.ok(
      pageArtifacts.every((artifact) => artifact.generatedContent.includes("export default function")),
    );
  });

  it("generates component artifacts for shared storefront components", () => {
    const result = scoreStorefrontArtifactGeneration(buildArtifactGenerationInput());
    const componentArtifacts = result.artifacts.filter(
      (artifact) => artifact.fileType === "COMPONENT",
    );

    assert.ok(componentArtifacts.length >= 8);
    assert.ok(
      componentArtifacts.some((artifact) => artifact.filePath === "src/components/Layout.tsx"),
    );
    assert.ok(
      componentArtifacts.some((artifact) => artifact.filePath === "src/components/HeroSection.tsx"),
    );
  });

  it("generates a route manifest artifact for all storefront pages", () => {
    const input = buildArtifactGenerationInput();
    const result = scoreStorefrontArtifactGeneration(input);
    const routeArtifact = result.artifacts.find((artifact) => artifact.fileType === "ROUTE");

    assert.ok(routeArtifact);
    assert.equal(routeArtifact!.filePath, "src/routes.json");
    assert.match(routeArtifact!.generatedContent, /"routes"/);
    assert.match(routeArtifact!.generatedContent, /"route": "\/"/);
    assert.equal(
      JSON.parse(routeArtifact!.generatedContent).routes.length,
      input.codeGeneration.generatedPages.length,
    );
  });

  it("generates metadata artifacts for deployment and project docs", () => {
    const result = scoreStorefrontArtifactGeneration(buildArtifactGenerationInput());
    const metadataArtifacts = result.artifacts.filter(
      (artifact) => artifact.fileType === "METADATA",
    );

    assert.ok(metadataArtifacts.length >= 2);
    assert.ok(metadataArtifacts.some((artifact) => artifact.filePath === "deployment.json"));
    assert.ok(metadataArtifacts.some((artifact) => artifact.filePath === "README.md"));
    assert.ok(
      metadataArtifacts.some((artifact) =>
        artifact.generatedContent.includes("Kitchen Blender Supply Co."),
      ),
    );
  });

  it("calculates confidence from code generation alignment and artifact quality", () => {
    const highConfidence = scoreStorefrontArtifactGeneration(
      buildArtifactGenerationInput({ codeConfidence: 88, brandConfidence: 86 }),
    );
    const lowConfidence = scoreStorefrontArtifactGeneration(
      buildArtifactGenerationInput({ codeConfidence: 42, brandConfidence: 40 }),
    );

    const highPage = highConfidence.artifacts.find((artifact) => artifact.fileType === "PAGE")!;
    const lowPage = lowConfidence.artifacts.find((artifact) => artifact.fileType === "PAGE")!;

    assert.ok(highPage.confidence > lowPage.confidence);
    assert.ok(highPage.confidence >= 70);
    assert.ok(highPage.signals.some((signal) => signal.signalType === "artifact_composite"));
  });

  it("persists generated artifacts in the repository", async () => {
    const repository = createInMemoryArtifactRepository();
    const module = createStorefrontArtifactGenerationModule(repository);
    const input = buildArtifactGenerationInput();

    const saved = await module.persistArtifacts(WORKSPACE_ID, input);
    assert.ok(saved.length >= 10);

    const homepage = saved.find((artifact) => artifact.filePath === "src/pages/index.tsx")!;
    const loaded = await module.getArtifactByFilePath(
      WORKSPACE_ID,
      input.codeGeneration.generatedStorefrontId,
      "src/pages/index.tsx",
    );

    assert.ok(loaded);
    assert.equal(loaded!.artifactId, homepage.artifactId);
    assert.equal(loaded!.generatedContent, homepage.generatedContent);

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      generatedStorefrontId: input.codeGeneration.generatedStorefrontId,
    });
    assert.equal(listed.length, saved.length);
  });
});
