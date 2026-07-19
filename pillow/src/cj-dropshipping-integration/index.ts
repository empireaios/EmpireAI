/** PILLOW-CJ-001 — CJdropshipping Integration exports (R2-02). */

export {
  CjDropshippingIntegrationEngine,
  createCjDropshippingIntegrationEngine,
  resetCjDropshippingIntegrationForTesting,
} from "./engine.js";

export {
  buildCjDropshippingIntegrationConfiguration,
  DEFAULT_CJDROPSHIPPING_INTEGRATION_CONFIGURATION,
  type CjDropshippingIntegrationConfiguration,
} from "./configuration.js";

export {
  CJDROPSHIPPING_INTEGRATION_SYSTEM_PATH,
  CJ_CONNECTOR_METADATA_VERSION,
  CJ_SUPPLIER_ID,
  CJ_CAPABILITIES,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
} from "./paths.js";

export type {
  CjDropshippingIntegrationEngineVersion,
  CjConnectorRecord,
  CjConnectorRunReport,
  CjDropshippingIntegrationState,
  CjCockpitSnapshot,
  CjHealthReport,
  CjPerformanceStats,
  ConnectCjDropshippingInput,
  RouteCjApiInput,
  HandleCjWebhookInput,
  CjCapability,
  EngineStatus,
  OperationalState,
  AuthenticationStatus,
  ConnectionStatus,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
