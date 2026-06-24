/**
 * Product Trend Forecasting module — predicts future product movement.
 */

import type { ProductTrend } from "../../product-trend-intelligence/models/product-trend.js";
import {
  ProductTrendForecastEngine,
  defaultProductTrendForecastEngine,
} from "../engines/product-trend-forecast-engine.js";
import type {
  ForecastDirection,
  ProductTrendForecast,
  RecommendedAction,
} from "../models/product-trend-forecast.js";
import type { ForecastRepository } from "../repositories/forecast-repository.js";
import { createInMemoryForecastRepository } from "../repositories/in-memory-forecast-repository.js";

export const PRODUCT_TREND_FORECAST_MODULE_ID = "product-trend-forecasting" as const;
export type ProductTrendForecastModuleId = typeof PRODUCT_TREND_FORECAST_MODULE_ID;

export const PRODUCT_TREND_FORECAST_MODULE_VERSION = "0.1.0" as const;

export type ProductTrendForecastCapability =
  | "product-trend-forecast.generate"
  | "product-trend-forecast.persist"
  | "product-trend-forecast.list";

export const PRODUCT_TREND_FORECAST_CAPABILITIES: readonly ProductTrendForecastCapability[] = [
  "product-trend-forecast.generate",
  "product-trend-forecast.persist",
  "product-trend-forecast.list",
] as const;

export type ProductTrendForecastModuleContract = {
  moduleId: ProductTrendForecastModuleId;
  version: string;
  capabilities: readonly ProductTrendForecastCapability[];
};

export const PRODUCT_TREND_FORECAST_MODULE_CONTRACT: ProductTrendForecastModuleContract = {
  moduleId: PRODUCT_TREND_FORECAST_MODULE_ID,
  version: PRODUCT_TREND_FORECAST_MODULE_VERSION,
  capabilities: PRODUCT_TREND_FORECAST_CAPABILITIES,
};

/** Orchestrates product trend forecasting and persistence. */
export class ProductTrendForecastModule {
  readonly contract = PRODUCT_TREND_FORECAST_MODULE_CONTRACT;

  constructor(
    private readonly repository: ForecastRepository,
    private readonly engine: ProductTrendForecastEngine = defaultProductTrendForecastEngine,
  ) {}

  forecast(current: ProductTrend, history: ProductTrend[] = []) {
    return this.engine.forecast({ current, history });
  }

  async forecastAndPersist(
    workspaceId: string,
    current: ProductTrend,
    history: ProductTrend[] = [],
  ): Promise<ProductTrendForecast> {
    const forecastInput = this.engine.toForecastInput({ current, history });
    return this.repository.save(workspaceId, forecastInput);
  }

  async getForecast(workspaceId: string, productId: string): Promise<ProductTrendForecast | null> {
    return this.repository.getByProductId(workspaceId, productId);
  }

  async listForecasts(
    workspaceId: string,
    filters: {
      productId?: string;
      forecastDirection?: ForecastDirection;
      recommendedAction?: RecommendedAction;
    } = {},
  ): Promise<ProductTrendForecast[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for a product trend forecast module with optional custom dependencies. */
export function createProductTrendForecastModule(
  repository: ForecastRepository = createInMemoryForecastRepository(),
  engine: ProductTrendForecastEngine = defaultProductTrendForecastEngine,
): ProductTrendForecastModule {
  return new ProductTrendForecastModule(repository, engine);
}

export const productTrendForecastModule = createProductTrendForecastModule();
