import type {
  BrandProductPortfolio,
  BrandProductPortfolioCreateInput,
} from "../models/brand-product-portfolio.js";

export type BrandProductRepositoryQuery = {
  workspaceId: string;
  brandId?: string;
  minPortfolioScore?: number;
  minConfidence?: number;
  limit?: number;
  offset?: number;
};

/** Persists brand product portfolios. */
export interface BrandProductRepository {
  save(
    workspaceId: string,
    input: BrandProductPortfolioCreateInput,
  ): Promise<BrandProductPortfolio>;
  getById(
    workspaceId: string,
    portfolioId: string,
  ): Promise<BrandProductPortfolio | null>;
  getByBrand(workspaceId: string, brandId: string): Promise<BrandProductPortfolio | null>;
  list(query: BrandProductRepositoryQuery): Promise<BrandProductPortfolio[]>;
  delete(workspaceId: string, portfolioId: string): Promise<boolean>;
}
