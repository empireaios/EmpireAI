/** PILLOW-EFD-001 — Executive Financial Dashboard exports (R3-16). */

export {
  ExecutiveFinancialDashboard,
  createExecutiveFinancialDashboard,
  resetExecutiveFinancialDashboardForTesting,
} from "./engine.js";

export {
  buildExecutiveFinancialDashboardConfiguration,
  DEFAULT_EXECUTIVE_FINANCIAL_DASHBOARD_CONFIGURATION,
  type ExecutiveFinancialDashboardConfiguration,
  type KpiSelectionRule,
} from "./configuration.js";

export {
  EXECUTIVE_FINANCIAL_DASHBOARD_SYSTEM_PATH,
  EFD_METADATA_VERSION,
  EXECUTIVE_FINANCIAL_DASHBOARD_ID,
  EFD_CAPABILITIES,
  WIDGET_TYPES,
} from "./paths.js";

export type {
  ExecutiveFinancialDashboardVersion,
  ExecutiveFinancialDashboardRecord,
  DashboardSnapshot,
  DashboardWidget,
  ExecutiveKpi,
  DashboardTrend,
  ExecutiveDashboardRunReport,
  ExecutiveFinancialDashboardState,
  DashboardCockpitSnapshot,
  DashboardHealthReport,
  DashboardPerformanceStats,
  ConnectExecutiveFinancialDashboardInput,
  RefreshExecutiveDashboardInput,
  GenerateExecutiveSummaryInput,
  AggregateFinancialKpisInput,
  GetDashboardWidgetsInput,
  WidgetType,
  EngineStatus,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
