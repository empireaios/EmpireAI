import { z } from "zod";

import { forecastSignalSchema, type ForecastSignal } from "./forecast-signal.js";

export type ProductTrendForecastId = string;

export const FORECAST_DIRECTIONS = [
  "STRONGLY_RISING",
  "RISING",
  "STABLE",
  "DECLINING",
  "STRONGLY_DECLINING",
] as const;

export type ForecastDirection = (typeof FORECAST_DIRECTIONS)[number];

export const RECOMMENDED_ACTIONS = ["ACCUMULATE", "WATCH", "AVOID"] as const;
export type RecommendedAction = (typeof RECOMMENDED_ACTIONS)[number];

/** Forward-looking product trend forecast. */
export type ProductTrendForecast = {
  id: ProductTrendForecastId;
  workspaceId: string;
  productId: string;
  trendId: string;
  forecastDirection: ForecastDirection;
  forecastConfidence: number;
  momentumProjection: number;
  riskProjection: number;
  opportunityProjection: number;
  recommendedAction: RecommendedAction;
  signals: ForecastSignal[];
  snapshotCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ProductTrendForecastCreateInput = Omit<
  ProductTrendForecast,
  "id" | "workspaceId" | "createdAt" | "updatedAt"
>;

export type ProductTrendForecastUpdateInput = Partial<
  Omit<ProductTrendForecastCreateInput, "productId" | "trendId">
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const productTrendForecastSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  productId: z.string().min(1),
  trendId: z.string().min(1),
  forecastDirection: z.enum(FORECAST_DIRECTIONS),
  forecastConfidence: z.number().min(0).max(100),
  momentumProjection: z.number().min(0).max(100),
  riskProjection: z.number().min(0).max(100),
  opportunityProjection: z.number().min(0).max(100),
  recommendedAction: z.enum(RECOMMENDED_ACTIONS),
  signals: z.array(forecastSignalSchema),
  snapshotCount: z.number().int().min(1),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a ProductTrendForecast record shape. */
export function validateProductTrendForecast(value: unknown): ProductTrendForecast {
  return productTrendForecastSchema.parse(value);
}

/** Maps projected velocity to a forecast direction label. */
export function resolveForecastDirection(projectedVelocity: number): ForecastDirection {
  if (projectedVelocity >= 15) return "STRONGLY_RISING";
  if (projectedVelocity >= 8) return "RISING";
  if (projectedVelocity <= -15) return "STRONGLY_DECLINING";
  if (projectedVelocity <= -8) return "DECLINING";
  return "STABLE";
}

/** Maps forecast metrics to a recommended action label. */
export function resolveRecommendedAction(
  forecastDirection: ForecastDirection,
  opportunityProjection: number,
  riskProjection: number,
): RecommendedAction {
  if (
    (forecastDirection === "STRONGLY_RISING" || forecastDirection === "RISING") &&
    opportunityProjection >= 65 &&
    riskProjection <= 45
  ) {
    return "ACCUMULATE";
  }
  if (
    forecastDirection === "DECLINING" ||
    forecastDirection === "STRONGLY_DECLINING" ||
    riskProjection >= 70
  ) {
    return "AVOID";
  }
  return "WATCH";
}
