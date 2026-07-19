/** PILLOW-TAI-001 — TikTok Ads Integration exports (R5-04). */

export {
  TikTokAdsIntegration,
  createTikTokAdsIntegration,
  resetTikTokAdsIntegrationForTesting,
} from "./engine.js";

export {
  buildTikTokAdsIntegrationConfiguration,
  DEFAULT_TIKTOK_ADS_INTEGRATION_CONFIGURATION,
  type TikTokAdsIntegrationConfiguration,
} from "./configuration.js";

export {
  TIKTOK_ADS_INTEGRATION_SYSTEM_PATH,
  TAI_METADATA_VERSION,
  TIKTOK_ADS_INTEGRATION_ID,
  TAI_CAPABILITIES,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
} from "./paths.js";

export type {
  TikTokAdsIntegrationEngineVersion,
  TikTokAdsEngineRecord,
  TikTokAdsRecord,
  TikTokAdsRunReport,
  TikTokAdsIntegrationState,
  TikTokAdsCockpitSnapshot,
  TikTokAdsHealthReport,
  TikTokAdsPerformanceStats,
  ConnectTikTokAdsInput,
  ManageAdvertiserAccountInput,
  CreateTikTokCampaignInput,
  CreateAdGroupInput,
  CreateTikTokAdvertisementInput,
  RetrieveTikTokPerformanceInput,
  SyncTikTokCampaignStatusInput,
  SyncTikTokAudienceInput,
  TaiCapability,
  EngineStatus,
  OperationalState,
  AuthenticationStatus,
  ConnectionStatus,
  CampaignStatus,
  SynchronizationStatus,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
