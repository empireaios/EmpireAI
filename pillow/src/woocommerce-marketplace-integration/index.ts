/** PILLOW-WOO-001 — WooCommerce Marketplace Integration exports (R1-11). */

export {
  WooCommerceMarketplaceIntegrationEngine,
  createWooCommerceMarketplaceIntegrationEngine,
  resetWooCommerceMarketplaceIntegrationForTesting,
} from "./engine.js";

export {
  buildWooCommerceMarketplaceIntegrationConfiguration,
  DEFAULT_WOOCOMMERCE_MARKETPLACE_INTEGRATION_CONFIGURATION,
  type WooCommerceMarketplaceIntegrationConfiguration,
} from "./configuration.js";

export {
  WOOCOMMERCE_MARKETPLACE_INTEGRATION_SYSTEM_PATH,
  WOOCOMMERCE_CONNECTOR_METADATA_VERSION,
  WOOCOMMERCE_MARKETPLACE_ID,
  WOOCOMMERCE_CAPABILITIES,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
} from "./paths.js";

export type {
  WooCommerceMarketplaceIntegrationEngineVersion,
  WooCommerceConnectorRecord,
  WooCommerceConnectorRunReport,
  WooCommerceMarketplaceIntegrationState,
  WooCommerceCockpitSnapshot,
  WooCommerceHealthReport,
  WooCommercePerformanceStats,
  ConnectWooCommerceInput,
  RouteWooCommerceApiInput,
  HandleWooCommerceWebhookInput,
  WooCommerceCapability,
  EngineStatus,
  OperationalState,
  AuthenticationStatus,
  ConnectionStatus,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
