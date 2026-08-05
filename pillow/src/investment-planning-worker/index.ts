export {
  INVESTMENT_PLANNING_WORKER_SYSTEM_PATH,
  INVESTMENT_PLANNING_WORKER_ID,
  IPW_METADATA_VERSION,
  INVESTMENT_PLANNING_REPORT_VERSION,
  INVESTMENT_PLANNING_WORKER_IDENTITY,
  OPPORTUNITY_TYPES,
  RECOMMENDATION_KINDS,
  SCORING_WEIGHT_KEYS,
  CURRENCIES,
  DEFAULT_CURRENCY,
  INTEGRATION_TARGETS,
  IPW_CAPABILITIES,
  ENGINE_STATUSES,
} from "./paths.js";
export {
  buildInvestmentPlanningWorkerConfiguration,
  DEFAULT_INVESTMENT_PLANNING_WORKER_CONFIGURATION,
  DEFAULT_SCORING_WEIGHTS,
  type InvestmentPlanningWorkerConfiguration,
  type ScoringWeights,
} from "./configuration.js";
export {
  InvestmentPlanningWorker,
  createInvestmentPlanningWorker,
  resetInvestmentPlanningWorkerForTesting,
} from "./engine.js";
export type { InvestmentPlanningWorkerOptions } from "./engine.js";
export type { InvestmentPlanningWorkerDependencies } from "./integrations.js";
export type {
  InvestmentPlanningWorkerState,
  InvestmentPlanningWorkerCockpitSnapshot,
  IpwInput,
  IpwRunReport,
  InvestmentPlanningReport,
  InvestmentOpportunityInput,
  EvaluatedOpportunity,
  CapitalAllocationRecommendation,
  ExpectedRoiSummary,
  PaybackSummary,
  StrategicAlignmentSummary,
  Q909ConsumableContract,
  OpportunityType,
  RecommendationKind,
} from "./types.js";
export {
  scoreOpportunity,
  rankOpportunities,
  recommendFromScore,
  estimatePaybackPeriods,
} from "./investment-scorer.js";
export {
  buildExpectedRoiSummary,
  buildPaybackSummary,
  buildStrategicAlignmentSummary,
} from "./investment-builder.js";
