import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
  createDeploymentBlueprintModule,
  createInMemoryDeploymentBlueprintRepository,
  HOSTING_TARGETS,
  scoreDeploymentBlueprint,
} from "../../execution/deployment-blueprint/index.js";
import type {
  DeploymentBlueprintInput,
  DeploymentBlueprintProjectInput,
  HostingTarget,
} from "../../execution/deployment-blueprint/index.js";
import { scoreProjectMaterialization } from "../../execution/project-materialization/index.js";
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

const WORKSPACE_ID = "ws-m063";

function buildPortfolioInput(brandId: string): BrandProductPortfolioInput {
  const heroProductId = "prod-m063-kitchen-blender";
  const accessoryProductId = "prod-m063-blender-pitcher";

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
  const productId = "prod-m063-kitchen-blender";

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

function buildMaterializedProjectInput() {
  const artifactResult = scoreStorefrontArtifactGeneration(buildArtifactGenerationInput());

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

function buildDeploymentBlueprintInput(
  overrides: {
    preferredHostingTarget?: HostingTarget;
    projectConfidence?: number;
  } = {},
): DeploymentBlueprintInput {
  const materialized = scoreProjectMaterialization(buildMaterializedProjectInput());
  const project: DeploymentBlueprintProjectInput = {
    projectId: randomUUID(),
    generatedStorefrontId: materialized.generatedStorefrontId,
    storeId: materialized.storeId,
    brandId: materialized.brandId,
    projectStructure: materialized.projectStructure,
    buildMetadata: materialized.buildMetadata,
    confidence: overrides.projectConfidence ?? materialized.confidence,
  };

  return {
    project,
    ...(overrides.preferredHostingTarget
      ? { preferredHostingTarget: overrides.preferredHostingTarget }
      : {}),
  };
}

describe("Mission 063 Deployment Blueprint Engine", () => {
  it("generates a deployment plan with required output fields from a materialized project", async () => {
    const module = createDeploymentBlueprintModule();
    const input = buildDeploymentBlueprintInput();
    const plan = await module.persistDeploymentPlan(WORKSPACE_ID, input);

    assert.ok(plan.deploymentPlanId);
    assert.equal(plan.framework, "next");
    assert.equal(plan.hostingTarget, "VERCEL");
    assert.ok(Object.keys(plan.environmentVariables).length >= 3);
    assert.ok(plan.domainRequirements.primaryDomain);
    assert.ok(plan.domainRequirements.dnsRecords.length >= 1);
    assert.ok(plan.deploymentSteps.length >= 3);
    assert.ok(plan.confidence >= 70);
    assert.ok(plan.signals.some((signal) => signal.signalType === "deployment_composite"));
  });

  it("defaults to VERCEL hosting for Next.js materialized projects", () => {
    const plan = scoreDeploymentBlueprint(buildDeploymentBlueprintInput());

    assert.equal(plan.framework, "next");
    assert.equal(plan.hostingTarget, "VERCEL");
    assert.ok(plan.deploymentSteps.some((step) => step.title.includes("Vercel")));
  });

  it("generates target-specific deployment steps for each hosting target", () => {
    const expectedStepCounts: Record<HostingTarget, number> = {
      VERCEL: 4,
      DOCKER: 3,
      VPS: 5,
      STATIC_EXPORT: 3,
    };

    for (const hostingTarget of HOSTING_TARGETS) {
      const plan = scoreDeploymentBlueprint(
        buildDeploymentBlueprintInput({ preferredHostingTarget: hostingTarget }),
      );

      assert.equal(plan.hostingTarget, hostingTarget);
      assert.equal(plan.deploymentSteps.length, expectedStepCounts[hostingTarget]);
      assert.ok(plan.deploymentSteps.every((step) => step.stepId.length > 0));
      assert.equal(plan.deploymentSteps[0]!.order, 0);
    }
  });

  it("builds environment variables and domain requirements per hosting target", () => {
    const vercelPlan = scoreDeploymentBlueprint(
      buildDeploymentBlueprintInput({ preferredHostingTarget: "VERCEL" }),
    );
    const dockerPlan = scoreDeploymentBlueprint(
      buildDeploymentBlueprintInput({ preferredHostingTarget: "DOCKER" }),
    );

    assert.equal(vercelPlan.environmentVariables.NODE_ENV, "production");
    assert.equal(vercelPlan.environmentVariables.VERCEL_ENV, "production");
    assert.equal(dockerPlan.environmentVariables.PORT, "3000");
    assert.equal(dockerPlan.environmentVariables.HOSTNAME, "0.0.0.0");
    assert.equal(vercelPlan.domainRequirements.sslRequired, true);
    assert.ok(vercelPlan.domainRequirements.dnsRecords[0]!.value.includes("vercel"));
  });

  it("calculates confidence from project quality and deployment readiness", () => {
    const highConfidence = scoreDeploymentBlueprint(
      buildDeploymentBlueprintInput({ projectConfidence: 90 }),
    );
    const lowConfidence = scoreDeploymentBlueprint(
      buildDeploymentBlueprintInput({ projectConfidence: 45 }),
    );

    assert.ok(highConfidence.confidence > lowConfidence.confidence);
    assert.ok(highConfidence.confidence >= 70);
    assert.ok(
      highConfidence.signals.some((signal) => signal.signalType === "hosting_alignment"),
    );
  });

  it("persists deployment plans in the repository", async () => {
    const repository = createInMemoryDeploymentBlueprintRepository();
    const module = createDeploymentBlueprintModule(repository);
    const input = buildDeploymentBlueprintInput();

    const saved = await module.persistDeploymentPlan(WORKSPACE_ID, input);
    const loadedByProject = await module.getDeploymentPlanByProject(
      WORKSPACE_ID,
      input.project.projectId,
    );
    const loadedById = await module.getDeploymentPlan(WORKSPACE_ID, saved.deploymentPlanId);

    assert.ok(loadedByProject);
    assert.ok(loadedById);
    assert.equal(loadedByProject!.deploymentPlanId, saved.deploymentPlanId);
    assert.equal(loadedById!.deploymentSteps.length, saved.deploymentSteps.length);

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      storeId: input.project.storeId,
    });
    assert.equal(listed.length, 1);
  });
});
