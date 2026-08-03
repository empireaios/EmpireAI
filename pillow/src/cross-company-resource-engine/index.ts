/** PILLOW-CCRE-001 — Cross-Company Resource Engine exports (X2-11). */

export {
  CrossCompanyResourceEngine,
  createCrossCompanyResourceEngine,
  resetCrossCompanyResourceEngineForTesting,
  type CrossCompanyResourceEngineDependencies,
  type CrossCompanyResourceEngineOptions,
} from "./engine.js";

export {
  buildCrossCompanyResourceEngineConfiguration,
  DEFAULT_CROSS_COMPANY_RESOURCE_ENGINE_CONFIGURATION,
  type CrossCompanyResourceEngineConfiguration,
} from "./configuration.js";

export {
  CROSS_COMPANY_RESOURCE_ENGINE_SYSTEM_PATH,
  CCRE_METADATA_VERSION,
  CROSS_COMPANY_RESOURCE_ENGINE_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  RESOURCE_CATEGORIES,
  ALLOCATION_STATUSES,
  CCRE_CAPABILITIES,
} from "./paths.js";

export { appendCcreLog, getCcreLogs, resetCcreLogsForTesting } from "./ccre-logging.js";

export type {
  CrossCompanyResourceEngineState,
  ResourceAllocationRecord,
  ResourceEngineRecord,
  ResourceRunReport,
  ResourceConflictSignal,
  ResourceRecommendation,
  ResourceCockpitSnapshot,
  ResourceHealthReport,
  ResourcePerformanceStats,
  ConnectCrossCompanyResourceInput,
  RegisterResourceInput,
  AllocateResourceInput,
  DetectIdleResourcesInput,
  DetectResourceConflictsInput,
  OptimizeResourcesInput,
  RecommendResourceInput,
  RunResourceDiagnosticsInput,
} from "./types.js";
