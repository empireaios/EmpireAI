/** PILLOW-ESD-001 — Executive Scaling Dashboard exports (X3-09). */

export {
  ExecutiveScalingDashboardEngine,
  createExecutiveScalingDashboardEngine,
  resetExecutiveScalingDashboardForTesting,
  type ExecutiveScalingDashboardDependencies,
  type ExecutiveScalingDashboardOptions,
} from "./engine.js";

export {
  buildExecutiveScalingDashboardConfiguration,
  DEFAULT_EXECUTIVE_SCALING_DASHBOARD_CONFIGURATION,
  type ExecutiveScalingDashboardConfiguration,
} from "./configuration.js";

export {
  EXECUTIVE_SCALING_DASHBOARD_SYSTEM_PATH,
  ESD_METADATA_VERSION,
  EXECUTIVE_SCALING_DASHBOARD_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  ESD_CAPABILITIES,
} from "./paths.js";

export type {
  ExecutiveScalingDashboardVersion,
  EngineStatus,
  OperationalState,
  EsdCapability,
  ValidationStatus,
  HealthStatus,
  DomainSummary,
  ExecutiveDashboardSnapshot,
  ExecutiveScalingDashboardEngineRecord,
  ExecutiveScalingRecommendation,
  ExecutiveDashboardValidationReport,
  EsdRunReport,
  EsdHealthReport,
  EsdPerformanceStats,
  ExecutiveScalingDashboardState,
  EsdCockpitSnapshot,
  ConnectExecutiveScalingDashboardInput,
  ExecutiveScalingDashboardInput,
  RunEsdDiagnosticsInput,
} from "./types.js";
