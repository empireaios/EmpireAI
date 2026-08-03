/** PILLOW-EGD-001 — Executive Global Dashboard exports (X4-10). */

export {
  ExecutiveGlobalDashboardEngine,
  createExecutiveGlobalDashboardEngine,
  resetExecutiveGlobalDashboardForTesting,
  type ExecutiveGlobalDashboardDependencies,
  type ExecutiveGlobalDashboardOptions,
} from "./engine.js";

export {
  buildExecutiveGlobalDashboardConfiguration,
  DEFAULT_EXECUTIVE_GLOBAL_DASHBOARD_CONFIGURATION,
  type ExecutiveGlobalDashboardConfiguration,
} from "./configuration.js";

export {
  EXECUTIVE_GLOBAL_DASHBOARD_SYSTEM_PATH,
  EGD_METADATA_VERSION,
  EXECUTIVE_GLOBAL_DASHBOARD_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  EGD_CAPABILITIES,
  DASHBOARD_WIDGETS,
  ALERT_SEVERITIES,
} from "./paths.js";

export type {
  ExecutiveGlobalDashboardVersion,
  EngineStatus,
  OperationalState,
  EgdCapability,
  ValidationStatus,
  HealthStatus,
  DashboardWidget,
  AlertSeverity,
  ExecutiveAlert,
  DashboardSnapshot,
  ExecutiveGlobalDashboardEngineRecord,
  DashboardRecommendation,
  DashboardValidationReport,
  EgdRunReport,
  EgdHealthReport,
  EgdPerformanceStats,
  ExecutiveGlobalDashboardState,
  EgdCockpitSnapshot,
  ConnectExecutiveGlobalDashboardInput,
  DashboardAnalysisInput,
  RunEgdDiagnosticsInput,
} from "./types.js";
