/** PILLOW-MHM-001 — Marketplace Health Monitor exports (R1-14). */

export {
  MarketplaceHealthMonitorEngine,
  createMarketplaceHealthMonitorEngine,
  resetMarketplaceHealthMonitorForTesting,
} from "./engine.js";

export {
  buildMarketplaceHealthMonitorConfiguration,
  DEFAULT_MARKETPLACE_HEALTH_MONITOR_CONFIGURATION,
  type MarketplaceHealthMonitorConfiguration,
} from "./configuration.js";

export {
  MARKETPLACE_HEALTH_MONITOR_SYSTEM_PATH,
  MHM_METADATA_VERSION,
  HEALTH_RECORD_SCHEMA_VERSION,
  SUPPORTED_MARKETPLACE_IDENTIFIERS,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
} from "./paths.js";

export type {
  MarketplaceHealthMonitorEngineVersion,
  MarketplaceHealthRecord,
  MarketplaceHealthCheckReport,
  MarketplaceHealthMonitorState,
  MarketplaceHealthCockpitSnapshot,
  MarketplaceHealthMonitorHealthReport,
  MarketplaceHealthMonitorPerformanceStats,
  RunHealthCheckInput,
  DetectFailuresInput,
  HealthAlert,
  FailureFinding,
  EngineStatus,
  HealthStatus,
  SupportedMarketplaceIdentifier,
} from "./types.js";
