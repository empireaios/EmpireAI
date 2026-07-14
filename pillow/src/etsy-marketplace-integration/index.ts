/** PILLOW-ETSY-001 — Etsy Marketplace Integration exports (R1-07). */

export {
  EtsyMarketplaceIntegrationEngine,
  createEtsyMarketplaceIntegrationEngine,
  resetEtsyMarketplaceIntegrationForTesting,
} from "./engine.js";

export {
  buildEtsyMarketplaceIntegrationConfiguration,
  DEFAULT_ETSY_MARKETPLACE_INTEGRATION_CONFIGURATION,
  type EtsyMarketplaceIntegrationConfiguration,
} from "./configuration.js";

export {
  ETSY_MARKETPLACE_INTEGRATION_SYSTEM_PATH,
  ETSY_CONNECTOR_METADATA_VERSION,
  ETSY_MARKETPLACE_ID,
  ETSY_CAPABILITIES,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
} from "./paths.js";

export type {
  EtsyMarketplaceIntegrationEngineVersion,
  EtsyConnectorRecord,
  EtsyConnectorRunReport,
  EtsyMarketplaceIntegrationState,
  EtsyCockpitSnapshot,
  EtsyHealthReport,
  EtsyPerformanceStats,
  ConnectEtsyInput,
  RouteEtsyApiInput,
  HandleEtsyEventInput,
  EtsyCapability,
  EngineStatus,
  OperationalState,
  AuthenticationStatus,
  ConnectionStatus,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
