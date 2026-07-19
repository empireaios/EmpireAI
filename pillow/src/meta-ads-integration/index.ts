/** PILLOW-MAI-001 — Meta Ads Integration exports (R5-02). */

export {
  MetaAdsIntegration,
  createMetaAdsIntegration,
  resetMetaAdsIntegrationForTesting,
} from "./engine.js";

export {
  buildMetaAdsIntegrationConfiguration,
  DEFAULT_META_ADS_INTEGRATION_CONFIGURATION,
  type MetaAdsIntegrationConfiguration,
} from "./configuration.js";

export {
  META_ADS_INTEGRATION_SYSTEM_PATH,
  MAI_METADATA_VERSION,
  META_ADS_INTEGRATION_ID,
  MAI_CAPABILITIES,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
} from "./paths.js";

export type {
  MetaAdsIntegrationEngineVersion,
  MetaEngineRecord,
  MetaAdsRecord,
  MetaAdsRunReport,
  MetaAdsIntegrationState,
  MetaCockpitSnapshot,
  MetaHealthReport,
  MetaPerformanceStats,
  ConnectMetaAdsInput,
  ManageBusinessAccountInput,
  ManageAdAccountInput,
  CreateCampaignInput,
  CreateAdSetInput,
  CreateAdvertisementInput,
  RetrievePerformanceInput,
  SyncCampaignStatusInput,
  MaiCapability,
  EngineStatus,
  OperationalState,
  AuthenticationStatus,
  ConnectionStatus,
  CampaignStatus,
  SynchronizationStatus,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
