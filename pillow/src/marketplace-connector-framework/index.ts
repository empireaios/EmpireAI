/** PILLOW-MCF-001 — Marketplace Connector Framework exports (R1-01). */

export {
  MarketplaceConnectorFrameworkEngine,
  createMarketplaceConnectorFrameworkEngine,
  resetMarketplaceConnectorFrameworkForTesting,
} from "./engine.js";

export {
  buildMarketplaceConnectorFrameworkConfiguration,
  DEFAULT_MARKETPLACE_CONNECTOR_FRAMEWORK_CONFIGURATION,
  type MarketplaceConnectorFrameworkConfiguration,
} from "./configuration.js";

export {
  MARKETPLACE_CONNECTOR_FRAMEWORK_SYSTEM_PATH,
  CONNECTOR_METADATA_VERSION,
  ENGINE_STATUSES,
  CONNECTOR_STATES,
  CONNECTOR_TYPES,
  AUTHENTICATION_METHODS,
  FRAMEWORK_CAPABILITIES,
} from "./paths.js";

export type {
  MarketplaceConnectorFrameworkEngineVersion,
  EngineStatus,
  ConnectorState,
  ConnectorType,
  AuthenticationMethod,
  FrameworkCapability,
  MarketplaceConnectorDefinition,
  MarketplaceConnectorRecord,
  NormalizedApiRequest,
  NormalizedApiResponse,
  AuthenticationResult,
  WebhookResult,
  ConnectorValidationReport,
  FrameworkRunReport,
  FrameworkHealthReport,
  FrameworkPerformanceStats,
  MarketplaceConnectorFrameworkState,
  FrameworkCockpitSnapshot,
  RegisterConnectorInput,
  RouteApiRequestInput,
  HandleWebhookInput,
  IMarketplaceConnectorPlugin,
} from "./types.js";
