/** PILLOW-AEX-001 — AliExpress Integration exports (R2-03). */

export {
  AliExpressIntegrationEngine,
  createAliExpressIntegrationEngine,
  resetAliExpressIntegrationForTesting,
} from "./engine.js";

export {
  buildAliExpressIntegrationConfiguration,
  DEFAULT_ALIEXPRESS_INTEGRATION_CONFIGURATION,
  type AliExpressIntegrationConfiguration,
} from "./configuration.js";

export {
  ALIEXPRESS_INTEGRATION_SYSTEM_PATH,
  AEX_CONNECTOR_METADATA_VERSION,
  AEX_SUPPLIER_ID,
  AEX_CAPABILITIES,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
} from "./paths.js";

export type {
  AliExpressIntegrationEngineVersion,
  AliExpressConnectorRecord,
  AliExpressConnectorRunReport,
  AliExpressIntegrationState,
  AliExpressCockpitSnapshot,
  AliExpressHealthReport,
  AliExpressPerformanceStats,
  ConnectAliExpressInput,
  RouteAliExpressApiInput,
  HandleAliExpressWebhookInput,
  AliExpressCapability,
  EngineStatus,
  OperationalState,
  AuthenticationStatus,
  ConnectionStatus,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
