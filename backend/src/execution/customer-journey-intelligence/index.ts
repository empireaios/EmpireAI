export {
  JOURNEY_STAGE_TYPES,
  JOURNEY_STAGE_LABELS,
  journeyStageTypeSchema,
  validateJourneyStageType,
} from "./models/journey-stage-types.js";
export type { JourneyStageType } from "./models/journey-stage-types.js";

export {
  JOURNEY_STAGE_STATUSES,
  journeyStageMetricSchema,
  journeyStageSchema,
  validateJourneyStage,
} from "./models/journey-stage.js";
export type {
  JourneyStageStatus,
  JourneyStageMetric,
  JourneyStage,
} from "./models/journey-stage.js";

export {
  OPTIMIZATION_PRIORITIES,
  OPTIMIZATION_EFFORT_LEVELS,
  optimizationRecommendationSchema,
  validateOptimizationRecommendation,
} from "./models/optimization-recommendation.js";
export type {
  OptimizationPriority,
  OptimizationEffortLevel,
  OptimizationRecommendation,
} from "./models/optimization-recommendation.js";

export {
  CUSTOMER_JOURNEY_SIGNAL_TYPES,
  customerJourneySignalSchema,
  validateCustomerJourneySignal,
} from "./models/customer-journey-signal.js";
export type {
  CustomerJourneySignalType,
  CustomerJourneySignal,
} from "./models/customer-journey-signal.js";

export {
  customerJourneySchema,
  validateCustomerJourney,
} from "./models/customer-journey.js";
export type {
  CustomerJourneyId,
  CustomerJourney,
  CustomerJourneyCreateInput,
} from "./models/customer-journey.js";

export {
  customerJourneyRecordSchema,
  validateCustomerJourneyRecord,
} from "./models/customer-journey-record.js";
export type {
  CustomerJourneyRecordId,
  CustomerJourneyRecord,
  CustomerJourneyRecordCreateInput,
} from "./models/customer-journey-record.js";

export type {
  CustomerJourneyRepositoryQuery,
  CustomerJourneyRepository,
} from "./repositories/customer-journey-repository.js";

export {
  InMemoryCustomerJourneyRepository,
  createInMemoryCustomerJourneyRepository,
} from "./repositories/in-memory-customer-journey-repository.js";

export {
  CUSTOMER_JOURNEY_SIGNAL_WEIGHTS,
  generateCustomerJourney,
  customerJourneyIntelligenceScoring,
} from "./scoring/customer-journey-intelligence-scoring.js";
export type {
  CustomerJourneyBrandInput,
  CustomerJourneyOfferInput,
  CustomerJourneyInput,
  CustomerJourneyBreakdown,
} from "./scoring/customer-journey-intelligence-scoring.js";

export {
  CustomerJourneyIntelligenceEngine,
  defaultCustomerJourneyIntelligenceEngine,
} from "./engines/customer-journey-intelligence-engine.js";

export {
  CUSTOMER_JOURNEY_INTELLIGENCE_MODULE_ID,
  CUSTOMER_JOURNEY_INTELLIGENCE_MODULE_VERSION,
  CUSTOMER_JOURNEY_INTELLIGENCE_CAPABILITIES,
  CUSTOMER_JOURNEY_INTELLIGENCE_MODULE_CONTRACT,
  CustomerJourneyIntelligenceModule,
  createCustomerJourneyIntelligenceModule,
  customerJourneyIntelligenceModule,
} from "./contract/customer-journey-intelligence-module.js";
export type {
  CustomerJourneyIntelligenceModuleId,
  CustomerJourneyIntelligenceCapability,
  CustomerJourneyIntelligenceModuleContract,
} from "./contract/customer-journey-intelligence-module.js";
