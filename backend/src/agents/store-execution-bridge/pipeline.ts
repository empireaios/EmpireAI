import { randomUUID } from "node:crypto";

import { createBrandGenesisModule } from "../../execution/brand-genesis/index.js";
import { scoreBrandProductPortfolio } from "../../execution/brand-product-portfolio/index.js";
import { scoreProductOffer } from "../../execution/product-offer-generation/index.js";
import { scoreLandingPageBlueprint } from "../../execution/landing-page-blueprint/index.js";
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
import { scoreProjectMaterialization } from "../../execution/project-materialization/index.js";
import type { ProjectMaterializationInput } from "../../execution/project-materialization/index.js";
import {
  buildBrandGenesisInput,
  buildLandingBlueprintInput,
  buildOfferInput,
  buildPortfolioInput,
  resolveIds,
  type DeterministicIdSet,
} from "./mock-inputs.js";
import { createPipelineSessionId } from "./session-store.js";
import type { PipelineStage, StoreExecutionSession, StorePipelineIds } from "./types.js";

const PIPELINE_STAGES: Array<{ stage: string; moduleId: string }> = [
  { stage: "Brand genesis", moduleId: "brand-genesis" },
  { stage: "Product portfolio", moduleId: "brand-product-portfolio" },
  { stage: "Product offer", moduleId: "product-offer-generation" },
  { stage: "Landing page blueprint", moduleId: "landing-page-blueprint" },
  { stage: "Landing page content", moduleId: "landing-page-content-generation" },
  { stage: "Store blueprint", moduleId: "store-blueprint" },
  { stage: "Store pages", moduleId: "store-page-generation" },
  { stage: "Storefront assembly", moduleId: "storefront-assembly" },
  { stage: "Code generation", moduleId: "storefront-code-generation" },
  { stage: "Artifact generation", moduleId: "storefront-artifact-generation" },
  { stage: "Project materialization", moduleId: "project-materialization" },
];

function buildCompletedStages(): PipelineStage[] {
  return PIPELINE_STAGES.map((entry) => ({
    ...entry,
    progress: 100,
    status: "complete" as const,
  }));
}

export type RunManufacturingPipelineOptions = {
  companyId?: string;
  deterministicIds?: DeterministicIdSet;
};

export async function runManufacturingPipeline(
  workspaceId: string,
  options: RunManufacturingPipelineOptions = {},
): Promise<StoreExecutionSession> {
  const resolved = resolveIds(options.deterministicIds);
  const ids: StorePipelineIds = {
    brandId: resolved.brandId,
    offerId: resolved.offerId,
    pageId: resolved.pageId,
    storeId: resolved.storeId,
    storefrontId: resolved.storefrontId,
    generatedStorefrontId: resolved.generatedStorefrontId,
    projectId: resolved.projectId,
    productId: resolved.productId,
  };

  const brandModule = createBrandGenesisModule();
  const brand = await brandModule.persistBrandProfile(
    workspaceId,
    buildBrandGenesisInput(options.deterministicIds),
  );

  const portfolio = scoreBrandProductPortfolio(
    buildPortfolioInput(brand.brandId, ids.productId, brand.brandName),
  );

  const offer = scoreProductOffer(
    buildOfferInput(brand.brandId, ids.productId, brand.brandName, brand.valueProposition),
  );

  const landingInput = buildLandingBlueprintInput(
    brand.brandId,
    ids.offerId,
    ids.productId,
    brand.brandName,
    offer.valueProposition,
  );
  const landingBlueprint = scoreLandingPageBlueprint(landingInput);

  const contentInput: LandingPageContentInput = {
    blueprint: {
      pageId: ids.pageId,
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
  const landingContent = scoreLandingPageContent(contentInput);

  const storeBlueprintInput: StoreBlueprintInput = {
    brand: {
      brandId: brand.brandId,
      brandName: landingInput.brand.brandName,
      slogan: landingInput.brand.slogan,
      niche: landingInput.brand.niche,
      targetAudience: landingInput.brand.targetAudience,
      positioning: landingInput.brand.positioning,
      valueProposition: landingInput.offer.valueProposition,
      confidence: landingInput.brand.confidence,
    },
    portfolio: {
      brandId: brand.brandId,
      recommendedProducts: portfolio.recommendedProducts,
      heroProducts: portfolio.heroProducts,
      supportingProducts: portfolio.supportingProducts,
      bundleProducts: portfolio.bundleProducts,
      portfolioScore: portfolio.portfolioScore,
      confidence: portfolio.confidence,
    },
    offer: {
      offerId: ids.offerId,
      brandId: brand.brandId,
      productId: ids.productId,
      offerStyle: landingInput.offer.offerStyle,
      offerTitle: landingInput.offer.offerTitle,
      headline: landingInput.offer.headline,
      valueProposition: landingInput.offer.valueProposition,
      keyBenefits: landingInput.offer.keyBenefits,
      callToAction: landingInput.offer.callToAction,
      confidence: landingInput.offer.confidence,
    },
    content: {
      pageId: ids.pageId,
      offerId: ids.offerId,
      brandId: brand.brandId,
      productId: ids.productId,
      heroCopy: landingContent.heroCopy,
      benefitsCopy: landingContent.benefitsCopy,
      faqCopy: landingContent.faqCopy,
      ctaCopy: landingContent.ctaCopy,
      confidence: landingContent.confidence,
    },
  };

  const storeBlueprint = scoreStoreBlueprint(storeBlueprintInput);
  const storePages = scoreStorePageGeneration({
    blueprint: {
      storeId: ids.storeId,
      brandId: brand.brandId,
      homepage: storeBlueprint.homepage,
      collectionPages: storeBlueprint.collectionPages,
      productPages: storeBlueprint.productPages,
      aboutPage: storeBlueprint.aboutPage,
      faqPage: storeBlueprint.faqPage,
      contactPage: storeBlueprint.contactPage,
      navigation: storeBlueprint.navigation,
      confidence: storeBlueprint.confidence,
    },
    content: {
      pageId: ids.pageId,
      brandId: brand.brandId,
      productId: ids.productId,
      heroCopy: landingContent.heroCopy,
      problemCopy: landingContent.problemCopy,
      solutionCopy: landingContent.solutionCopy,
      benefitsCopy: landingContent.benefitsCopy,
      offerCopy: landingContent.offerCopy,
      socialProofCopy: landingContent.socialProofCopy,
      faqCopy: landingContent.faqCopy,
      ctaCopy: landingContent.ctaCopy,
      confidence: landingContent.confidence,
    },
  });

  const storefront = scoreStorefrontAssembly({
    pages: storePages.pages.map((page) => ({
      pageId: page.pageId,
      route: page.route,
      pageType: page.pageType,
      title: page.title,
      metadata: page.metadata,
      confidence: page.confidence,
      renderPayload: page.renderPayload,
    })),
    blueprint: {
      storeId: ids.storeId,
      brandId: brand.brandId,
      navigation: storeBlueprint.navigation,
      confidence: storeBlueprint.confidence,
    },
    brand: {
      brandId: brand.brandId,
      brandName: landingInput.brand.brandName,
      slogan: landingInput.brand.slogan,
      niche: landingInput.brand.niche,
      targetAudience: landingInput.brand.targetAudience,
      positioning: landingInput.brand.positioning,
      valueProposition: landingInput.offer.valueProposition,
      confidence: landingInput.brand.confidence,
    },
  });

  const codeInput: StorefrontCodeGenerationInput = {
    storefront: {
      storefrontId: ids.storefrontId,
      storeId: ids.storeId,
      brandId: brand.brandId,
      routes: storefront.routes,
      navigation: storefront.navigation,
      assets: storefront.assets,
      pageMap: storefront.pageMap,
      seoMap: storefront.seoMap,
      confidence: storefront.confidence,
    },
    pages: storePages.pages.map((page) => ({
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
      brandId: brand.brandId,
      brandName: landingInput.brand.brandName,
      slogan: landingInput.brand.slogan,
      niche: landingInput.brand.niche,
      targetAudience: landingInput.brand.targetAudience,
      positioning: landingInput.brand.positioning,
      valueProposition: landingInput.offer.valueProposition,
      confidence: landingInput.brand.confidence,
    },
  };

  const generatedCode = scoreStorefrontCodeGeneration(codeInput);

  const artifactInput: StorefrontArtifactGenerationInput = {
    codeGeneration: {
      generatedStorefrontId: ids.generatedStorefrontId,
      storefrontId: ids.storefrontId,
      storeId: generatedCode.storeId,
      brandId: generatedCode.brandId,
      generatedPages: generatedCode.generatedPages,
      generatedComponents: generatedCode.generatedComponents,
      projectStructure: generatedCode.projectStructure,
      deploymentMetadata: generatedCode.deploymentMetadata,
      confidence: generatedCode.confidence,
    },
  };
  const artifacts = scoreStorefrontArtifactGeneration(artifactInput);

  const materializationInput: ProjectMaterializationInput = {
    artifacts: artifacts.artifacts.map((artifact) => ({
      artifactId: randomUUID(),
      generatedStorefrontId: artifacts.generatedStorefrontId,
      filePath: artifact.filePath,
      fileType: artifact.fileType,
      generatedContent: artifact.generatedContent,
      metadata: artifact.metadata,
      confidence: artifact.confidence,
    })),
  };
  const materializedProject = scoreProjectMaterialization(materializationInput);

  return {
    sessionId: createPipelineSessionId(),
    workspaceId,
    companyId: options.companyId,
    status: "complete",
    stages: buildCompletedStages(),
    ids: {
      ...ids,
      projectId: resolved.projectId,
    },
    brand,
    portfolio,
    offer,
    landingBlueprint,
    landingContent,
    storeBlueprint,
    storePages,
    storefront,
    generatedCode,
    artifacts,
    materializedProject,
    completedAt: new Date().toISOString(),
  };
}
