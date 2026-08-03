/** PILLOW-CLM-001 — Company Lifecycle Manager exports (X2-17). */

export {
  CompanyLifecycleManager,
  createCompanyLifecycleManager,
  resetCompanyLifecycleManagerForTesting,
  type CompanyLifecycleManagerDependencies,
  type CompanyLifecycleManagerOptions,
} from "./engine.js";

export {
  buildCompanyLifecycleManagerConfiguration,
  DEFAULT_COMPANY_LIFECYCLE_MANAGER_CONFIGURATION,
  type CompanyLifecycleManagerConfiguration,
} from "./configuration.js";

export {
  COMPANY_LIFECYCLE_MANAGER_SYSTEM_PATH,
  CLM_METADATA_VERSION,
  COMPANY_LIFECYCLE_MANAGER_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  CLM_CAPABILITIES,
  LIFECYCLE_STAGES,
  LIFECYCLE_STATUSES,
} from "./paths.js";

export { appendClmLog, getClmLogs, resetClmLogsForTesting } from "./clm-logging.js";

export type {
  CompanyLifecycleManagerState,
  LifecycleRecord,
  LifecycleRecommendation,
  CompanyLifecycleEngineRecord,
  LifecycleRunReport,
  LifecycleCockpitSnapshot,
  LifecycleHealthReport,
  LifecyclePerformanceStats,
  ConnectCompanyLifecycleManagerInput,
  ManageLifecycleStageInput,
  AssessMaturityInput,
  DetectTransitionsInput,
  ManageStageActionInput,
  GenerateLifecycleRecommendationsInput,
  RunLifecycleAnalyticsInput,
  RunLifecycleDiagnosticsInput,
} from "./types.js";
