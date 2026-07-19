/** PILLOW-TTS-001 — TikTok Shop Marketplace Integration exports (R1-09). */

export {
  TikTokShopMarketplaceIntegrationEngine,
  createTikTokShopMarketplaceIntegrationEngine,
  resetTikTokShopMarketplaceIntegrationForTesting,
} from "./engine.js";

export {
  buildTikTokShopMarketplaceIntegrationConfiguration,
  DEFAULT_TIKTOK_SHOP_MARKETPLACE_INTEGRATION_CONFIGURATION,
  type TikTokShopMarketplaceIntegrationConfiguration,
} from "./configuration.js";

export {
  TIKTOK_SHOP_MARKETPLACE_INTEGRATION_SYSTEM_PATH,
  TIKTOK_SHOP_CONNECTOR_METADATA_VERSION,
  TIKTOK_SHOP_MARKETPLACE_ID,
  TIKTOK_SHOP_CAPABILITIES,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
} from "./paths.js";

export type {
  TikTokShopMarketplaceIntegrationEngineVersion,
  TikTokShopConnectorRecord,
  TikTokShopConnectorRunReport,
  TikTokShopMarketplaceIntegrationState,
  TikTokShopCockpitSnapshot,
  TikTokShopHealthReport,
  TikTokShopPerformanceStats,
  ConnectTikTokShopInput,
  RouteTikTokShopApiInput,
  HandleTikTokShopEventInput,
  TikTokShopCapability,
  EngineStatus,
  OperationalState,
  AuthenticationStatus,
  ConnectionStatus,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
