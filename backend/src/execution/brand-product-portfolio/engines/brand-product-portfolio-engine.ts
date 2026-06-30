import type { BrandProductPortfolio } from "../models/brand-product-portfolio.js";
import type { BrandProductRepository } from "../repositories/brand-product-repository.js";
import {
  scoreBrandProductPortfolio,
  type BrandProductPortfolioInput,
} from "../scoring/brand-product-scoring.js";

/** Determines which products belong to a generated brand. */
export class BrandProductPortfolioEngine {
  constructor(private readonly repository: BrandProductRepository) {}

  buildPortfolio(input: BrandProductPortfolioInput) {
    return scoreBrandProductPortfolio(input);
  }

  async buildAndSave(
    workspaceId: string,
    input: BrandProductPortfolioInput,
  ): Promise<BrandProductPortfolio> {
    const breakdown = scoreBrandProductPortfolio(input);
    return this.repository.save(workspaceId, breakdown);
  }
}

export const defaultBrandProductPortfolioEngine = {
  buildPortfolio: scoreBrandProductPortfolio,
};

export type { BrandProductPortfolioInput };
