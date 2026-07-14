/** PILLOW-AMZ-001 — Amazon Marketplace Integration exports (R1-02). */

export {
  AmazonMarketplaceIntegrationEngine,
  createAmazonMarketplaceIntegrationEngine,
  resetAmazonMarketplaceIntegrationForTesting,
} from "./engine.js";

export {
  buildAmazonMarketplaceIntegrationConfiguration,
  DEFAULT_AMAZON_MARKETPLACE_INTEGRATION_CONFIGURATION,
  type AmazonMarketplaceIntegrationConfiguration,
} from "./configuration.js";

export {
  AMAZON_MARKETPLACE_INTEGRATION_SYSTEM_PATH,
  AMAZON_CONNECTOR_METADATA_VERSION,
  AMAZON_MARKETPLACE_ID,
  AMAZON_CAPABILITIES,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
} from "./paths.js";

export type {
  AmazonMarketplaceIntegrationEngineVersion,
  AmazonConnectorRecord,
  AmazonConnectorRunReport,
  AmazonMarketplaceIntegrationState,
  AmazonCockpitSnapshot,
  AmazonHealthReport,
  AmazonPerformanceStats,
  ConnectAmazonInput,
  RouteAmazonApiInput,
  HandleAmazonEventInput,
  AmazonCapability,
  EngineStatus,
  OperationalState,
  AuthenticationStatus,
  ConnectionStatus,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
