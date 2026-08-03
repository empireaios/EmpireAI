/** PILLOW-CDE-001 — Capital Distribution Engine exports (X2-05). */

export {
  CapitalDistributionEngine,
  createCapitalDistributionEngine,
  resetCapitalDistributionEngineForTesting,
  type CapitalDistributionEngineDependencies,
} from "./engine.js";

export {
  buildCapitalDistributionEngineConfiguration,
  DEFAULT_CAPITAL_DISTRIBUTION_ENGINE_CONFIGURATION,
  type CapitalDistributionEngineConfiguration,
} from "./configuration.js";

export {
  CAPITAL_DISTRIBUTION_ENGINE_SYSTEM_PATH,
  CDE_METADATA_VERSION,
  CAPITAL_DISTRIBUTION_ENGINE_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  ALLOCATION_PRIORITIES,
  CDE_CAPABILITIES,
} from "./paths.js";

export type {
  CapitalDistributionEngineVersion,
  EngineStatus,
  OperationalState,
  AllocationPriority,
  CdeCapability,
  CapitalEngineRecord,
  CapitalPoolRecord,
  CapitalAllocationRecord,
  CapitalRiskSignal,
  CapitalRecommendation,
  CapitalValidationReport,
  CapitalRunReport,
  CapitalHealthReport,
  CapitalPerformanceStats,
  CapitalDistributionEngineState,
  CapitalCockpitSnapshot,
  ConnectCapitalDistributionInput,
  ManageCapitalPoolInput,
  EvaluateFundingInput,
  EvaluateOpportunityInput,
  AllocateCapitalInput,
  AnalyzeCapitalRiskInput,
  RankCapitalPrioritiesInput,
  RecommendCapitalInput,
  RunCapitalDiagnosticsInput,
} from "./types.js";
