/**
 * Brand Product Portfolio module — determines which products a brand should sell.
 */

import {
  BrandProductPortfolioEngine,
  defaultBrandProductPortfolioEngine,
  type BrandProductPortfolioInput,
} from "../engines/brand-product-portfolio-engine.js";
import type { BrandProductPortfolio } from "../models/brand-product-portfolio.js";
import {
  brandProductScoring,
  scoreBrandProductPortfolio,
  type BrandProductBrandInput,
  type BrandProductKnowledgeInput,
  type BrandProductOpportunityInput,
  type BrandProductRelationshipInput,
  type BrandProductSupplierMatchInput,
} from "../scoring/brand-product-scoring.js";
import type {
  BrandProductRepository,
  BrandProductRepositoryQuery,
} from "../repositories/brand-product-repository.js";
import { createInMemoryBrandProductRepository } from "../repositories/in-memory-brand-product-repository.js";

export const BRAND_PRODUCT_PORTFOLIO_MODULE_ID = "brand-product-portfolio" as const;
export type BrandProductPortfolioModuleId = typeof BRAND_PRODUCT_PORTFOLIO_MODULE_ID;

export const BRAND_PRODUCT_PORTFOLIO_MODULE_VERSION = "0.1.0" as const;

export type BrandProductPortfolioCapability =
  | "brand-product-portfolio.build"
  | "brand-product-portfolio.score"
  | "brand-product-portfolio.persist"
  | "brand-product-portfolio.list";

export const BRAND_PRODUCT_PORTFOLIO_CAPABILITIES: readonly BrandProductPortfolioCapability[] = [
  "brand-product-portfolio.build",
  "brand-product-portfolio.score",
  "brand-product-portfolio.persist",
  "brand-product-portfolio.list",
] as const;

export type BrandProductPortfolioModuleContract = {
  moduleId: BrandProductPortfolioModuleId;
  version: string;
  capabilities: readonly BrandProductPortfolioCapability[];
};

export const BRAND_PRODUCT_PORTFOLIO_MODULE_CONTRACT: BrandProductPortfolioModuleContract = {
  moduleId: BRAND_PRODUCT_PORTFOLIO_MODULE_ID,
  version: BRAND_PRODUCT_PORTFOLIO_MODULE_VERSION,
  capabilities: BRAND_PRODUCT_PORTFOLIO_CAPABILITIES,
};

/** Orchestrates brand product portfolio generation and persistence. */
export class BrandProductPortfolioModule {
  readonly contract = BRAND_PRODUCT_PORTFOLIO_MODULE_CONTRACT;
  private readonly engine: BrandProductPortfolioEngine;

  constructor(
    private readonly repository: BrandProductRepository,
    engine?: BrandProductPortfolioEngine,
  ) {
    this.engine = engine ?? new BrandProductPortfolioEngine(repository);
  }

  scoreBrandProductPortfolio = scoreBrandProductPortfolio;
  scoring = brandProductScoring;

  buildBrandProductPortfolio(input: BrandProductPortfolioInput) {
    return this.engine.buildPortfolio(input);
  }

  async persistBrandProductPortfolio(
    workspaceId: string,
    input: BrandProductPortfolioInput,
  ): Promise<BrandProductPortfolio> {
    return this.engine.buildAndSave(workspaceId, input);
  }

  async getBrandProductPortfolio(
    workspaceId: string,
    portfolioId: string,
  ): Promise<BrandProductPortfolio | null> {
    return this.repository.getById(workspaceId, portfolioId);
  }

  async getPortfolioByBrand(
    workspaceId: string,
    brandId: string,
  ): Promise<BrandProductPortfolio | null> {
    return this.repository.getByBrand(workspaceId, brandId);
  }

  async listBrandProductPortfolios(
    workspaceId: string,
    filters: Omit<BrandProductRepositoryQuery, "workspaceId"> = {},
  ): Promise<BrandProductPortfolio[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for a brand product portfolio module with optional custom dependencies. */
export function createBrandProductPortfolioModule(
  repository: BrandProductRepository = createInMemoryBrandProductRepository(),
  engine?: BrandProductPortfolioEngine,
): BrandProductPortfolioModule {
  return new BrandProductPortfolioModule(
    repository,
    engine ?? new BrandProductPortfolioEngine(repository),
  );
}

export const brandProductPortfolioModule = createBrandProductPortfolioModule();

export type {
  BrandProductPortfolioInput,
  BrandProductBrandInput,
  BrandProductKnowledgeInput,
  BrandProductRelationshipInput,
  BrandProductOpportunityInput,
  BrandProductSupplierMatchInput,
};

export { defaultBrandProductPortfolioEngine };
