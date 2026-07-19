/** PILLOW-1688-001 — 1688 Integration exports (R2-04). */

export {
  Oss1688IntegrationEngine,
  createOss1688IntegrationEngine,
  resetOss1688IntegrationForTesting,
} from "./engine.js";

export {
  buildOss1688IntegrationConfiguration,
  DEFAULT_OSS1688_INTEGRATION_CONFIGURATION,
  type Oss1688IntegrationConfiguration,
} from "./configuration.js";

export {
  OSS1688_INTEGRATION_SYSTEM_PATH,
  OSS1688_CONNECTOR_METADATA_VERSION,
  OSS1688_SUPPLIER_ID,
  OSS1688_CAPABILITIES,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
} from "./paths.js";

export type {
  Oss1688IntegrationEngineVersion,
  Oss1688ConnectorRecord,
  Oss1688ConnectorRunReport,
  Oss1688IntegrationState,
  Oss1688CockpitSnapshot,
  Oss1688HealthReport,
  Oss1688PerformanceStats,
  ConnectOss1688Input,
  RouteOss1688ApiInput,
  HandleOss1688WebhookInput,
  Oss1688Capability,
  EngineStatus,
  OperationalState,
  AuthenticationStatus,
  ConnectionStatus,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
