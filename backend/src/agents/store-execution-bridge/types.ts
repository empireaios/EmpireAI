import type { BrandProfile } from "../../execution/brand-genesis/models/brand-profile.js";
import type { BrandProductPortfolioBreakdown } from "../../execution/brand-product-portfolio/scoring/brand-product-scoring.js";
import type { ProductOfferBreakdown } from "../../execution/product-offer-generation/scoring/offer-scoring.js";
import type { LandingPageBlueprintBreakdown } from "../../execution/landing-page-blueprint/scoring/landing-page-blueprint-scoring.js";
import type { LandingPageContentBreakdown } from "../../execution/landing-page-content-generation/scoring/landing-page-content-scoring.js";
import type { StoreBlueprintBreakdown } from "../../execution/store-blueprint/scoring/store-blueprint-scoring.js";
import type { StorePageGenerationBreakdown } from "../../execution/store-page-generation/scoring/store-page-generation-scoring.js";
import type { StorefrontAssemblyBreakdown } from "../../execution/storefront-assembly/scoring/storefront-assembly-scoring.js";
import type { StorefrontCodeGenerationBreakdown } from "../../execution/storefront-code-generation/scoring/storefront-code-generation-scoring.js";
import type { StorefrontArtifactGenerationBreakdown } from "../../execution/storefront-artifact-generation/scoring/artifact-generation-scoring.js";
import type { ProjectMaterializationBreakdown } from "../../execution/project-materialization/scoring/materialization-scoring.js";

export type PipelineStageStatus = "pending" | "in_progress" | "complete" | "failed";

export type PipelineStage = {
  stage: string;
  moduleId: string;
  progress: number;
  status: PipelineStageStatus;
};

export type StorePipelineIds = {
  brandId: string;
  offerId: string;
  pageId: string;
  storeId: string;
  storefrontId: string;
  generatedStorefrontId: string;
  projectId: string;
  productId: string;
};

export type StorePipelineResult = {
  sessionId: string;
  workspaceId: string;
  companyId?: string;
  status: "complete" | "failed";
  stages: PipelineStage[];
  ids: StorePipelineIds;
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
  completedAt: string;
};

export type StoreExecutionSession = StorePipelineResult;
