export {
  RETURNS_INTELLIGENCE_ENGINE_SYSTEM_PATH,
  RETURNS_INTELLIGENCE_ENGINE_ID,
  RIE_METADATA_VERSION,
  RIE_CAPABILITIES,
  ENGINE_STATUSES,
  ENGINE_STATES,
  RETURN_REASONS,
  RECOMMENDED_ACTIONS,
  VALIDATION_STATUSES,
  HEALTH_STATUSES,
} from "./paths.js";

export {
  buildReturnsIntelligenceEngineConfiguration,
  DEFAULT_RETURNS_INTELLIGENCE_ENGINE_CONFIGURATION,
  type ReturnsIntelligenceEngineConfiguration,
  type EligibilityRule,
  type RiskScoringRule,
  type RecommendationRule,
} from "./configuration.js";

export {
  ReturnsIntelligenceEngine,
  createReturnsIntelligenceEngine,
  resetReturnsIntelligenceEngineForTesting,
  type ReturnsIntelligenceEngineOptions,
} from "./engine.js";

export type {
  ReturnsIntelligenceEngineVersion,
  ReturnsIntelligenceEngineState,
  ReturnsIntelligenceEngineRecord,
  ReturnIntelligenceRecord,
  ReturnInsight,
  ReturnIntelligenceFailure,
  ReturnIntelligenceValidationReport,
  ReturnsIntelligenceRunReport,
  ReturnsIntelligenceHealthReport,
  ReturnsIntelligencePerformanceStats,
  ReturnsIntelligenceCockpitSnapshot,
  ConnectReturnsIntelligenceEngineInput,
  ReceiveReturnRequestInput,
  EvaluateReturnEligibilityInput,
  AnalyzeReturnHistoryInput,
  DetectAbnormalReturnBehaviorInput,
  DetectRepeatReturnPatternsInput,
  RecommendReturnDecisionInput,
  TrackReturnLifecycleInput,
  CoordinateCustomerCommunicationsInput,
  GenerateReturnInsightsInput,
  DetectReturnFailuresInput,
  EngineStatus,
  EngineState,
  ReturnReason,
  RecommendedAction,
  HealthStatus,
} from "./types.js";

export { appendRieLog, getRieLogs, resetRieLogsForTesting } from "./rie-logging.js";
