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
import { scoreStorefrontArtifactGeneration } from "../../execution/storefront-artifact-generation/index.js";
import type { StorefrontArtifactGenerationInput } from "../../execution/storefront-artifact-generation/index.js";
import {
  createInMemoryMaterializationRepository,
  createProjectMaterializationModule,
  scoreProjectMaterialization,
} from "../../execution/project-materialization/index.js";
import type { ProjectMaterializationInput } from "../../execution/project-materialization/index.js";

const WORKSPACE_ID = "ws-m056";

function buildPortfolioInput(brandId: string): BrandProductPortfolioInput {
  const heroProductId = "prod-m056-kitchen-blender";
  const accessoryProductId = "prod-m056-blender-pitcher";

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

function buildStorefrontCodeGenerationInput(): StorefrontCodeGenerationInput {
  const brandId = randomUUID();
  const offerId = randomUUID();
  const pageId = randomUUID();
  const storeId = randomUUID();
  const storefrontId = randomUUID();
  const productId = "prod-m056-kitchen-blender";

  const portfolio = scoreBrandProductPortfolio(buildPortfolioInput(brandId));
  const landingInput = buildLandingInputs(brandId, offerId, productId);
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
      confidence: landingInput.brand.confidence,
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
      confidence: landingInput.offer.confidence,
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
      confidence: blueprint.confidence,
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
      confidence: content.confidence,
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
    blueprint: { storeId, brandId, navigation: blueprint.navigation, confidence: blueprint.confidence },
    brand: {
      brandId,
      brandName: landingInput.brand.brandName,
      slogan: landingInput.brand.slogan,
      niche: landingInput.brand.niche,
      targetAudience: landingInput.brand.targetAudience,
      positioning: landingInput.brand.positioning,
      valueProposition: landingInput.offer.valueProposition,
      confidence: landingInput.brand.confidence,
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
      confidence: assembly.confidence,
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
      confidence: landingInput.brand.confidence,
    },
  };
}

function buildArtifactGenerationInput(): StorefrontArtifactGenerationInput {
  const codeInput = buildStorefrontCodeGenerationInput();
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
      confidence: codeGen.confidence,
    },
  };
}

function buildProjectMaterializationInput(
  overrides: { artifactConfidence?: number } = {},
): ProjectMaterializationInput {
  const artifactResult = scoreStorefrontArtifactGeneration(buildArtifactGenerationInput());

  return {
    artifacts: artifactResult.artifacts.map((artifact) => ({
      artifactId: randomUUID(),
      generatedStorefrontId: artifactResult.generatedStorefrontId,
      filePath: artifact.filePath,
      fileType: artifact.fileType,
      generatedContent: artifact.generatedContent,
      metadata: artifact.metadata,
      confidence: overrides.artifactConfidence ?? artifact.confidence,
    })),
  };
}

describe("Mission 056 Project Materialization Engine", () => {
  it("generates a materialized project structure from storefront artifacts", async () => {
    const module = createProjectMaterializationModule();
    const input = buildProjectMaterializationInput();
    const project = await module.persistMaterializedProject(WORKSPACE_ID, input);

    assert.ok(project.projectId);
    assert.equal(project.generatedStorefrontId, input.artifacts[0]!.generatedStorefrontId);
    assert.ok(project.projectStructure.rootDirectory.includes(input.artifacts[0]!.metadata.storeId));
    assert.equal(project.projectStructure.files.length, input.artifacts.length);
    assert.ok(project.projectStructure.directories.includes("src/pages"));
  });

  it("maps dependencies between page and component materialized files", () => {
    const project = scoreProjectMaterialization(buildProjectMaterializationInput());
    const homepageDeps = project.dependencyMap["src/pages/index.tsx"];

    assert.ok(homepageDeps);
    assert.ok(homepageDeps.some((dep) => dep.startsWith("src/components/")));
    assert.ok(Object.keys(project.dependencyMap).length >= project.materializedFiles.length);
  });

  it("materializes artifact content into ready project files", () => {
    const input = buildProjectMaterializationInput();
    const project = scoreProjectMaterialization(input);
    const homepage = project.materializedFiles.find(
      (file) => file.relativePath === "src/pages/index.tsx",
    );

    assert.ok(homepage);
    assert.equal(homepage!.status, "READY");
    assert.match(homepage!.absolutePath, /storefronts\//);
    assert.match(homepage!.content, /export default function/);
    assert.equal(project.materializedFiles.length, input.artifacts.length);
  });

  it("generates build metadata from deployment artifacts", () => {
    const project = scoreProjectMaterialization(buildProjectMaterializationInput());

    assert.equal(project.buildMetadata.platform, "node");
    assert.equal(project.buildMetadata.buildCommand, "npm run build");
    assert.ok(project.buildMetadata.envVars.NEXT_PUBLIC_STORE_ID);
    assert.match(project.buildMetadata.materializationNotes, /Materialized/);
  });

  it("calculates confidence from artifact alignment and materialization quality", () => {
    const highConfidence = scoreProjectMaterialization(
      buildProjectMaterializationInput({ artifactConfidence: 88 }),
    );
    const lowConfidence = scoreProjectMaterialization(
      buildProjectMaterializationInput({ artifactConfidence: 42 }),
    );

    assert.ok(highConfidence.confidence > lowConfidence.confidence);
    assert.ok(highConfidence.confidence >= 70);
    assert.ok(
      highConfidence.signals.some((signal) => signal.signalType === "materialization_composite"),
    );
  });

  it("persists materialized projects in the repository", async () => {
    const repository = createInMemoryMaterializationRepository();
    const module = createProjectMaterializationModule(repository);
    const input = buildProjectMaterializationInput();

    const saved = await module.persistMaterializedProject(WORKSPACE_ID, input);
    const loadedByStorefront = await module.getMaterializedProjectByStorefront(
      WORKSPACE_ID,
      input.artifacts[0]!.generatedStorefrontId,
    );
    const loadedByStore = await module.getMaterializedProjectByStore(
      WORKSPACE_ID,
      input.artifacts[0]!.metadata.storeId,
    );

    assert.ok(loadedByStorefront);
    assert.ok(loadedByStore);
    assert.equal(loadedByStorefront!.projectId, saved.projectId);
    assert.equal(loadedByStore!.materializedFiles.length, saved.materializedFiles.length);

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      brandId: input.artifacts[0]!.metadata.brandId,
    });
    assert.equal(listed.length, 1);
  });
});
