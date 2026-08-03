/** PILLOW-PRE-001 — Portfolio Risk Engine exports (X2-07). */

export {
  PortfolioRiskEngine,
  createPortfolioRiskEngine,
  resetPortfolioRiskEngineForTesting,
  type PortfolioRiskEngineDependencies,
} from "./engine.js";

export {
  buildPortfolioRiskEngineConfiguration,
  DEFAULT_PORTFOLIO_RISK_ENGINE_CONFIGURATION,
  type PortfolioRiskEngineConfiguration,
} from "./configuration.js";

export {
  PORTFOLIO_RISK_ENGINE_SYSTEM_PATH,
  PRE_METADATA_VERSION,
  PORTFOLIO_RISK_ENGINE_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  RISK_CATEGORIES,
  RISK_SEVERITIES,
  PRE_CAPABILITIES,
} from "./paths.js";

export type {
  PortfolioRiskEngineVersion,
  EngineStatus,
  OperationalState,
  RiskCategory,
  RiskSeverity,
  PreCapability,
  ValidationStatus,
  HealthStatus,
  RiskEngineRecord,
  PortfolioRiskRecord,
  RiskRecommendation,
  PortfolioRiskScoreSummary,
  RiskValidationReport,
  RiskRunReport,
  RiskHealthReport,
  RiskPerformanceStats,
  PortfolioRiskEngineState,
  RiskCockpitSnapshot,
  ConnectPortfolioRiskInput,
  MonitorRisksInput,
  AnalyzeFinancialRiskInput,
  AnalyzeOperationalRiskInput,
  ScorePortfolioRiskInput,
  DetectEmergingRisksInput,
  RecommendRiskMitigationInput,
  RunRiskDiagnosticsInput,
} from "./types.js";
