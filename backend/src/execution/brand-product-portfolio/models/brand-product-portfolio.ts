import { z } from "zod";

import { brandProductSchema, type BrandProduct } from "./brand-product.js";
import {
  brandProductSignalSchema,
  type BrandProductSignal,
} from "./brand-product-signal.js";

export type BrandProductPortfolioId = string;

/** Product portfolio for a generated brand. */
export type BrandProductPortfolio = {
  portfolioId: BrandProductPortfolioId;
  workspaceId: string;
  brandId: string;
  recommendedProducts: BrandProduct[];
  heroProducts: BrandProduct[];
  supportingProducts: BrandProduct[];
  bundleProducts: BrandProduct[];
  portfolioScore: number;
  confidence: number;
  signals: BrandProductSignal[];
  createdAt: string;
  updatedAt: string;
};

export type BrandProductPortfolioCreateInput = Omit<
  BrandProductPortfolio,
  "portfolioId" | "workspaceId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const brandProductPortfolioSchema = z.object({
  portfolioId: z.string().min(1),
  workspaceId: z.string().min(1),
  brandId: z.string().min(1),
  recommendedProducts: z.array(brandProductSchema).min(1),
  heroProducts: z.array(brandProductSchema).min(1),
  supportingProducts: z.array(brandProductSchema),
  bundleProducts: z.array(brandProductSchema).min(1),
  portfolioScore: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  signals: z.array(brandProductSignalSchema),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a BrandProductPortfolio record shape. */
export function validateBrandProductPortfolio(value: unknown): BrandProductPortfolio {
  return brandProductPortfolioSchema.parse(value);
}
