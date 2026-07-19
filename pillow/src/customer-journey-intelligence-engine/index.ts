export {
  CUSTOMER_JOURNEY_INTELLIGENCE_SYSTEM_PATH,
  CUSTOMER_JOURNEY_INTELLIGENCE_ID,
  CJI_METADATA_VERSION,
  CJI_CAPABILITIES,
  ENGINE_STATUSES,
  ENGINE_STATES,
  JOURNEY_STAGES,
  CONVERSION_STATUSES,
  RECOMMENDED_JOURNEY_ACTIONS,
  VALIDATION_STATUSES,
  HEALTH_STATUSES,
} from "./paths.js";

export {
  buildCustomerJourneyIntelligenceConfiguration,
  DEFAULT_CUSTOMER_JOURNEY_INTELLIGENCE_CONFIGURATION,
  type CustomerJourneyIntelligenceConfiguration,
  type JourneyMappingRule,
  type OptimizationRule,
  type PredictionRule,
} from "./configuration.js";

export {
  CustomerJourneyIntelligenceEngine,
  createCustomerJourneyIntelligenceEngine,
  resetCustomerJourneyIntelligenceEngineForTesting,
  type CustomerJourneyIntelligenceEngineOptions,
} from "./engine.js";

export type {
  CustomerJourneyIntelligenceVersion,
  CustomerJourneyIntelligenceState,
  JourneyIntelligenceEngineRecord,
  JourneyRecord,
  JourneyInsight,
  JourneyFailure,
  JourneyValidationReport,
  JourneyRunReport,
  JourneyHealthReport,
  JourneyPerformanceStats,
  JourneyCockpitSnapshot,
  ConnectJourneyIntelligenceInput,
  MapCustomerJourneyInput,
  TrackCustomerTouchpointsInput,
  IdentifyJourneyStagesInput,
  DetectDropOffPointsInput,
  DetectFrictionPointsInput,
  MeasureJourneyPerformanceInput,
  MeasureConversionRatesInput,
  RecommendJourneyImprovementsInput,
  PredictCustomerProgressionInput,
  DetectJourneyFailuresInput,
  EngineStatus,
  EngineState,
  JourneyStage,
  ConversionStatus,
  RecommendedJourneyAction,
  HealthStatus,
} from "./types.js";

export { appendCjiLog, getCjiLogs, resetCjiLogsForTesting } from "./cji-logging.js";
