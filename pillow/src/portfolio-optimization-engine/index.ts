/** PILLOW-POE-001 — Portfolio Optimization Engine exports (X2-16). */

export {
  PortfolioOptimizationEngine,
  createPortfolioOptimizationEngine,
  resetPortfolioOptimizationEngineForTesting,
  type PortfolioOptimizationEngineDependencies,
  type PortfolioOptimizationEngineOptions,
} from "./engine.js";

export {
  buildPortfolioOptimizationEngineConfiguration,
  DEFAULT_PORTFOLIO_OPTIMIZATION_ENGINE_CONFIGURATION,
  type PortfolioOptimizationEngineConfiguration,
} from "./configuration.js";

export {
  PORTFOLIO_OPTIMIZATION_ENGINE_SYSTEM_PATH,
  POE_METADATA_VERSION,
  PORTFOLIO_OPTIMIZATION_ENGINE_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  POE_CAPABILITIES,
  OPTIMIZATION_CATEGORIES,
  OPTIMIZATION_PRIORITIES,
} from "./paths.js";

export { appendPoeLog, getPoeLogs, resetPoeLogsForTesting } from "./poe-logging.js";

export type {
  PortfolioOptimizationEngineState,
  OptimizationRecord,
  OptimizationRecommendation,
  PortfolioOptimizationEngineRecord,
  OptimizationRunReport,
  OptimizationCockpitSnapshot,
  OptimizationHealthReport,
  OptimizationPerformanceStats,
  ConnectPortfolioOptimizationEngineInput,
  OptimizePortfolioInput,
  DetectOptimizationOpportunitiesInput,
  RankOptimizationPrioritiesInput,
  GenerateOptimizationRecommendationsInput,
  RunOptimizationDiagnosticsInput,
} from "./types.js";
