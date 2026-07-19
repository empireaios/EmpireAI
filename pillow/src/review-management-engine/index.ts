export {
  REVIEW_MANAGEMENT_ENGINE_SYSTEM_PATH,
  REVIEW_MANAGEMENT_ENGINE_ID,
  RME_METADATA_VERSION,
  RME_CAPABILITIES,
  ENGINE_STATUSES,
  ENGINE_STATES,
  MARKETPLACE_CHANNELS,
  REVIEW_SENTIMENTS,
  REVIEW_STATUSES,
  ALERT_STATUSES,
  VALIDATION_STATUSES,
  HEALTH_STATUSES,
} from "./paths.js";

export {
  buildReviewManagementEngineConfiguration,
  DEFAULT_REVIEW_MANAGEMENT_ENGINE_CONFIGURATION,
  type ReviewManagementEngineConfiguration,
  type CollectionRule,
  type MarketplaceImportRule,
  type ReputationAlertRule,
} from "./configuration.js";

export {
  ReviewManagementEngine,
  createReviewManagementEngine,
  resetReviewManagementEngineForTesting,
  type ReviewManagementEngineOptions,
} from "./engine.js";

export type {
  ReviewManagementEngineVersion,
  ReviewManagementEngineState,
  ReviewEngineRecord,
  ReviewRecord,
  ReputationAlert,
  ReviewTrend,
  ReviewFailure,
  ReviewValidationReport,
  ReviewRunReport,
  ReviewHealthReport,
  ReviewPerformanceStats,
  ReviewCockpitSnapshot,
  ConnectReviewManagementEngineInput,
  CollectCustomerReviewInput,
  ImportMarketplaceReviewInput,
  ClassifyReviewSentimentInput,
  DetectNegativeReviewsInput,
  DetectPositiveReviewsInput,
  TrackReviewTrendsInput,
  GenerateReputationAlertsInput,
  DetectReviewFailuresInput,
  EngineStatus,
  EngineState,
  MarketplaceChannel,
  ReviewSentiment,
  ReviewStatus,
  HealthStatus,
} from "./types.js";

export { appendRmeLog, getRmeLogs, resetRmeLogsForTesting } from "./rme-logging.js";
