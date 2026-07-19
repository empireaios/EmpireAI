/** PILLOW-FRM-001 — Financial Risk Monitor exports (R3-15). */

export {
  FinancialRiskMonitor,
  createFinancialRiskMonitor,
  resetFinancialRiskMonitorForTesting,
} from "./engine.js";

export {
  buildFinancialRiskMonitorConfiguration,
  DEFAULT_FINANCIAL_RISK_MONITOR_CONFIGURATION,
  type FinancialRiskMonitorConfiguration,
  type RiskThresholdRule,
} from "./configuration.js";

export {
  FINANCIAL_RISK_MONITOR_SYSTEM_PATH,
  FRM_METADATA_VERSION,
  FINANCIAL_RISK_MONITOR_ID,
  FRM_CAPABILITIES,
  RISK_CATEGORIES,
} from "./paths.js";

export type {
  FinancialRiskMonitorVersion,
  FinancialRiskMonitorRecord,
  FinancialRiskRecord,
  FinancialRiskAlert,
  FinancialAnomaly,
  FinancialRiskRunReport,
  FinancialRiskMonitorState,
  RiskCockpitSnapshot,
  RiskHealthReport,
  RiskPerformanceStats,
  ConnectFinancialRiskMonitorInput,
  MonitorFinancialHealthInput,
  CalculateFinancialRiskScoreInput,
  DetectFinancialAnomaliesInput,
  DetectThresholdBreachesInput,
  GenerateFinancialRiskAlertsInput,
  RiskCategory,
  RiskStatus,
  EngineStatus,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
