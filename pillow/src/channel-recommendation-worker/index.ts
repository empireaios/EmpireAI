export {
  ChannelRecommendationWorker,
  createChannelRecommendationWorker,
  resetChannelRecommendationWorkerForTesting,
  type ChannelRecommendationWorkerOptions,
} from "./engine.js";
export type { ChannelRecommendationWorkerDependencies } from "./integrations.js";
export {
  buildChannelRecommendationWorkerConfiguration,
  DEFAULT_CHANNEL_RECOMMENDATION_WORKER_CONFIGURATION,
  type ChannelRecommendationWorkerConfiguration,
} from "./configuration.js";
export {
  CHANNEL_RECOMMENDATION_WORKER_ID,
  CHANNEL_RECOMMENDATION_WORKER_SYSTEM_PATH,
  CHANNEL_RECOMMENDATION_WORKER_IDENTITY,
  CRW_METADATA_VERSION,
  CRW_REPORT_VERSION,
  RECOMMENDATION_DECISIONS,
  EVIDENCE_SOURCE_TYPES,
  EVIDENCE_KINDS,
  SCORED_DIMENSION_KINDS,
  RISK_LEVELS,
  CRW_CAPABILITIES,
  INTEGRATION_TARGETS as CRW_INTEGRATION_TARGETS,
} from "./paths.js";
export type {
  ChannelRecommendationWorkerState,
  ChannelRecommendationReport,
  ChannelRecommendationReport as CrwChannelRecommendationReport,
  ChannelRecommendationWorkerInput,
  ChannelRecommendationWorkerRunReport,
  ChannelRecommendationWorkerCatalog,
  ChannelRecommendationWorkerCockpitSnapshot,
  ChannelRecommendationWorkerEngineRecord,
  ChannelRecommendationWorkerValidationReport,
  EvidenceItem,
  ScoredDimension,
  RiskAssessment,
  RankedOpportunity,
  ProposedChannel,
  TargetAudience,
  TrendSignal,
  AnalyticsSignal,
  LearningSignal,
  RecommendationDecision,
  IntegrationHandshake as CrwIntegrationHandshake,
  PreservedDecision,
} from "./types.js";
export { resetRecommendationSequenceForTesting } from "./recommendation-builder.js";
export { appendCrwLog, getCrwLogs, resetCrwLogsForTesting } from "./crw-logging.js";
