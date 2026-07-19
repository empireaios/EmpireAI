export {
  EXECUTIVE_CUSTOMER_DASHBOARD_SYSTEM_PATH,
  EXECUTIVE_CUSTOMER_DASHBOARD_ID,
  ECD_METADATA_VERSION,
  ECD_CAPABILITIES,
  ENGINE_STATUSES,
  ENGINE_STATES,
  WIDGET_TYPES,
  VALIDATION_STATUSES,
  HEALTH_STATUSES,
} from "./paths.js";

export {
  buildExecutiveCustomerDashboardConfiguration,
  DEFAULT_EXECUTIVE_CUSTOMER_DASHBOARD_CONFIGURATION,
  type ExecutiveCustomerDashboardConfiguration,
  type KpiSelectionRule,
  type ExecutiveSummaryRule,
  type AlertDisplayRule,
} from "./configuration.js";

export {
  ExecutiveCustomerDashboard,
  createExecutiveCustomerDashboard,
  resetExecutiveCustomerDashboardForTesting,
  type ExecutiveCustomerDashboardOptions,
} from "./engine.js";

export type {
  ExecutiveCustomerDashboardVersion,
  ExecutiveCustomerDashboardState,
  ExecutiveCustomerDashboardRecord,
  CustomerDashboardSnapshot,
  DashboardWidget,
  DashboardFailure,
  DashboardValidationReport,
  ExecutiveCustomerDashboardRunReport,
  DashboardHealthReport,
  DashboardPerformanceStats,
  DashboardCockpitSnapshot,
  ConnectExecutiveCustomerDashboardInput,
  RefreshExecutiveCustomerDashboardInput,
  GetDashboardWidgetsInput,
  DetectDashboardFailuresInput,
  EngineStatus,
  EngineState,
  WidgetType,
  HealthStatus,
  ExecutiveCustomerKpi,
} from "./types.js";

export { appendEcdLog, getEcdLogs, resetEcdLogsForTesting } from "./ecd-logging.js";
