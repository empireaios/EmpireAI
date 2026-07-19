/** PILLOW-CAM-001 — Campaign Manager exports (R5-07). */

export {
  CampaignManagerEngine,
  createCampaignManagerEngine,
  resetCampaignManagerForTesting,
  type CampaignManagerDependencies,
} from "./engine.js";

export {
  buildCampaignManagerConfiguration,
  DEFAULT_CAMPAIGN_MANAGER_CONFIGURATION,
  type CampaignManagerConfiguration,
} from "./configuration.js";

export {
  CAMPAIGN_MANAGER_SYSTEM_PATH,
  CAM_METADATA_VERSION,
  CAMPAIGN_MANAGER_ID,
  CAM_CAPABILITIES,
  MARKETING_CHANNELS,
  CAMPAIGN_OBJECTIVES,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
} from "./paths.js";

export type {
  CampaignManagerEngineVersion,
  CampaignEngineRecord,
  CampaignRecord,
  CampaignRunReport,
  CampaignManagerState,
  CampaignCockpitSnapshot,
  CampaignHealthReport,
  CampaignPerformanceStats,
  ConnectCampaignManagerInput,
  CreateCampaignInput,
  UpdateLifecycleInput,
  SetObjectiveInput,
  ScheduleCampaignInput,
  UpdateStatusInput,
  CoordinateChannelsInput,
  TrackExecutionInput,
  DetectFailuresInput,
  ApproveCampaignInput,
  CamCapability,
  MarketingChannel,
  CampaignObjective,
  CampaignStatus,
  ExecutionStatus,
  EngineStatus,
  OperationalState,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
