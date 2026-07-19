/** PILLOW-MON-001 — Marketplace Order Normalization exports (R1-13). */

export {
  MarketplaceOrderNormalizationEngine,
  createMarketplaceOrderNormalizationEngine,
  resetMarketplaceOrderNormalizationForTesting,
} from "./engine.js";

export {
  buildMarketplaceOrderNormalizationConfiguration,
  DEFAULT_MARKETPLACE_ORDER_NORMALIZATION_CONFIGURATION,
  type MarketplaceOrderNormalizationConfiguration,
} from "./configuration.js";

export {
  MARKETPLACE_ORDER_NORMALIZATION_SYSTEM_PATH,
  MON_METADATA_VERSION,
  UNIFIED_ORDER_SCHEMA_VERSION,
  SUPPORTED_MARKETPLACE_IDENTIFIERS,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
} from "./paths.js";

export type {
  MarketplaceOrderNormalizationEngineVersion,
  NormalizedOrderRecord,
  OrderNormalizationReport,
  MarketplaceOrderNormalizationState,
  OrderNormalizationCockpitSnapshot,
  OrderNormalizationHealthReport,
  OrderNormalizationPerformanceStats,
  NormalizeOrdersInput,
  NormalizeOrderInput,
  DetectDuplicatesInput,
  RawMarketplaceOrderPayload,
  DuplicateOrderGroup,
  MissingAttributeFinding,
  InvalidOrderFinding,
  OrderLineItem,
  PricingSummary,
  EngineStatus,
  HealthStatus,
  SupportedMarketplaceIdentifier,
} from "./types.js";
