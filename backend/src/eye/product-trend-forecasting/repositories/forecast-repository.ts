import type {
  ForecastDirection,
  ProductTrendForecast,
  ProductTrendForecastCreateInput,
  ProductTrendForecastUpdateInput,
  RecommendedAction,
} from "../models/product-trend-forecast.js";

export type ForecastListQuery = {
  workspaceId: string;
  productId?: string;
  trendId?: string;
  forecastDirection?: ForecastDirection;
  recommendedAction?: RecommendedAction;
  minConfidence?: number;
  limit?: number;
  offset?: number;
};

/** Persistence contract for product trend forecast records. */
export interface ForecastRepository {
  save(
    workspaceId: string,
    input: ProductTrendForecastCreateInput,
  ): Promise<ProductTrendForecast>;
  getById(workspaceId: string, id: string): Promise<ProductTrendForecast | null>;
  getByProductId(workspaceId: string, productId: string): Promise<ProductTrendForecast | null>;
  update(
    workspaceId: string,
    id: string,
    input: ProductTrendForecastUpdateInput,
  ): Promise<ProductTrendForecast>;
  delete(workspaceId: string, id: string): Promise<boolean>;
  list(query: ForecastListQuery): Promise<ProductTrendForecast[]>;
}
