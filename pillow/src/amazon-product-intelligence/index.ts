/** PILLOW-AMZPI-001 — Amazon Product Intelligence exports (R1-03). */

export {
  AmazonProductIntelligenceEngine,
  createAmazonProductIntelligenceEngine,
  resetAmazonProductIntelligenceForTesting,
} from "./engine.js";

export {
  buildAmazonProductIntelligenceConfiguration,
  DEFAULT_AMAZON_PRODUCT_INTELLIGENCE_CONFIGURATION,
  type AmazonProductIntelligenceConfiguration,
} from "./configuration.js";

export {
  AMAZON_PRODUCT_INTELLIGENCE_SYSTEM_PATH,
  AMAZON_PRODUCT_METADATA_VERSION,
  AMAZON_PRODUCT_MARKETPLACE_ID,
  AMAZON_CATALOG_API_PATHS,
} from "./paths.js";

export type {
  AmazonProductIntelligenceEngineVersion,
  AmazonProductRecord,
  AmazonProductSyncReport,
  AmazonProductIntelligenceState,
  AmazonProductCockpitSnapshot,
  AmazonProductHealthReport,
  AmazonProductPerformanceStats,
  AmazonProductChangeSet,
  SyncAmazonProductsInput,
  FetchAmazonProductInput,
  ProductStatus,
  SynchronizationStatus,
  EngineStatus,
  HealthStatus,
} from "./types.js";
