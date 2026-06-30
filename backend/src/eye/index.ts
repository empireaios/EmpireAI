/** Eye — Live Product Intelligence Connector framework (Mission 018). */

export type {
  EyeProviderId,
  EyeSignalDomain,
  EyeConnectorStatus,
  EyeObservationMode,
  EyeHealthState,
  EyeConnectorContext,
  EyeObserveRequest,
  EyeRawObservation,
  EyeConnectorHealth,
  EyeConnectorDefinition,
  EyePollSchedule,
  EyeConnectorStateRecord,
} from "./types.js";

export type { EyeConnector } from "./contract/eye-connector.js";

export type {
  ProductSignal,
  ProductSignalQuery,
  ProductTrendDirection,
} from "./contract/product-signal.js";

export type {
  EyeSignalEnvelope,
  ProductSignalEnvelope,
  ConfidenceFactor,
} from "./contract/signal-envelope.js";

export {
  EyeConnectorRegistry,
  defaultEyeConnectorRegistry,
} from "./registry/connector-registry.js";

export {
  ConnectorScheduler,
  EyeConnectorRuntime,
  type PollResult,
  type ConnectorSchedulerOptions,
} from "./scheduler/connector-scheduler.js";

export { HealthMonitor, type HealthRecord, type HealthMonitorOptions } from "./health/health-monitor.js";

export {
  RetryPolicy,
  DEFAULT_RETRY_POLICY,
  type RetryPolicyConfig,
  type RetryContext,
} from "./retry/retry-policy.js";

export {
  TokenBucketRateLimiter,
  SlidingWindowRateLimiter,
  ConnectorRateLimiterRegistry,
  type RateLimiterConfig,
} from "./ratelimit/rate-limiter.js";

export {
  EyeEventPipeline,
  type EyeConnectorEvent,
  type EyeConnectorEventType,
  type EyeEventHandler,
} from "./events/event-pipeline.js";

export {
  SignalNormalizationPipeline,
  defaultSignalNormalizationPipeline,
  buildSubjectKey,
} from "./pipelines/signal-normalization-pipeline.js";

export {
  MockEyeConnector,
  createMockEyeConnector,
  type MockConnectorOptions,
} from "./connectors/mock/mock-connector.js";

export {
  AmazonConnector,
  createAmazonConnector,
  type AmazonConnectorOptions,
} from "./connectors/amazon/amazon-connector.js";

export {
  AMAZON_PROVIDER_ID,
  AMAZON_PROVIDER_NAME,
  mapAmazonToObservationPayload,
  mapObservationPayloadToRaw,
  mapObservationPayloadToProductSignal,
  mapObservationPayloadToEnvelope,
  type AmazonObservationPayload,
} from "./connectors/amazon/mappers/product-signal-mapper.js";

export type { AmazonProduct, AmazonProductQuery, AmazonProductImage } from "./connectors/amazon/models/amazon-product.js";
export type { ProductRanking } from "./connectors/amazon/models/product-ranking.js";
export type { ReviewStatistics, RatingDistribution } from "./connectors/amazon/models/review-statistics.js";
export type {
  PriceSnapshot,
  PriceHistory,
  PriceHistoryProvider,
} from "./connectors/amazon/interfaces/price-history.js";
export type {
  BestsellerCategoryNode,
  BestsellerCategoryListing,
  BestsellerCategoryProvider,
} from "./connectors/amazon/interfaces/bestseller-category.js";
export type {
  AmazonProductParser,
  AmazonProductDataSource,
} from "./connectors/amazon/parsers/amazon-product-parser.js";
export { MockAmazonProductParser } from "./connectors/amazon/parsers/amazon-product-parser.js";
export type { BestsellerParser } from "./connectors/amazon/parsers/bestseller-parser.js";
export {
  MockBestsellerParser,
  MockBestsellerCategoryProvider,
} from "./connectors/amazon/parsers/bestseller-parser.js";
export {
  MockAmazonDataSource,
  createMockAmazonDataSource,
} from "./connectors/amazon/mock/mock-amazon-data-source.js";
export {
  SAMPLE_ASINS,
  MOCK_BESTSELLER_ASINS,
  MOCK_AMAZON_PRODUCTS,
  MOCK_PRODUCT_RANKINGS,
  MOCK_REVIEW_STATISTICS,
  MOCK_PRICE_HISTORIES,
  MOCK_CATEGORY_TREE,
} from "./connectors/amazon/mock/fixtures.js";

export {
  GoogleTrendsConnector,
  createGoogleTrendsConnector,
  type GoogleTrendsConnectorOptions,
} from "./connectors/google-trends/google-trends-connector.js";

export {
  GOOGLE_TRENDS_PROVIDER_ID,
  GOOGLE_TRENDS_PROVIDER_NAME,
  mapTrendsToObservationPayload,
  mapObservationPayloadToRaw as mapGoogleTrendsObservationPayloadToRaw,
  mapObservationPayloadToProductSignal as mapGoogleTrendsObservationPayloadToProductSignal,
  mapObservationPayloadToEnvelope as mapGoogleTrendsObservationPayloadToEnvelope,
  type GoogleTrendsObservationPayload,
} from "./connectors/google-trends/mappers/product-signal-mapper.js";

export type { TrendsQuery } from "./connectors/google-trends/models/trends-query.js";
export type { SearchInterest, SearchInterestPoint } from "./connectors/google-trends/models/search-interest.js";
export type {
  TrendMomentum,
  SeasonalityProfile,
  GeoPopularity,
  BreakoutTrend,
} from "./connectors/google-trends/models/trend-momentum.js";
export type {
  TrendsParser,
  TrendsDataSource,
  TrendingCategoryListing,
  TrendingTopicsProvider,
} from "./connectors/google-trends/parsers/trends-parser.js";
export { MockTrendsParser, MockTrendingTopicsProvider } from "./connectors/google-trends/parsers/trends-parser.js";
export {
  MockTrendsDataSource,
  createMockTrendsDataSource,
} from "./connectors/google-trends/mock/mock-trends-data-source.js";
export {
  SAMPLE_KEYWORDS,
  MOCK_TRENDING_KEYWORDS,
  MOCK_SEARCH_INTEREST,
  MOCK_TREND_MOMENTUM,
  MOCK_SEASONALITY,
  MOCK_GEO_POPULARITY,
  MOCK_BREAKOUT_TRENDS,
} from "./connectors/google-trends/mock/fixtures.js";

export { wrapProductIntelligenceConnector } from "./adapters/product-intelligence-bridge.js";

export {
  COMPETITOR_INTELLIGENCE_MODULE_ID,
  COMPETITOR_INTELLIGENCE_MODULE_CONTRACT,
  CompetitorIntelligenceModule,
  createCompetitorIntelligenceModule,
  competitorIntelligenceModule,
  generateCompetitorIntelligence,
  runCompetitorWatchCycle,
  CompetitorWatchConnector,
  createCompetitorWatchConnector,
  COMPETITOR_WATCH_PROVIDER_ID,
} from "./competitor-intelligence/index.js";
