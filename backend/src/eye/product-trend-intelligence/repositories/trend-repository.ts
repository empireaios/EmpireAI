import type {
  ProductTrend,
  ProductTrendCreateInput,
  ProductTrendUpdateInput,
} from "../models/product-trend.js";
import type { ProductTrendDirection } from "../models/product-trend.js";

export type TrendListQuery = {
  workspaceId: string;
  productId?: string;
  trendDirection?: ProductTrendDirection;
  minMomentumScore?: number;
  limit?: number;
  offset?: number;
};

/** Persistence contract for product trend intelligence records. */
export interface TrendRepository {
  save(workspaceId: string, input: ProductTrendCreateInput): Promise<ProductTrend>;
  getById(workspaceId: string, id: string): Promise<ProductTrend | null>;
  getByProductId(workspaceId: string, productId: string): Promise<ProductTrend | null>;
  update(
    workspaceId: string,
    id: string,
    input: ProductTrendUpdateInput,
  ): Promise<ProductTrend>;
  delete(workspaceId: string, id: string): Promise<boolean>;
  list(query: TrendListQuery): Promise<ProductTrend[]>;
}
