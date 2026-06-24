import { z } from "zod";

import { trendSignalSchema, type TrendSignal } from "./trend-signal.js";

export type ProductTrendId = string;

export const PRODUCT_TREND_DIRECTIONS = ["RISING", "STABLE", "DECLINING"] as const;
export type ProductTrendDirection = (typeof PRODUCT_TREND_DIRECTIONS)[number];

/** Product trend intelligence derived from evidence summaries over time. */
export type ProductTrend = {
  id: ProductTrendId;
  workspaceId: string;
  productId: string;
  trendDirection: ProductTrendDirection;
  trendVelocity: number;
  trendStrength: number;
  trendConfidence: number;
  momentumScore: number;
  volatilityScore: number;
  snapshotCount: number;
  signals: TrendSignal[];
  createdAt: string;
  updatedAt: string;
};

export type ProductTrendCreateInput = Omit<
  ProductTrend,
  "id" | "workspaceId" | "createdAt" | "updatedAt"
>;

export type ProductTrendUpdateInput = Partial<Omit<ProductTrendCreateInput, "productId">>;

const isoTimestamp = z.string().datetime({ offset: true });

export const productTrendSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  productId: z.string().min(1),
  trendDirection: z.enum(PRODUCT_TREND_DIRECTIONS),
  trendVelocity: z.number(),
  trendStrength: z.number().min(0).max(100),
  trendConfidence: z.number().min(0).max(100),
  momentumScore: z.number().min(0).max(100),
  volatilityScore: z.number().min(0).max(100),
  snapshotCount: z.number().int().min(1),
  signals: z.array(trendSignalSchema),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a ProductTrend record shape. */
export function validateProductTrend(value: unknown): ProductTrend {
  return productTrendSchema.parse(value);
}

/** Maps velocity to a trend direction label. */
export function resolveProductTrendDirection(velocity: number): ProductTrendDirection {
  if (velocity >= 8) return "RISING";
  if (velocity <= -8) return "DECLINING";
  return "STABLE";
}
