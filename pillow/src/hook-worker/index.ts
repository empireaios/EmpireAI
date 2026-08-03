export {
  HookWorker,
  createHookWorker,
  resetHookWorkerForTesting,
  type HookWorkerOptions,
} from "./engine.js";
export type { HookWorkerDependencies } from "./integrations.js";
export {
  buildHookWorkerConfiguration,
  DEFAULT_HOOK_WORKER_CONFIGURATION,
  type HookWorkerConfiguration,
} from "./configuration.js";
export {
  HOOK_WORKER_ID,
  HOOK_WORKER_SYSTEM_PATH,
  HOOK_WORKER_IDENTITY,
  HKW_METADATA_VERSION,
  HKW_REPORT_VERSION,
  CONTENT_FORMATS,
  HOOK_TYPES,
  HKW_CAPABILITIES,
  INTEGRATION_TARGETS as HKW_INTEGRATION_TARGETS,
} from "./paths.js";
export type {
  HookWorkerState,
  HookReport,
  HookReport as HkwHookReport,
  HookWorkerInput,
  HookWorkerRunReport,
  HookWorkerCatalog,
  HookWorkerCockpitSnapshot,
  HookWorkerEngineRecord,
  HookWorkerValidationReport,
  HookEntry as HkwHookEntry,
  CuriosityGap as HkwCuriosityGap,
  RetentionLoop as HkwRetentionLoop,
  ContinuationMoment as HkwContinuationMoment,
  ContentFormat as HkwContentFormat,
  HookType as HkwHookType,
  IntegrationHandshake as HkwIntegrationHandshake,
} from "./types.js";
export { resetHookSequenceForTesting } from "./hook-builder.js";
export { appendHkwLog, getHkwLogs, resetHkwLogsForTesting } from "./hkw-logging.js";
