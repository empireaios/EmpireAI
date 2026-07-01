export type PipelineStage = {
  stage: string;
  moduleId: string;
  progress: number;
  status: string;
};

export type ManufacturingPipelineView = {
  sessionId: string;
  workspaceId: string;
  companyId?: string;
  status: string;
  stages: PipelineStage[];
  ids: {
    brandId: string;
    offerId: string;
    pageId: string;
    storeId: string;
    storefrontId: string;
    generatedStorefrontId: string;
    projectId: string;
    productId: string;
  };
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
};

export type StoreProductRef = {
  productId: string;
  displayName: string;
  role: string;
};

export type StorePortfolioView = {
  brandId: string;
  recommendedProducts: Array<{
    productId: string;
    displayName: string;
    role: string;
    productScore?: number;
    opportunityScore?: number;
  }>;
  heroProducts: StoreProductRef[];
  supportingProducts: StoreProductRef[];
  bundleProducts: StoreProductRef[];
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
  blueprint: { confidence: number };
  content: {
    heroCopy: string;
    problemCopy: string;
    solutionCopy: string;
    benefitsCopy: string;
    ctaCopy: string;
    confidence: number;
  };
};

export type StoreBlueprintView = {
  storeId: string;
  brandId: string;
  homepage?: unknown;
  collectionPages: unknown[];
  productPages: unknown[];
  aboutPage?: unknown;
  faqPage?: unknown;
  contactPage?: unknown;
  navigation?: unknown;
  confidence: number;
};

export type StorePageSectionView = {
  sectionId: string;
  sectionType: string;
  headline: string;
  body: string;
  bullets: string[];
  callToAction: string | null;
  order: number;
};

export type StorePageMetadataView = {
  description?: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
};

export type StorePageRow = {
  pageId: string;
  route: string;
  pageType: string;
  title: string;
  confidence: number;
  metadata?: StorePageMetadataView;
  sections?: StorePageSectionView[];
};

export type StorePagesView = {
  storeId: string;
  brandId: string;
  pages: StorePageRow[];
  confidence: number;
};

export type StorefrontRouteView = {
  path?: string;
  title?: string;
  pageType?: string;
  pageId?: string;
};

export type StorefrontView = {
  storefrontId: string;
  storeId: string;
  brandId: string;
  routes: StorefrontRouteView[];
  navigation?: unknown;
  pageMap?: unknown;
  seoMap?: unknown;
  assets: unknown[];
  confidence: number;
};

export type GeneratedCodeView = {
  generatedStorefrontId: string;
  storefrontId: string;
  storeId: string;
  brandId: string;
  generatedPages: unknown[];
  generatedComponents: unknown[];
  confidence: number;
};

export type ArtifactRow = {
  artifactId: string;
  filePath: string;
  fileType: string;
  preview: string;
  confidence: number;
  metadata?: Record<string, unknown>;
};

export type MaterializedFileView = {
  artifactId: string;
  relativePath: string;
  content: string;
  fileType: string;
  mimeType?: string;
  status?: string;
};

export type ArtifactListView = {
  generatedStorefrontId: string;
  artifacts: ArtifactRow[];
  totalCount: number;
  confidence: number;
};

export type MaterializedProjectView = {
  projectId: string;
  generatedStorefrontId: string;
  projectStructure: {
    rootDirectory?: string;
    packageName?: string;
    framework?: string;
    files?: string[];
    directories?: string[];
  };
  materializedFiles: MaterializedFileView[];
  buildMetadata: {
    platform?: string;
    buildCommand?: string;
    startCommand?: string;
    outputDirectory?: string;
  };
  confidence: number;
};

export type StoreManufacturingData = {
  pipeline: ManufacturingPipelineView | null;
  brand: StoreBrandView | null;
  portfolio: StorePortfolioView | null;
  offer: StoreOfferView | null;
  landingPage: StoreLandingPageView | null;
  storeBlueprint: StoreBlueprintView | null;
  storePages: StorePagesView | null;
  storefront: StorefrontView | null;
  generatedCode: GeneratedCodeView | null;
  artifacts: ArtifactListView | null;
  materializedProject: MaterializedProjectView | null;
};

export type StorePipelinePhase =
  | "idle"
  | "running_pipeline"
  | "loading_data"
  | "success"
  | "error";
