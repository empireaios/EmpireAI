/** PILLOW-EBAY-001 — eBay Marketplace Integration exports (R1-08). */

export {
  EbayMarketplaceIntegrationEngine,
  createEbayMarketplaceIntegrationEngine,
  resetEbayMarketplaceIntegrationForTesting,
} from "./engine.js";

export {
  buildEbayMarketplaceIntegrationConfiguration,
  DEFAULT_EBAY_MARKETPLACE_INTEGRATION_CONFIGURATION,
  type EbayMarketplaceIntegrationConfiguration,
} from "./configuration.js";

export {
  EBAY_MARKETPLACE_INTEGRATION_SYSTEM_PATH,
  EBAY_CONNECTOR_METADATA_VERSION,
  EBAY_MARKETPLACE_ID,
  EBAY_CAPABILITIES,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
} from "./paths.js";

export type {
  EbayMarketplaceIntegrationEngineVersion,
  EbayConnectorRecord,
  EbayConnectorRunReport,
  EbayMarketplaceIntegrationState,
  EbayCockpitSnapshot,
  EbayHealthReport,
  EbayPerformanceStats,
  ConnectEbayInput,
  RouteEbayApiInput,
  HandleEbayEventInput,
  EbayCapability,
  EngineStatus,
  OperationalState,
  AuthenticationStatus,
  ConnectionStatus,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
