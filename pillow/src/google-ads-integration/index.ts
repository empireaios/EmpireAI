/** PILLOW-GAI-001 — Google Ads Integration exports (R5-03). */

export {
  GoogleAdsIntegration,
  createGoogleAdsIntegration,
  resetGoogleAdsIntegrationForTesting,
} from "./engine.js";

export {
  buildGoogleAdsIntegrationConfiguration,
  DEFAULT_GOOGLE_ADS_INTEGRATION_CONFIGURATION,
  type GoogleAdsIntegrationConfiguration,
} from "./configuration.js";

export {
  GOOGLE_ADS_INTEGRATION_SYSTEM_PATH,
  GAI_METADATA_VERSION,
  GOOGLE_ADS_INTEGRATION_ID,
  GAI_CAPABILITIES,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
} from "./paths.js";

export type {
  GoogleAdsIntegrationEngineVersion,
  GoogleAdsEngineRecord,
  GoogleAdsRecord,
  GoogleAdsRunReport,
  GoogleAdsIntegrationState,
  GoogleAdsCockpitSnapshot,
  GoogleAdsHealthReport,
  GoogleAdsPerformanceStats,
  ConnectGoogleAdsInput,
  ManageCustomerAccountInput,
  ManageAdvertisingAccountInput,
  CreateGoogleCampaignInput,
  CreateAdGroupInput,
  CreateGoogleAdvertisementInput,
  RetrieveGooglePerformanceInput,
  SyncGoogleCampaignStatusInput,
  GaiCapability,
  EngineStatus,
  OperationalState,
  AuthenticationStatus,
  ConnectionStatus,
  CampaignStatus,
  SynchronizationStatus,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
