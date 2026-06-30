import { randomUUID } from "node:crypto";

import { createBrandGenesisModule } from "../../brand-genesis/index.js";
import type { BrandProfile } from "../../brand-genesis/models/brand-profile.js";
import {
  scoreBrandProductPortfolio,
  type BrandProductPortfolioBreakdown,
} from "../../brand-product-portfolio/index.js";
import {
  scoreProductOffer,
  type ProductOfferBreakdown,
} from "../../product-offer-generation/index.js";
import {
  scoreLandingPageBlueprint,
  type LandingPageBlueprintBreakdown,
} from "../../landing-page-blueprint/index.js";
import {
  scoreLandingPageContent,
  type LandingPageContentInput,
  type LandingPageContentBreakdown,
} from "../../landing-page-content-generation/index.js";
import {
  scoreStoreBlueprint,
  type StoreBlueprintInput,
  type StoreBlueprintBreakdown,
} from "../../store-blueprint/index.js";
import {
  scoreStorePageGeneration,
  type StorePageGenerationBreakdown,
} from "../../store-page-generation/index.js";
import {
  scoreStorefrontAssembly,
  type StorefrontAssemblyBreakdown,
} from "../../storefront-assembly/index.js";
import {
  scoreStorefrontCodeGeneration,
  type StorefrontCodeGenerationInput,
  type StorefrontCodeGenerationBreakdown,
} from "../../storefront-code-generation/index.js";
import {
  scoreStorefrontArtifactGeneration,
  type StorefrontArtifactGenerationInput,
  type StorefrontArtifactGenerationBreakdown,
} from "../../storefront-artifact-generation/index.js";
import {
  scoreProjectMaterialization,
  type ProjectMaterializationInput,
  type ProjectMaterializationBreakdown,
} from "../../project-materialization/index.js";
import {
  buildBrandGenesisInput,
  buildLandingBlueprintInput,
  buildOfferInput,
  buildPortfolioInput,
  resolveManufacturingIds,
  type DeterministicManufacturingIdSet,
  type ManufacturingPipelineIds,
} from "./manufacturing-mock-inputs.js";

export type StoreManufacturingPipelineResult = {
  ids: ManufacturingPipelineIds;
  brand: BrandProfile;
  portfolio: BrandProductPortfolioBreakdown;
  offer: ProductOfferBreakdown;
  landingBlueprint: LandingPageBlueprintBreakdown;
  landingContent: LandingPageContentBreakdown;
  storeBlueprint: StoreBlueprintBreakdown;
  storePages: StorePageGenerationBreakdown;
  storefront: StorefrontAssemblyBreakdown;
  generatedCode: StorefrontCodeGenerationBreakdown;
  artifacts: StorefrontArtifactGenerationBreakdown;
  materializedProject: ProjectMaterializationBreakdown;
};

export async function runStoreManufacturingPipeline(
  workspaceId: string,
  deterministicIds?: DeterministicManufacturingIdSet,
): Promise<StoreManufacturingPipelineResult> {
  const ids = resolveManufacturingIds(deterministicIds);

  const brandModule = createBrandGenesisModule();
  const brand = await brandModule.persistBrandProfile(
    workspaceId,
    buildBrandGenesisInput(deterministicIds),
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
    ids,
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
  };
}
