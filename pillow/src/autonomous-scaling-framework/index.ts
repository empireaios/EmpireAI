/** PILLOW-ASF-001 — Autonomous Scaling Framework exports (X3-01). */

export {
  AutonomousScalingFrameworkEngine,
  createAutonomousScalingFrameworkEngine,
  resetAutonomousScalingFrameworkForTesting,
} from "./engine.js";

export {
  buildAutonomousScalingFrameworkConfiguration,
  DEFAULT_AUTONOMOUS_SCALING_FRAMEWORK_CONFIGURATION,
  type AutonomousScalingFrameworkConfiguration,
} from "./configuration.js";

export {
  AUTONOMOUS_SCALING_FRAMEWORK_SYSTEM_PATH,
  ASF_METADATA_VERSION,
  AUTONOMOUS_SCALING_FRAMEWORK_ID,
  ENGINE_STATUSES,
  MODULE_STATES,
  MODULE_TYPES,
  FRAMEWORK_CAPABILITIES,
} from "./paths.js";

export type {
  AutonomousScalingFrameworkVersion,
  EngineStatus,
  ModuleState,
  ModuleType,
  FrameworkCapability,
  ScalingModuleDefinition,
  AutonomousScalingFrameworkRecord,
  NormalizedScalingEvent,
  ScalingEventResult,
  AbstractedScalingData,
  ScalingValidationReport,
  ScalingFrameworkRunReport,
  ScalingFrameworkHealthReport,
  ScalingFrameworkPerformanceStats,
  AutonomousScalingFrameworkState,
  ScalingFrameworkCockpitSnapshot,
  RegisterScalingModuleInput,
  RouteScalingEventInput,
  AbstractScalingDataInput,
  RunScalingDiagnosticsInput,
} from "./types.js";
