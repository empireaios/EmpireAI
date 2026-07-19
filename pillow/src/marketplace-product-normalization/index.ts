/** PILLOW-MPN-001 — Marketplace Product Normalization exports (R1-12). */

export {
  MarketplaceProductNormalizationEngine,
  createMarketplaceProductNormalizationEngine,
  resetMarketplaceProductNormalizationForTesting,
} from "./engine.js";

export {
  buildMarketplaceProductNormalizationConfiguration,
  DEFAULT_MARKETPLACE_PRODUCT_NORMALIZATION_CONFIGURATION,
  type MarketplaceProductNormalizationConfiguration,
} from "./configuration.js";

export {
  MARKETPLACE_PRODUCT_NORMALIZATION_SYSTEM_PATH,
  MPN_METADATA_VERSION,
  UNIFIED_PRODUCT_SCHEMA_VERSION,
  SUPPORTED_MARKETPLACE_IDENTIFIERS,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
} from "./paths.js";

export type {
  MarketplaceProductNormalizationEngineVersion,
  NormalizedProductRecord,
  ProductNormalizationReport,
  MarketplaceProductNormalizationState,
  ProductNormalizationCockpitSnapshot,
  ProductNormalizationHealthReport,
  ProductNormalizationPerformanceStats,
  NormalizeProductsInput,
  NormalizeProductInput,
  DetectDuplicatesInput,
  RawMarketplaceProductPayload,
  DuplicateProductGroup,
  MissingAttributeFinding,
  InvalidProductFinding,
  ProductVariant,
  EngineStatus,
  HealthStatus,
  SupportedMarketplaceIdentifier,
} from "./types.js";
