/** PILLOW-BHR-001 — Business Health Ranking exports (X2-09). */

export {
  BusinessHealthRanking,
  createBusinessHealthRanking,
  resetBusinessHealthRankingForTesting,
  type BusinessHealthRankingDependencies,
} from "./engine.js";

export {
  buildBusinessHealthRankingConfiguration,
  DEFAULT_BUSINESS_HEALTH_RANKING_CONFIGURATION,
  type BusinessHealthRankingConfiguration,
} from "./configuration.js";

export {
  BUSINESS_HEALTH_RANKING_SYSTEM_PATH,
  BHR_METADATA_VERSION,
  BUSINESS_HEALTH_RANKING_ID,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  BHR_CAPABILITIES,
  MANAGEMENT_PRIORITIES,
} from "./paths.js";

export type {
  BusinessHealthRankingVersion,
  EngineStatus,
  OperationalState,
  BhrCapability,
  ValidationStatus,
  HealthStatus,
  ManagementPriority,
  RankingEngineRecord,
  BusinessHealthRecord,
  ManagementPriorityRecommendation,
  BusinessHealthValidationReport,
  BusinessHealthRunReport,
  RankingHealthReport,
  RankingPerformanceStats,
  BusinessHealthRankingState,
  RankingCockpitSnapshot,
  ConnectBusinessHealthRankingInput,
  MeasureBusinessHealthInput,
  RankCompaniesInput,
  DetectDecliningInput,
  DetectHighPerformingInput,
  GeneratePrioritiesInput,
  RunRankingDiagnosticsInput,
} from "./types.js";
