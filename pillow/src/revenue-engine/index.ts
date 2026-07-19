/** PILLOW-RE-001 — Revenue Engine exports (R3-04). */

export {
  RevenueEngine,
  createRevenueEngine,
  resetRevenueEngineForTesting,
} from "./engine.js";

export {
  buildRevenueEngineConfiguration,
  DEFAULT_REVENUE_ENGINE_CONFIGURATION,
  type RevenueEngineConfiguration,
} from "./configuration.js";

export {
  REVENUE_ENGINE_SYSTEM_PATH,
  RE_METADATA_VERSION,
  REVENUE_ENGINE_ID,
  RE_CAPABILITIES,
  REVENUE_SOURCES,
} from "./paths.js";

export type {
  RevenueEngineVersion,
  RevenueEngineRecord,
  RevenueRecord,
  RevenueAggregationSummary,
  RevenueEngineRunReport,
  RevenueEngineState,
  RevenueCockpitSnapshot,
  RevenueHealthReport,
  RevenuePerformanceStats,
  ConnectRevenueEngineInput,
  RecordRevenueEventInput,
  RecordCompletedPaymentInput,
  RecordMarketplaceRevenueInput,
  RecordSupplierSettlementInput,
  RecordRevenueRefundInput,
  AggregateRevenueInput,
  RevenueSource,
  EngineStatus,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
