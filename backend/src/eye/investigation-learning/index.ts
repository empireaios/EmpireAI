export {
  LEARNING_SIGNAL_TYPES,
  learningSignalSchema,
  validateLearningSignal,
} from "./models/learning-signal.js";
export type { LearningSignalType, LearningSignal } from "./models/learning-signal.js";

export {
  LEARNED_PATTERN_TYPES,
  learnedPatternSchema,
  repeatedPatternSchema,
  confidenceAdjustmentSchema,
  RECOMMENDATION_PRIORITIES,
  investigationRecommendationSchema,
  investigationLearningRecordSchema,
  validateInvestigationLearningRecord,
} from "./models/investigation-learning-record.js";
export type {
  InvestigationLearningRecordId,
  LearnedPatternType,
  LearnedPattern,
  RepeatedPattern,
  ConfidenceAdjustment,
  RecommendationPriority,
  InvestigationRecommendation,
  InvestigationLearningRecord,
  InvestigationLearningRecordCreateInput,
} from "./models/investigation-learning-record.js";

export type {
  LearningRepositoryQuery,
  LearningRepository,
} from "./repositories/learning-repository.js";

export {
  InMemoryLearningRepository,
  createInMemoryLearningRepository,
} from "./repositories/in-memory-learning-repository.js";

export {
  LEARNING_SIGNAL_WEIGHTS,
  scoreInvestigationLearning,
  learningScoring,
} from "./scoring/learning-scoring.js";
export type {
  InvestigationLearningOpportunityInput,
  InvestigationLearningForecastInput,
  InvestigationLearningAnalysisInput,
} from "./scoring/learning-scoring.js";

export {
  InvestigationLearningEngine,
  defaultInvestigationLearningEngine,
} from "./engines/investigation-learning-engine.js";
export type { InvestigationLearningInput } from "./engines/investigation-learning-engine.js";

export {
  INVESTIGATION_LEARNING_MODULE_ID,
  INVESTIGATION_LEARNING_MODULE_VERSION,
  INVESTIGATION_LEARNING_CAPABILITIES,
  INVESTIGATION_LEARNING_MODULE_CONTRACT,
  InvestigationLearningModule,
  createInvestigationLearningModule,
  investigationLearningModule,
} from "./contract/investigation-learning-module.js";
export type {
  InvestigationLearningModuleId,
  InvestigationLearningCapability,
  InvestigationLearningModuleContract,
} from "./contract/investigation-learning-module.js";
