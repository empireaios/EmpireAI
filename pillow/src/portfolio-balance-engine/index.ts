/** PILLOW-PBE-001 — Portfolio Balance Engine exports (X2-08). */

export {
  PortfolioBalanceEngine,
  createPortfolioBalanceEngine,
  resetPortfolioBalanceEngineForTesting,
  type PortfolioBalanceEngineDependencies,
} from "./engine.js";

export {
  buildPortfolioBalanceEngineConfiguration,
  DEFAULT_PORTFOLIO_BALANCE_ENGINE_CONFIGURATION,
  type PortfolioBalanceEngineConfiguration,
} from "./configuration.js";

export {
  PORTFOLIO_BALANCE_ENGINE_SYSTEM_PATH,
  PBE_METADATA_VERSION,
  PORTFOLIO_BALANCE_ENGINE_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  PBE_CAPABILITIES,
} from "./paths.js";

export type {
  PortfolioBalanceEngineVersion,
  EngineStatus,
  OperationalState,
  PbeCapability,
  ValidationStatus,
  HealthStatus,
  BalanceEngineRecord,
  BalancingAction,
  PortfolioBalanceRecord,
  BalanceRecommendation,
  BalanceValidationReport,
  BalanceRunReport,
  BalanceHealthReport,
  BalancePerformanceStats,
  PortfolioBalanceEngineState,
  BalanceCockpitSnapshot,
  ConnectPortfolioBalanceInput,
  MeasureDiversificationInput,
  AnalyzeConcentrationInput,
  AnalyzeExposureInput,
  DetectImbalanceInput,
  OptimizePortfolioBalanceInput,
  RecommendBalanceInput,
  RunBalanceDiagnosticsInput,
} from "./types.js";
