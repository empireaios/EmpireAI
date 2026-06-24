export {
  FORECAST_SIGNAL_TYPES,
  forecastSignalSchema,
  validateForecastSignal,
} from "./models/forecast-signal.js";
export type { ForecastSignal, ForecastSignalType, TrendSnapshot } from "./models/forecast-signal.js";

export {
  FORECAST_DIRECTIONS,
  RECOMMENDED_ACTIONS,
  productTrendForecastSchema,
  validateProductTrendForecast,
  resolveForecastDirection,
  resolveRecommendedAction,
} from "./models/product-trend-forecast.js";
export type {
  ProductTrendForecast,
  ProductTrendForecastId,
  ProductTrendForecastCreateInput,
  ProductTrendForecastUpdateInput,
  ForecastDirection,
  RecommendedAction,
} from "./models/product-trend-forecast.js";

export type { ForecastListQuery, ForecastRepository } from "./repositories/forecast-repository.js";

export {
  InMemoryForecastRepository,
  createInMemoryForecastRepository,
} from "./repositories/in-memory-forecast-repository.js";

export {
  FORECAST_SIGNAL_WEIGHTS,
  scoreProductTrendForecast,
  forecastScoring,
} from "./scoring/forecast-scoring.js";
export type {
  ProductTrendForecastInput,
  ProductTrendForecastBreakdown,
} from "./scoring/forecast-scoring.js";

export {
  ProductTrendForecastEngine,
  defaultProductTrendForecastEngine,
} from "./engines/product-trend-forecast-engine.js";

export {
  PRODUCT_TREND_FORECAST_MODULE_ID,
  PRODUCT_TREND_FORECAST_MODULE_VERSION,
  PRODUCT_TREND_FORECAST_CAPABILITIES,
  PRODUCT_TREND_FORECAST_MODULE_CONTRACT,
  ProductTrendForecastModule,
  createProductTrendForecastModule,
  productTrendForecastModule,
} from "./contract/product-trend-forecast-module.js";
export type {
  ProductTrendForecastModuleId,
  ProductTrendForecastCapability,
  ProductTrendForecastModuleContract,
} from "./contract/product-trend-forecast-module.js";
