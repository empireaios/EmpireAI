import type { BrandProduct } from "../../execution/brand-product-portfolio/models/brand-product.js";
import type { StoreExecutionSession } from "./types.js";

export type StoreBrandView = {
  brandId: string;
  brandName: string;
  slogan: string;
  niche: string;
  targetAudience: string;
  positioning: string;
  valueProposition: string;
  recommendedProducts: string[];
  confidence: number;
  identity: StoreExecutionSession["brand"]["identity"];
  positioningProfile: StoreExecutionSession["brand"]["positioningProfile"];
};

export type StorePortfolioView = {
  brandId: string;
  recommendedProducts: BrandProduct[];
  heroProducts: Array<{ productId: string; displayName: string; role: string }>;
  supportingProducts: Array<{ productId: string; displayName: string; role: string }>;
  bundleProducts: Array<{ productId: string; displayName: string; role: string }>;
  portfolioScore: number;
  confidence: number;
};

export type StoreOfferView = {
  offerId: string;
  brandId: string;
  productId: string;
  offerStyle: string;
  offerTitle: string;
  headline: string;
  valueProposition: string;
  keyBenefits: string[];
  keyFeatures: string[];
  callToAction: string;
  confidence: number;
};

export type StoreLandingPageView = {
  pageId: string;
  offerId: string;
  brandId: string;
  productId: string;
  pageTitle: string;
  blueprint: {
    heroSection: unknown;
    problemSection: unknown;
    solutionSection: unknown;
    benefitsSection: unknown;
    offerSection: unknown;
    socialProofSection: unknown;
    faqSection: unknown;
    ctaSection: unknown;
    confidence: number;
  };
  content: {
    heroCopy: string;
    problemCopy: string;
    solutionCopy: string;
    benefitsCopy: string;
    offerCopy: string;
    socialProofCopy: string;
    faqCopy: string;
    ctaCopy: string;
    confidence: number;
  };
};

export type StoreBlueprintView = {
  storeId: string;
  brandId: string;
  homepage: unknown;
  collectionPages: unknown[];
  productPages: unknown[];
  aboutPage: unknown;
  faqPage: unknown;
  contactPage: unknown;
  navigation: unknown;
  confidence: number;
};

export type StorePagesView = {
  storeId: string;
  brandId: string;
  pages: Array<{
    pageId: string;
    route: string;
    pageType: string;
    title: string;
    metadata: unknown;
    sections: unknown[];
    confidence: number;
  }>;
  confidence: number;
};

export type StorefrontView = {
  storefrontId: string;
  storeId: string;
  brandId: string;
  routes: unknown[];
  navigation: unknown;
  assets: unknown[];
  pageMap: unknown;
  seoMap: unknown;
  confidence: number;
};

export type GeneratedCodeView = {
  generatedStorefrontId: string;
  storefrontId: string;
  storeId: string;
  brandId: string;
  generatedPages: unknown[];
  generatedComponents: unknown[];
  projectStructure: unknown;
  deploymentMetadata: unknown;
  confidence: number;
};

export type ArtifactListView = {
  generatedStorefrontId: string;
  artifacts: Array<{
    artifactId: string;
    filePath: string;
    fileType: string;
    preview: string;
    confidence: number;
    metadata: unknown;
  }>;
  totalCount: number;
  confidence: number;
};

export type MaterializedProjectView = {
  projectId: string;
  generatedStorefrontId: string;
  projectStructure: unknown;
  materializedFiles: unknown[];
  dependencyMap: unknown;
  buildMetadata: unknown;
  confidence: number;
};

export type ManufacturingPipelineView = {
  sessionId: string;
  workspaceId: string;
  companyId?: string;
  status: string;
  stages: StoreExecutionSession["stages"];
  ids: StoreExecutionSession["ids"];
  summary: {
    brandName: string;
    offerTitle: string;
    storeId: string;
    storefrontId: string;
    projectId: string;
    artifactCount: number;
    overallConfidence: number;
  };
  completedAt: string;
};

export function toBrandView(session: StoreExecutionSession): StoreBrandView {
  const { brand } = session;
  return {
    brandId: brand.brandId,
    brandName: brand.brandName,
    slogan: brand.slogan,
    niche: brand.niche,
    targetAudience: brand.targetAudience,
    positioning: brand.positioning,
    valueProposition: brand.valueProposition,
    recommendedProducts: brand.recommendedProducts,
    confidence: brand.confidence,
    identity: brand.identity,
    positioningProfile: brand.positioningProfile,
  };
}

export function toPortfolioView(session: StoreExecutionSession): StorePortfolioView {
  const { portfolio } = session;
  return {
    brandId: portfolio.brandId,
    recommendedProducts: portfolio.recommendedProducts,
    heroProducts: portfolio.heroProducts,
    supportingProducts: portfolio.supportingProducts,
    bundleProducts: portfolio.bundleProducts,
    portfolioScore: portfolio.portfolioScore,
    confidence: portfolio.confidence,
  };
}

export function toOfferView(session: StoreExecutionSession): StoreOfferView {
  const { offer, ids } = session;
  return {
    offerId: ids.offerId,
    brandId: offer.brandId,
    productId: offer.productId,
    offerStyle: offer.offerStyle,
    offerTitle: offer.offerTitle,
    headline: offer.headline,
    valueProposition: offer.valueProposition,
    keyBenefits: offer.keyBenefits,
    keyFeatures: offer.keyFeatures,
    callToAction: offer.callToAction,
    confidence: offer.confidence,
  };
}

export function toLandingPageView(session: StoreExecutionSession): StoreLandingPageView {
  const { landingBlueprint, landingContent, ids } = session;
  return {
    pageId: ids.pageId,
    offerId: landingBlueprint.offerId,
    brandId: landingBlueprint.brandId,
    productId: landingBlueprint.productId,
    pageTitle: landingBlueprint.pageTitle,
    blueprint: {
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
    content: {
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
  };
}

export function toStoreBlueprintView(session: StoreExecutionSession): StoreBlueprintView {
  const { storeBlueprint, ids } = session;
  return {
    storeId: ids.storeId,
    brandId: storeBlueprint.brandId,
    homepage: storeBlueprint.homepage,
    collectionPages: storeBlueprint.collectionPages,
    productPages: storeBlueprint.productPages,
    aboutPage: storeBlueprint.aboutPage,
    faqPage: storeBlueprint.faqPage,
    contactPage: storeBlueprint.contactPage,
    navigation: storeBlueprint.navigation,
    confidence: storeBlueprint.confidence,
  };
}

export function toStorePagesView(session: StoreExecutionSession): StorePagesView {
  const { storePages, ids } = session;
  const confidence =
    storePages.pages.length === 0
      ? 0
      : Math.round(
          storePages.pages.reduce((sum, page) => sum + page.confidence, 0) /
            storePages.pages.length,
        );
  return {
    storeId: ids.storeId,
    brandId: session.brand.brandId,
    pages: storePages.pages.map((page) => ({
      pageId: page.pageId,
      route: page.route,
      pageType: page.pageType,
      title: page.title,
      metadata: page.metadata,
      sections: page.sections,
      confidence: page.confidence,
    })),
    confidence,
  };
}

export function toStorefrontView(session: StoreExecutionSession): StorefrontView {
  const { storefront, ids } = session;
  return {
    storefrontId: ids.storefrontId,
    storeId: ids.storeId,
    brandId: storefront.brandId,
    routes: storefront.routes,
    navigation: storefront.navigation,
    assets: storefront.assets,
    pageMap: storefront.pageMap,
    seoMap: storefront.seoMap,
    confidence: storefront.confidence,
  };
}

export function toGeneratedCodeView(session: StoreExecutionSession): GeneratedCodeView {
  const { generatedCode, ids } = session;
  return {
    generatedStorefrontId: ids.generatedStorefrontId,
    storefrontId: ids.storefrontId,
    storeId: generatedCode.storeId,
    brandId: generatedCode.brandId,
    generatedPages: generatedCode.generatedPages,
    generatedComponents: generatedCode.generatedComponents,
    projectStructure: generatedCode.projectStructure,
    deploymentMetadata: generatedCode.deploymentMetadata,
    confidence: generatedCode.confidence,
  };
}

export function toArtifactListView(session: StoreExecutionSession): ArtifactListView {
  const { artifacts } = session;
  const confidence =
    artifacts.artifacts.length === 0
      ? 0
      : Math.round(
          artifacts.artifacts.reduce((sum, artifact) => sum + artifact.confidence, 0) /
            artifacts.artifacts.length,
        );
  return {
    generatedStorefrontId: artifacts.generatedStorefrontId,
    artifacts: artifacts.artifacts.map((artifact, index) => ({
      artifactId: session.materializedProject.materializedFiles[index]?.artifactId ?? `artifact-${index}`,
      filePath: artifact.filePath,
      fileType: artifact.fileType,
      preview: artifact.generatedContent.slice(0, 240),
      confidence: artifact.confidence,
      metadata: artifact.metadata,
    })),
    totalCount: artifacts.artifacts.length,
    confidence,
  };
}

export function toMaterializedProjectView(
  session: StoreExecutionSession,
): MaterializedProjectView {
  const { materializedProject, ids } = session;
  return {
    projectId: ids.projectId,
    generatedStorefrontId: materializedProject.generatedStorefrontId,
    projectStructure: materializedProject.projectStructure,
    materializedFiles: materializedProject.materializedFiles,
    dependencyMap: materializedProject.dependencyMap,
    buildMetadata: materializedProject.buildMetadata,
    confidence: materializedProject.confidence,
  };
}

export function toManufacturingPipelineView(
  session: StoreExecutionSession,
): ManufacturingPipelineView {
  return {
    sessionId: session.sessionId,
    workspaceId: session.workspaceId,
    companyId: session.companyId,
    status: session.status,
    stages: session.stages,
    ids: session.ids,
    summary: {
      brandName: session.brand.brandName,
      offerTitle: session.offer.offerTitle,
      storeId: session.ids.storeId,
      storefrontId: session.ids.storefrontId,
      projectId: session.ids.projectId,
      artifactCount: session.artifacts.artifacts.length,
      overallConfidence: session.materializedProject.confidence,
    },
    completedAt: session.completedAt,
  };
}
