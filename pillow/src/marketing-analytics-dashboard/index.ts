/** PILLOW-MAD-001 — Marketing Analytics Dashboard exports (R5-10). */

export {
  MarketingAnalyticsDashboard,
  createMarketingAnalyticsDashboard,
  resetMarketingAnalyticsDashboardForTesting,
  type MarketingAnalyticsDashboardDependencies,
} from "./engine.js";

export {
  buildMarketingAnalyticsDashboardConfiguration,
  DEFAULT_MARKETING_ANALYTICS_DASHBOARD_CONFIGURATION,
  type MarketingAnalyticsDashboardConfiguration,
} from "./configuration.js";

export {
  MARKETING_ANALYTICS_DASHBOARD_SYSTEM_PATH,
  MAD_METADATA_VERSION,
  MARKETING_ANALYTICS_DASHBOARD_ID,
  MAD_CAPABILITIES,
  DASHBOARD_WIDGETS,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
} from "./paths.js";

export type {
  MarketingAnalyticsDashboardEngineVersion,
  DashboardEngineRecord,
  DashboardSnapshot,
  DashboardRunReport,
  MarketingAnalyticsDashboardState,
  DashboardCockpitSnapshot,
  DashboardHealthReport,
  DashboardPerformanceStats,
  ConnectDashboardInput,
  RefreshDashboardInput,
  AggregateKpisInput,
  GenerateExecutiveSummaryInput,
  MadCapability,
  DashboardWidgetId,
  EngineStatus,
  OperationalState,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
