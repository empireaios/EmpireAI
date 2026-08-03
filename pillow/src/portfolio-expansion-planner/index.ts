/** PILLOW-PEP-001 — Portfolio Expansion Planner exports (X2-18). */

export {
  PortfolioExpansionPlanner,
  createPortfolioExpansionPlanner,
  resetPortfolioExpansionPlannerForTesting,
  type PortfolioExpansionPlannerDependencies,
  type PortfolioExpansionPlannerOptions,
} from "./engine.js";

export {
  buildPortfolioExpansionPlannerConfiguration,
  DEFAULT_PORTFOLIO_EXPANSION_PLANNER_CONFIGURATION,
  type PortfolioExpansionPlannerConfiguration,
} from "./configuration.js";

export {
  PORTFOLIO_EXPANSION_PLANNER_SYSTEM_PATH,
  PEP_METADATA_VERSION,
  PORTFOLIO_EXPANSION_PLANNER_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  PEP_CAPABILITIES,
  EXPANSION_CATEGORIES,
  EXPANSION_PRIORITIES,
} from "./paths.js";

export { appendPepLog, getPepLogs, resetPepLogsForTesting } from "./pep-logging.js";

export type {
  PortfolioExpansionPlannerState,
  ExpansionRecord,
  ExpansionRecommendation,
  PortfolioExpansionEngineRecord,
  ExpansionRunReport,
  ExpansionCockpitSnapshot,
  ExpansionHealthReport,
  ExpansionPerformanceStats,
  ConnectPortfolioExpansionPlannerInput,
  IdentifyExpansionOpportunitiesInput,
  EvaluateExpansionInput,
  PrioritizeExpansionsInput,
  EstimateExpansionCostsInput,
  EstimateExpansionReturnsInput,
  GenerateExpansionRecommendationsInput,
  RunExpansionDiagnosticsInput,
} from "./types.js";
