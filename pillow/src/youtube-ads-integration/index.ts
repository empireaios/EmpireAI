/** PILLOW-YAI-001 — YouTube Ads Integration exports (R5-05). */

export {
  YouTubeAdsIntegration,
  createYouTubeAdsIntegration,
  resetYouTubeAdsIntegrationForTesting,
} from "./engine.js";

export {
  buildYouTubeAdsIntegrationConfiguration,
  DEFAULT_YOUTUBE_ADS_INTEGRATION_CONFIGURATION,
  type YouTubeAdsIntegrationConfiguration,
} from "./configuration.js";

export {
  YOUTUBE_ADS_INTEGRATION_SYSTEM_PATH,
  YAI_METADATA_VERSION,
  YOUTUBE_ADS_INTEGRATION_ID,
  YAI_CAPABILITIES,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
} from "./paths.js";

export type {
  YouTubeAdsIntegrationEngineVersion,
  YouTubeAdsEngineRecord,
  YouTubeAdsRecord,
  YouTubeAdsRunReport,
  YouTubeAdsIntegrationState,
  YouTubeAdsCockpitSnapshot,
  YouTubeAdsHealthReport,
  YouTubeAdsPerformanceStats,
  ConnectYouTubeAdsInput,
  ManageAdvertiserAccountInput,
  CreateYouTubeCampaignInput,
  CreateAdGroupInput,
  ManageVideoAssetInput,
  CreateVideoAdvertisementInput,
  RetrieveYouTubePerformanceInput,
  SyncYouTubeCampaignStatusInput,
  YaiCapability,
  EngineStatus,
  OperationalState,
  AuthenticationStatus,
  ConnectionStatus,
  CampaignStatus,
  SynchronizationStatus,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
