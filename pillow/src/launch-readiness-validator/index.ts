/** PILLOW-LRV-001 — Launch Readiness Validator exports (X1-10). */

export {
  LaunchReadinessValidator,
  createLaunchReadinessValidator,
  resetLaunchReadinessValidatorForTesting,
  type LaunchReadinessValidatorDependencies,
  type LaunchReadinessValidatorOptions,
} from "./engine.js";

export {
  buildLaunchReadinessValidatorConfiguration,
  DEFAULT_LAUNCH_READINESS_VALIDATOR_CONFIGURATION,
  type LaunchReadinessValidatorConfiguration,
} from "./configuration.js";

export {
  LAUNCH_READINESS_VALIDATOR_SYSTEM_PATH,
  LRV_METADATA_VERSION,
  LAUNCH_READINESS_VALIDATOR_ID,
  LRV_CAPABILITIES,
} from "./paths.js";

export { appendLrvLog, getLrvLogs, resetLrvLogsForTesting } from "./lrv-logging.js";

export type {
  LaunchReadinessValidatorState,
  LaunchReadinessRecord,
  LaunchRunReport,
  LaunchEngineRecord,
  LaunchCockpitSnapshot,
  LaunchHealthReport,
  LaunchPerformanceStats,
  ConnectLaunchReadinessValidatorInput,
  ValidateLaunchReadinessInput,
  LaunchActionInput,
} from "./types.js";
