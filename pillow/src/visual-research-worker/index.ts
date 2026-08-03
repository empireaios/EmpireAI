export {
  VisualResearchWorker,
  createVisualResearchWorker,
  resetVisualResearchWorkerForTesting,
  type VisualResearchWorkerOptions,
} from "./engine.js";
export type { VisualResearchWorkerDependencies } from "./integrations.js";
export {
  buildVisualResearchWorkerConfiguration,
  DEFAULT_VISUAL_RESEARCH_WORKER_CONFIGURATION,
  type VisualResearchWorkerConfiguration,
} from "./configuration.js";
export {
  VISUAL_RESEARCH_WORKER_ID,
  VISUAL_RESEARCH_WORKER_SYSTEM_PATH,
  VISUAL_RESEARCH_WORKER_IDENTITY,
  VRW_METADATA_VERSION,
  VRW_REPORT_VERSION,
  CONTENT_FORMATS,
  ASSET_TYPES,
  COPYRIGHT_STATUSES,
  USAGE_RIGHTS,
  COVERAGE_STATUSES,
  APPROVED_VISUAL_SOURCES,
  VRW_CAPABILITIES,
  INTEGRATION_TARGETS as VRW_INTEGRATION_TARGETS,
} from "./paths.js";
export type {
  VisualResearchWorkerState,
  VisualResearchReport,
  VisualResearchReport as VrwVisualResearchReport,
  VisualResearchWorkerInput,
  VisualResearchWorkerRunReport,
  VisualResearchWorkerCatalog,
  VisualResearchWorkerCockpitSnapshot,
  VisualResearchWorkerEngineRecord,
  VisualResearchWorkerValidationReport,
  VisualSceneRecord as VrwVisualSceneRecord,
  AssetType as VrwAssetType,
  CopyrightStatus as VrwCopyrightStatus,
  UsageRights as VrwUsageRights,
  CoverageStatus as VrwCoverageStatus,
  ContentFormat as VrwContentFormat,
  IntegrationHandshake as VrwIntegrationHandshake,
} from "./types.js";
export { resetVisualSequenceForTesting } from "./visual-builder.js";
export { appendVrwLog, getVrwLogs, resetVrwLogsForTesting } from "./vrw-logging.js";
