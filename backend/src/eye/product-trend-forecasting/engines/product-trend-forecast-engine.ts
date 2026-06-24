import type { ProductTrend } from "../../product-trend-intelligence/models/product-trend.js";
import type { ProductTrendForecastCreateInput } from "../models/product-trend-forecast.js";
import {
  scoreProductTrendForecast,
  type ProductTrendForecastInput,
  type ProductTrendForecastBreakdown,
} from "../scoring/forecast-scoring.js";

/** Forecasts future product trend movement from M033 trend intelligence. */
export class ProductTrendForecastEngine {
  forecast(input: ProductTrendForecastInput): ProductTrendForecastBreakdown {
    return scoreProductTrendForecast(input);
  }

  toForecastInput(input: ProductTrendForecastInput): ProductTrendForecastCreateInput {
    return this.forecast(input);
  }
}

export const defaultProductTrendForecastEngine = new ProductTrendForecastEngine();
