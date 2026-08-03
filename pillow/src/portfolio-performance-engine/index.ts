/** PILLOW-PPE-001 — Portfolio Performance Engine exports (X2-03). */

export {
  PortfolioPerformanceEngine,
  createPortfolioPerformanceEngine,
  resetPortfolioPerformanceEngineForTesting,
  type PortfolioPerformanceEngineDependencies,
} from "./engine.js";

export {
  buildPortfolioPerformanceEngineConfiguration,
  DEFAULT_PORTFOLIO_PERFORMANCE_ENGINE_CONFIGURATION,
  type PortfolioPerformanceEngineConfiguration,
} from "./configuration.js";

export {
  PORTFOLIO_PERFORMANCE_ENGINE_SYSTEM_PATH,
  PPE_METADATA_VERSION,
  PORTFOLIO_PERFORMANCE_ENGINE_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  PPE_CAPABILITIES,
} from "./paths.js";

export type {
  PortfolioPerformanceEngineVersion,
  EngineStatus,
  OperationalState,
  PpeCapability,
  MetricBundle,
  PerformanceEngineRecord,
  PortfolioPerformanceRecord,
  PortfolioKpiSnapshot,
  PerformanceRecommendation,
  PerformanceValidationReport,
  PerformanceRunReport,
  PerformanceHealthReport,
  PerformancePerformanceStats,
  PortfolioPerformanceEngineState,
  PerformanceCockpitSnapshot,
  ConnectPortfolioPerformanceInput,
  MeasureCompanyPerformanceInput,
  CompareCompaniesInput,
  CalculatePortfolioKpisInput,
  AnalyzePortfolioInput,
  RecommendPerformanceInput,
  RunPerformanceDiagnosticsInput,
} from "./types.js";
