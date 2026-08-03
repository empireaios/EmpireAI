/** PILLOW-APB-001 — Autonomous Portfolio Board exports (X2-20). */

export {
  AutonomousPortfolioBoard,
  createAutonomousPortfolioBoard,
  resetAutonomousPortfolioBoardForTesting,
  type AutonomousPortfolioBoardDependencies,
  type AutonomousPortfolioBoardOptions,
} from "./engine.js";

export {
  buildAutonomousPortfolioBoardConfiguration,
  DEFAULT_AUTONOMOUS_PORTFOLIO_BOARD_CONFIGURATION,
  type AutonomousPortfolioBoardConfiguration,
} from "./configuration.js";

export {
  SYSTEM_PATH,
  AUTONOMOUS_PORTFOLIO_BOARD_SYSTEM_PATH,
  APB_METADATA_VERSION,
  AUTONOMOUS_PORTFOLIO_BOARD_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  APB_CAPABILITIES,
  REVIEW_CATEGORIES,
  PRIORITY_LEVELS,
} from "./paths.js";

export { appendApbLog, getApbLogs, resetApbLogsForTesting } from "./apb-logging.js";

export type {
  AutonomousPortfolioBoardState,
  ExecutiveBoardRecord,
  ExecutiveRecommendation,
  AutonomousPortfolioBoardEngineRecord,
  ExecutiveBoardRunReport,
  ExecutiveBoardCockpitSnapshot,
  ExecutiveBoardHealthReport,
  ExecutiveBoardPerformanceStats,
  ConnectAutonomousPortfolioBoardInput,
  ReviewEnterprisePerformanceInput,
  ReviewPortfolioHealthInput,
  ReviewStrategicOpportunitiesInput,
  ReviewEnterpriseRisksInput,
  ReviewCapitalAllocationInput,
  ReviewExpansionOpportunitiesInput,
  ReviewAcquisitionOpportunitiesInput,
  PrioritizeExecutiveDecisionsInput,
  GenerateExecutiveRecommendationsInput,
  RunExecutiveBoardDiagnosticsInput,
} from "./types.js";
