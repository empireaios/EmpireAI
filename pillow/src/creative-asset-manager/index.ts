/** PILLOW-CRA-001 — Creative Asset Manager exports (R5-11). */

export {
  CreativeAssetManager,
  createCreativeAssetManager,
  resetCreativeAssetManagerForTesting,
  type CreativeAssetManagerDependencies,
} from "./engine.js";

export {
  buildCreativeAssetManagerConfiguration,
  DEFAULT_CREATIVE_ASSET_MANAGER_CONFIGURATION,
  type CreativeAssetManagerConfiguration,
} from "./configuration.js";

export {
  CREATIVE_ASSET_MANAGER_SYSTEM_PATH,
  CRA_METADATA_VERSION,
  CREATIVE_ASSET_MANAGER_ID,
  CRA_CAPABILITIES,
  ASSET_TYPES,
  APPROVAL_STATUSES,
  USAGE_STATUSES,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
} from "./paths.js";

export type {
  CreativeAssetManagerEngineVersion,
  CreativeEngineRecord,
  CreativeAssetRecord,
  CreativeRunReport,
  CreativeAssetManagerState,
  CreativeCockpitSnapshot,
  CreativeHealthReport,
  CreativePerformanceStats,
  ConnectCreativeAssetManagerInput,
  CreateAssetInput,
  UpdateAssetInput,
  CreateVersionInput,
  ApproveAssetInput,
  TagAssetInput,
  TrackUsageInput,
  SearchAssetsInput,
  ClassifyAssetInput,
  CraCapability,
  AssetType,
  ApprovalStatus,
  UsageStatus,
  EngineStatus,
  OperationalState,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
