/** PILLOW-SHF-001 — Shopify Store Marketplace Integration exports (R1-10). */

export {
  ShopifyStoreMarketplaceIntegrationEngine,
  createShopifyStoreMarketplaceIntegrationEngine,
  resetShopifyStoreMarketplaceIntegrationForTesting,
} from "./engine.js";

export {
  buildShopifyStoreMarketplaceIntegrationConfiguration,
  DEFAULT_SHOPIFY_STORE_MARKETPLACE_INTEGRATION_CONFIGURATION,
  type ShopifyStoreMarketplaceIntegrationConfiguration,
} from "./configuration.js";

export {
  SHOPIFY_STORE_MARKETPLACE_INTEGRATION_SYSTEM_PATH,
  SHOPIFY_STORE_CONNECTOR_METADATA_VERSION,
  SHOPIFY_STORE_MARKETPLACE_ID,
  SHOPIFY_STORE_CAPABILITIES,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
} from "./paths.js";

export type {
  ShopifyStoreMarketplaceIntegrationEngineVersion,
  ShopifyStoreConnectorRecord,
  ShopifyStoreConnectorRunReport,
  ShopifyStoreMarketplaceIntegrationState,
  ShopifyStoreCockpitSnapshot,
  ShopifyStoreHealthReport,
  ShopifyStorePerformanceStats,
  ConnectShopifyStoreInput,
  RouteShopifyStoreApiInput,
  HandleShopifyStoreWebhookInput,
  ShopifyStoreCapability,
  EngineStatus,
  OperationalState,
  AuthenticationStatus,
  ConnectionStatus,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
