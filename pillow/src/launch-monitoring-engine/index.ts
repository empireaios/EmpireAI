/** PILLOW-LME-001 — Launch Monitoring Engine exports (X1-13). */

export {
  LaunchMonitoringEngine,
  createLaunchMonitoringEngine,
  resetLaunchMonitoringEngineForTesting,
  type LaunchMonitoringEngineDependencies,
  type LaunchMonitoringEngineOptions,
} from "./engine.js";

export {
  buildLaunchMonitoringEngineConfiguration,
  DEFAULT_LAUNCH_MONITORING_ENGINE_CONFIGURATION,
  type LaunchMonitoringEngineConfiguration,
} from "./configuration.js";

export {
  LAUNCH_MONITORING_ENGINE_SYSTEM_PATH,
  LME_METADATA_VERSION,
  LAUNCH_MONITORING_ENGINE_ID,
  LME_CAPABILITIES,
} from "./paths.js";

export { appendLmeLog, getLmeLogs, resetLmeLogsForTesting } from "./lme-logging.js";

export type {
  LaunchMonitoringEngineState,
  LaunchMonitoringRecord,
  LaunchMonitoringRunReport,
  LaunchMonitoringEngineRecord,
  LaunchMonitoringCockpitSnapshot,
  LaunchMonitoringHealthReport,
  LaunchMonitoringPerformanceStats,
  ConnectLaunchMonitoringEngineInput,
  MonitorLaunchInput,
  LaunchMonitoringActionInput,
} from "./types.js";
