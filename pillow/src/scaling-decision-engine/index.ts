/** PILLOW-SDE-001 — Scaling Decision Engine exports (X3-03). */

export {
  ScalingDecisionEngine,
  createScalingDecisionEngine,
  resetScalingDecisionEngineForTesting,
  type ScalingDecisionEngineDependencies,
  type ScalingDecisionEngineOptions,
} from "./engine.js";

export {
  buildScalingDecisionEngineConfiguration,
  DEFAULT_SCALING_DECISION_ENGINE_CONFIGURATION,
  type ScalingDecisionEngineConfiguration,
} from "./configuration.js";

export {
  SCALING_DECISION_ENGINE_SYSTEM_PATH,
  SDE_METADATA_VERSION,
  SCALING_DECISION_ENGINE_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  SDE_CAPABILITIES,
  SCALING_DECISIONS,
} from "./paths.js";

export type {
  ScalingDecisionEngineVersion,
  EngineStatus,
  OperationalState,
  SdeCapability,
  ValidationStatus,
  HealthStatus,
  ScalingDecisionOutcome,
  ScalingDecisionRecord,
  ScalingDecisionEngineRecord,
  ScalingRecommendation,
  DecisionValidationReport,
  SdeRunReport,
  SdeHealthReport,
  SdePerformanceStats,
  ScalingDecisionEngineState,
  SdeCockpitSnapshot,
  ConnectScalingDecisionEngineInput,
  ScalingDecisionInput,
  RunSdeDiagnosticsInput,
} from "./types.js";
