import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import { HOSTING_TARGETS, scoreDeploymentBlueprint } from "../../execution/deployment-blueprint/index.js";
import type { HostingTarget } from "../../execution/deployment-blueprint/index.js";
import { scoreProjectMaterialization } from "../../execution/project-materialization/index.js";
import {
  createInMemoryStoreDeploymentPipelineRepository,
  createStoreDeploymentPipelineModule,
  scoreStoreDeploymentPipeline,
} from "../../execution/store-deployment-pipeline/index.js";
import type { StoreDeploymentPipelineInput } from "../../execution/store-deployment-pipeline/index.js";
import { scoreStorefrontArtifactGeneration } from "../../execution/storefront-artifact-generation/index.js";
import type { StorefrontArtifactGenerationInput } from "../../execution/storefront-artifact-generation/index.js";
import { scoreStorefrontCodeGeneration } from "../../execution/storefront-code-generation/index.js";
import type { StorefrontCodeGenerationInput } from "../../execution/storefront-code-generation/index.js";
import { scoreStorefrontAssembly } from "../../execution/storefront-assembly/index.js";
import { scoreStorePageGeneration } from "../../execution/store-page-generation/index.js";
import { scoreStoreBlueprint } from "../../execution/store-blueprint/index.js";
import type { StoreBlueprintInput } from "../../execution/store-blueprint/index.js";
import { scoreLandingPageContent } from "../../execution/landing-page-content-generation/index.js";
import type { LandingPageContentInput } from "../../execution/landing-page-content-generation/index.js";
import { scoreLandingPageBlueprint } from "../../execution/landing-page-blueprint/index.js";
import type { LandingPageBlueprintInput } from "../../execution/landing-page-blueprint/index.js";
import { scoreBrandProductPortfolio } from "../../execution/brand-product-portfolio/index.js";
import type { BrandProductPortfolioInput } from "../../execution/brand-product-portfolio/index.js";

const WORKSPACE_ID = "ws-m065";

function buildPortfolioInput(brandId: string): BrandProductPortfolioInput {
  const heroProductId = "prod-m065-kitchen-blender";

  return {
    brand: {
      brandId,
      productId: heroProductId,
      brandName: "Kitchen Blender Supply Co.",
      niche: "Curated ecommerce essentials",
      recommendedProducts: ["Kitchen Blender"],
      confidence: 80,
    },
    heroProduct: {
      id: heroProductId,
      displayName: "Kitchen Blender",
      categoryId: "cat-kitchen-appliances",
      confidence: 84,
      tags: ["kitchen", "blender", "hero"],
    },
    relatedProducts: [],
    relationships: [],
    opportunities: [
      {
        productId: heroProductId,
        opportunityScore: 86,
        opportunityTier: "high",
        confidence: 82,
        strengths: ["Strong buyer demand"],
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
    ],
  };
}

function buildLandingInputs(brandId: string, offerId: string, productId: string): LandingPageBlueprintInput {
  return {
    offer: {
      offerId,
      brandId,
      productId,
      offerStyle: "PREMIUM",
      offerTitle: "Premium Kitchen Blender Offer",
      headline: "Elevate your kitchen blender experience with Kitchen Blender Supply Co.",
      valueProposition: "Kitchen Blender delivers premium positioning for curated ecommerce essentials.",
      keyBenefits: ["Premium positioning buyers trust immediately"],
      keyFeatures: ["High-performance kitchen blender for everyday use"],
      customerProblem: "Buyers struggle to find products that feel premium and trustworthy",
      customerOutcome: "Shoppers get a polished, high-confidence purchase they feel proud to own",
      callToAction: "Shop the premium offer",
      confidence: 82,
    },
    brand: {
      brandId,
      brandName: "Kitchen Blender Supply Co.",
      slogan: "Quality you can ship today",
      niche: "Curated ecommerce essentials",
      targetAudience: "Online shoppers seeking fast, reliable product discovery",
      positioning: "Trusted direct-to-consumer category leader",
      confidence: 80,
    },
  };
}

function buildStorefrontCodeGenerationInput(): StorefrontCodeGenerationInput {
  const brandId = randomUUID();
  const offerId = randomUUID();
  const pageId = randomUUID();
  const storeId = randomUUID();
  const storefrontId = randomUUID();
  const productId = "prod-m065-kitchen-blender";

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

function buildMaterializedProjectInput() {
  const codeInput = buildStorefrontCodeGenerationInput();
  const codeGen = scoreStorefrontCodeGeneration(codeInput);
  const artifactResult = scoreStorefrontArtifactGeneration({
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
  } satisfies StorefrontArtifactGenerationInput);

  return {
    artifacts: artifactResult.artifacts.map((artifact) => ({
      artifactId: randomUUID(),
      generatedStorefrontId: artifactResult.generatedStorefrontId,
      filePath: artifact.filePath,
      fileType: artifact.fileType,
      generatedContent: artifact.generatedContent,
      metadata: artifact.metadata,
      confidence: artifact.confidence,
    })),
  };
}

function buildPipelineInput(
  overrides: {
    preferredHostingTarget?: HostingTarget;
    misaligned?: boolean;
  } = {},
): StoreDeploymentPipelineInput {
  const materialized = scoreProjectMaterialization(buildMaterializedProjectInput());
  const projectId = randomUUID();
  const planBreakdown = scoreDeploymentBlueprint({
    project: {
      projectId,
      generatedStorefrontId: materialized.generatedStorefrontId,
      storeId: materialized.storeId,
      brandId: materialized.brandId,
      projectStructure: materialized.projectStructure,
      buildMetadata: materialized.buildMetadata,
      confidence: materialized.confidence,
    },
    ...(overrides.preferredHostingTarget
      ? { preferredHostingTarget: overrides.preferredHostingTarget }
      : {}),
  });

  return {
    deploymentPlan: {
      deploymentPlanId: randomUUID(),
      projectId: overrides.misaligned ? randomUUID() : projectId,
      generatedStorefrontId: materialized.generatedStorefrontId,
      storeId: materialized.storeId,
      brandId: materialized.brandId,
      framework: planBreakdown.framework,
      hostingTarget: planBreakdown.hostingTarget,
      environmentVariables: planBreakdown.environmentVariables,
      domainRequirements: planBreakdown.domainRequirements,
      deploymentSteps: planBreakdown.deploymentSteps,
      confidence: planBreakdown.confidence,
    },
    project: {
      projectId,
      generatedStorefrontId: materialized.generatedStorefrontId,
      storeId: materialized.storeId,
      brandId: materialized.brandId,
      projectStructure: materialized.projectStructure,
      materializedFiles: materialized.materializedFiles,
      buildMetadata: materialized.buildMetadata,
      confidence: materialized.confidence,
    },
  };
}

describe("Mission 065 Store Deployment Pipeline", () => {
  it("creates a deployment package with required output fields", async () => {
    const module = createStoreDeploymentPipelineModule();
    const input = buildPipelineInput();
    const record = await module.persistDeploymentPackage(WORKSPACE_ID, input);

    assert.ok(record.deploymentPackage.packageId);
    assert.ok(record.deploymentPackage.packageRoot.includes("deployment-packages"));
    assert.ok(record.deploymentArtifacts.length >= 3);
    assert.equal(record.deploymentStatus, "PACKAGE_CREATED");
    assert.equal(record.deploymentMetadata.executionMode, "PACKAGE_ONLY");
    assert.ok(record.confidence >= 70);
    assert.ok(record.signals.some((signal) => signal.signalType === "pipeline_composite"));
  });

  it("connects deployment plan metadata to materialized storefront source artifacts", () => {
    const input = buildPipelineInput();
    const record = scoreStoreDeploymentPipeline(input);

    assert.equal(record.deploymentMetadata.projectId, input.project.projectId);
    assert.equal(
      record.deploymentMetadata.generatedStorefrontId,
      input.project.generatedStorefrontId,
    );
    assert.equal(record.deploymentMetadata.stepCount, input.deploymentPlan.deploymentSteps.length);
    assert.ok(
      record.deploymentArtifacts.some(
        (artifact) => artifact.artifactType === "SOURCE" && artifact.filePath.includes("src/"),
      ),
    );
    assert.ok(
      record.deploymentArtifacts.some((artifact) => artifact.filePath === "deployment.manifest.json"),
    );
  });

  it("generates hosting-specific config artifacts for each deployment target", () => {
    const expectedConfigFiles: Record<HostingTarget, string> = {
      VERCEL: "vercel.json",
      DOCKER: "Dockerfile",
      VPS: "deploy.sh",
      STATIC_EXPORT: "static-export.config.json",
    };

    for (const hostingTarget of HOSTING_TARGETS) {
      const record = scoreStoreDeploymentPipeline(
        buildPipelineInput({ preferredHostingTarget: hostingTarget }),
      );

      assert.equal(record.deploymentPackage.hostingTarget, hostingTarget);
      assert.ok(
        record.deploymentArtifacts.some(
          (artifact) => artifact.filePath === expectedConfigFiles[hostingTarget],
        ),
      );
    }
  });

  it("packages environment variables without executing production deployment", () => {
    const record = scoreStoreDeploymentPipeline(buildPipelineInput());

    assert.equal(record.deploymentStatus, "PACKAGE_CREATED");
    assert.match(record.deploymentMetadata.notes, /No production deployment executed/);
    assert.ok(
      record.deploymentArtifacts.some(
        (artifact) =>
          artifact.filePath === ".env.production" &&
          artifact.content.includes("NODE_ENV=production"),
      ),
    );
  });

  it("marks package creation as failed when deployment plan and project are misaligned", () => {
    const record = scoreStoreDeploymentPipeline(buildPipelineInput({ misaligned: true }));

    assert.equal(record.deploymentStatus, "PACKAGE_FAILED");
    assert.ok(
      record.signals.some(
        (signal) =>
          signal.signalType === "plan_project_alignment" && signal.score < 100,
      ),
    );
  });

  it("persists deployment packages in the repository", async () => {
    const repository = createInMemoryStoreDeploymentPipelineRepository();
    const module = createStoreDeploymentPipelineModule(repository);
    const input = buildPipelineInput();

    const saved = await module.persistDeploymentPackage(WORKSPACE_ID, input);
    const loadedByProject = await module.getDeploymentPackageByProject(
      WORKSPACE_ID,
      input.project.projectId,
    );
    const loadedById = await module.getDeploymentPackage(WORKSPACE_ID, saved.recordId);

    assert.ok(loadedByProject);
    assert.ok(loadedById);
    assert.equal(loadedByProject!.deploymentPackage.packageId, saved.deploymentPackage.packageId);
    assert.equal(
      loadedById!.deploymentArtifacts.length,
      saved.deploymentArtifacts.length,
    );

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      storeId: input.project.storeId,
    });
    assert.equal(listed.length, 1);
  });
});
