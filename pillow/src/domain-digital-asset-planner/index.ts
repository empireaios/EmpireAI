/** PILLOW-DAP-001 — Domain & Digital Asset Planner exports (X1-06). */

export {
  DomainDigitalAssetPlanner,
  createDomainDigitalAssetPlanner,
  resetDomainDigitalAssetPlannerForTesting,
  type DomainDigitalAssetPlannerDependencies,
  type DomainDigitalAssetPlannerOptions,
} from "./engine.js";

export {
  buildDomainDigitalAssetPlannerConfiguration,
  DEFAULT_DOMAIN_DIGITAL_ASSET_PLANNER_CONFIGURATION,
  type DomainDigitalAssetPlannerConfiguration,
} from "./configuration.js";

export {
  DOMAIN_DIGITAL_ASSET_PLANNER_SYSTEM_PATH,
  DAP_METADATA_VERSION,
  DOMAIN_DIGITAL_ASSET_PLANNER_ID,
  DAP_CAPABILITIES,
} from "./paths.js";

export { appendDapLog, getDapLogs, resetDapLogsForTesting } from "./dap-logging.js";

export type {
  DomainDigitalAssetPlannerState,
  DigitalAssetPlanRecord,
  DigitalAssetRunReport,
  DigitalAssetEngineRecord,
  DigitalAssetCockpitSnapshot,
  DigitalAssetHealthReport,
  DigitalAssetPerformanceStats,
  ConnectDomainDigitalAssetPlannerInput,
  CreateDigitalAssetPlanInput,
  DigitalAssetActionInput,
} from "./types.js";
