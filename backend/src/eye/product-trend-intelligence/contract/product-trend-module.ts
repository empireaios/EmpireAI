/**
 * Product Trend Intelligence module — detects product movement over time.
 */

import type { ProductEvidenceSummary } from "../../product-evidence-aggregation/models/product-evidence-summary.js";
import {
  ProductTrendEngine,
  defaultProductTrendEngine,
} from "../engines/product-trend-engine.js";
import type { ProductTrend, ProductTrendDirection } from "../models/product-trend.js";
import type { TrendRepository } from "../repositories/trend-repository.js";
import { createInMemoryTrendRepository } from "../repositories/in-memory-trend-repository.js";

export const PRODUCT_TREND_MODULE_ID = "product-trend-intelligence" as const;
export type ProductTrendModuleId = typeof PRODUCT_TREND_MODULE_ID;

export const PRODUCT_TREND_MODULE_VERSION = "0.1.0" as const;

export type ProductTrendCapability =
  | "product-trend.analyze"
  | "product-trend.persist"
  | "product-trend.list";

export const PRODUCT_TREND_CAPABILITIES: readonly ProductTrendCapability[] = [
  "product-trend.analyze",
  "product-trend.persist",
  "product-trend.list",
] as const;

export type ProductTrendModuleContract = {
  moduleId: ProductTrendModuleId;
  version: string;
  capabilities: readonly ProductTrendCapability[];
};

export const PRODUCT_TREND_MODULE_CONTRACT: ProductTrendModuleContract = {
  moduleId: PRODUCT_TREND_MODULE_ID,
  version: PRODUCT_TREND_MODULE_VERSION,
  capabilities: PRODUCT_TREND_CAPABILITIES,
};

/** Orchestrates product trend analysis and persistence. */
export class ProductTrendModule {
  readonly contract = PRODUCT_TREND_MODULE_CONTRACT;

  constructor(
    private readonly repository: TrendRepository,
    private readonly engine: ProductTrendEngine = defaultProductTrendEngine,
  ) {}

  analyze(
    productId: string,
    current: ProductEvidenceSummary,
    history: ProductEvidenceSummary[] = [],
  ) {
    return this.engine.analyze({ productId, current, history });
  }

  async analyzeAndPersist(
    workspaceId: string,
    productId: string,
    current: ProductEvidenceSummary,
    history: ProductEvidenceSummary[] = [],
  ): Promise<ProductTrend> {
    const trendInput = this.engine.toTrendInput({ productId, current, history });
    return this.repository.save(workspaceId, trendInput);
  }

  async getTrend(workspaceId: string, productId: string): Promise<ProductTrend | null> {
    return this.repository.getByProductId(workspaceId, productId);
  }

  async listTrends(
    workspaceId: string,
    filters: { productId?: string; trendDirection?: ProductTrendDirection } = {},
  ): Promise<ProductTrend[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for a product trend module with optional custom dependencies. */
export function createProductTrendModule(
  repository: TrendRepository = createInMemoryTrendRepository(),
  engine: ProductTrendEngine = defaultProductTrendEngine,
): ProductTrendModule {
  return new ProductTrendModule(repository, engine);
}

export const productTrendModule = createProductTrendModule();
