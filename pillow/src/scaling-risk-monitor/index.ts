/** PILLOW-SRM-001 — Scaling Risk Monitor exports (X3-13). */

export {
  ScalingRiskMonitorEngine,
  createScalingRiskMonitorEngine,
  resetScalingRiskMonitorForTesting,
  type ScalingRiskMonitorDependencies,
  type ScalingRiskMonitorOptions,
} from "./engine.js";

export {
  buildScalingRiskMonitorConfiguration,
  DEFAULT_SCALING_RISK_MONITOR_CONFIGURATION,
  type ScalingRiskMonitorConfiguration,
} from "./configuration.js";

export {
  SCALING_RISK_MONITOR_SYSTEM_PATH,
  SRM_METADATA_VERSION,
  SCALING_RISK_MONITOR_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  RISK_OPERATIONS,
  RISK_CATEGORIES,
  SRM_CAPABILITIES,
} from "./paths.js";

export type {
  ScalingRiskMonitorVersion,
  EngineStatus,
  OperationalState,
  RiskOperation,
  RiskCategory,
  RiskSeverity,
  SrmCapability,
  ValidationStatus,
  HealthStatus,
  ScalingRiskRecord,
  ScalingRiskMonitorRecord,
  RiskMitigationRecommendation,
  ScalingRiskValidationReport,
  SrmRunReport,
  SrmHealthReport,
  SrmPerformanceStats,
  ScalingRiskMonitorState,
  SrmCockpitSnapshot,
  ConnectScalingRiskMonitorInput,
  ScalingRiskInput,
  RunSrmDiagnosticsInput,
} from "./types.js";
