export {
  TREND_SIGNAL_TYPES,
  trendSignalSchema,
  validateTrendSignal,
} from "./models/trend-signal.js";
export type { TrendSignal, TrendSignalType, EvidenceSnapshot } from "./models/trend-signal.js";

export {
  PRODUCT_TREND_DIRECTIONS,
  productTrendSchema,
  validateProductTrend,
  resolveProductTrendDirection,
} from "./models/product-trend.js";
export type {
  ProductTrend,
  ProductTrendId,
  ProductTrendCreateInput,
  ProductTrendUpdateInput,
  ProductTrendDirection,
} from "./models/product-trend.js";

export type { TrendListQuery, TrendRepository } from "./repositories/trend-repository.js";

export {
  InMemoryTrendRepository,
  createInMemoryTrendRepository,
} from "./repositories/in-memory-trend-repository.js";

export {
  TREND_SIGNAL_WEIGHTS,
  scoreProductTrend,
  trendScoring,
} from "./scoring/trend-scoring.js";
export type {
  ProductTrendAnalysisInput,
  ProductTrendScoreBreakdown,
} from "./scoring/trend-scoring.js";

export {
  ProductTrendEngine,
  defaultProductTrendEngine,
} from "./engines/product-trend-engine.js";

export {
  PRODUCT_TREND_MODULE_ID,
  PRODUCT_TREND_MODULE_VERSION,
  PRODUCT_TREND_CAPABILITIES,
  PRODUCT_TREND_MODULE_CONTRACT,
  ProductTrendModule,
  createProductTrendModule,
  productTrendModule,
} from "./contract/product-trend-module.js";
export type {
  ProductTrendModuleId,
  ProductTrendCapability,
  ProductTrendModuleContract,
} from "./contract/product-trend-module.js";
