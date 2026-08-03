/** PILLOW-EPD-001 — Executive Portfolio Dashboard exports (X2-06). */

export {
  ExecutivePortfolioDashboard,
  createExecutivePortfolioDashboard,
  resetExecutivePortfolioDashboardForTesting,
  type ExecutivePortfolioDashboardDependencies,
} from "./engine.js";

export {
  buildExecutivePortfolioDashboardConfiguration,
  DEFAULT_EXECUTIVE_PORTFOLIO_DASHBOARD_CONFIGURATION,
  type ExecutivePortfolioDashboardConfiguration,
} from "./configuration.js";

export {
  EXECUTIVE_PORTFOLIO_DASHBOARD_SYSTEM_PATH,
  EPD_METADATA_VERSION,
  EXECUTIVE_PORTFOLIO_DASHBOARD_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  DASHBOARD_WIDGETS,
  EPD_CAPABILITIES,
} from "./paths.js";

export type {
  ExecutivePortfolioDashboardVersion,
  EngineStatus,
  OperationalState,
  DashboardWidgetId,
  EpdCapability,
  ValidationStatus,
  HealthStatus,
  DashboardEngineRecord,
  PortfolioSummary,
  CompanySummary,
  PortfolioKpiSummary,
  CapitalAllocationSummary,
  GrowthSummary,
  EnterpriseHealthSummary,
  ExecutiveAlert,
  ExecutiveRecommendation,
  DashboardWidget,
  DrillDownView,
  PortfolioDashboardSnapshot,
  DashboardValidationReport,
  DashboardRunReport,
  DashboardHealthReport,
  DashboardPerformanceStats,
  ExecutivePortfolioDashboardState,
  DashboardCockpitSnapshot,
  ConnectExecutiveDashboardInput,
  RefreshDashboardInput,
  AggregatePortfolioKpisInput,
  GenerateExecutiveAlertsInput,
  RecommendExecutiveInput,
  DrillDownInput,
  RunDashboardDiagnosticsInput,
} from "./types.js";
