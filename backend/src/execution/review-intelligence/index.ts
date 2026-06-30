export {
  SENTIMENT_LABELS,
  sentimentAnalysisSchema,
  validateSentimentAnalysis,
} from "./models/sentiment-analysis.js";
export type { SentimentLabel, SentimentAnalysis } from "./models/sentiment-analysis.js";

export {
  PAIN_POINT_SEVERITIES,
  painPointSchema,
  validatePainPoint,
} from "./models/pain-point.js";
export type { PainPointSeverity, PainPoint } from "./models/pain-point.js";

export {
  positiveThemeSchema,
  validatePositiveTheme,
} from "./models/positive-theme.js";
export type { PositiveTheme } from "./models/positive-theme.js";

export {
  featureRequestSchema,
  validateFeatureRequest,
} from "./models/feature-request.js";
export type { FeatureRequest } from "./models/feature-request.js";

export {
  competitorWeaknessSchema,
  validateCompetitorWeakness,
} from "./models/competitor-weakness.js";
export type { CompetitorWeakness } from "./models/competitor-weakness.js";

export {
  IMPROVEMENT_PRIORITIES,
  IMPROVEMENT_TARGET_AREAS,
  productImprovementSchema,
  validateProductImprovement,
} from "./models/product-improvement.js";
export type {
  ImprovementPriority,
  ImprovementTargetArea,
  ProductImprovement,
} from "./models/product-improvement.js";

export {
  REVIEW_INTELLIGENCE_SIGNAL_TYPES,
  reviewIntelligenceSignalSchema,
  validateReviewIntelligenceSignal,
} from "./models/review-intelligence-signal.js";
export type {
  ReviewIntelligenceSignalType,
  ReviewIntelligenceSignal,
} from "./models/review-intelligence-signal.js";

export {
  reviewIntelligenceReportSchema,
  validateReviewIntelligenceReport,
} from "./models/review-intelligence-report.js";
export type {
  ReviewIntelligenceReportId,
  ReviewIntelligenceReport,
  ReviewIntelligenceReportCreateInput,
} from "./models/review-intelligence-report.js";

export {
  reviewIntelligenceRecordSchema,
  validateReviewIntelligenceRecord,
} from "./models/review-intelligence-record.js";
export type {
  ReviewIntelligenceRecordId,
  ReviewIntelligenceRecord,
  ReviewIntelligenceRecordCreateInput,
} from "./models/review-intelligence-record.js";

export type {
  ReviewIntelligenceRepositoryQuery,
  ReviewIntelligenceRepository,
} from "./repositories/review-intelligence-repository.js";

export {
  InMemoryReviewIntelligenceRepository,
  createInMemoryReviewIntelligenceRepository,
} from "./repositories/in-memory-review-intelligence-repository.js";

export {
  REVIEW_INTELLIGENCE_SIGNAL_WEIGHTS,
  generateReviewIntelligenceReport,
  reviewIntelligenceScoring,
} from "./scoring/review-intelligence-scoring.js";
export type {
  ReviewIntelligenceBrandInput,
  ReviewIntelligenceOfferInput,
  ReviewIntelligenceInput,
  ReviewIntelligenceBreakdown,
} from "./scoring/review-intelligence-scoring.js";

export {
  ReviewIntelligenceEngine,
  defaultReviewIntelligenceEngine,
} from "./engines/review-intelligence-engine.js";

export {
  REVIEW_INTELLIGENCE_MODULE_ID,
  REVIEW_INTELLIGENCE_MODULE_VERSION,
  REVIEW_INTELLIGENCE_CAPABILITIES,
  REVIEW_INTELLIGENCE_MODULE_CONTRACT,
  ReviewIntelligenceModule,
  createReviewIntelligenceModule,
  reviewIntelligenceModule,
} from "./contract/review-intelligence-module.js";
export type {
  ReviewIntelligenceModuleId,
  ReviewIntelligenceCapability,
  ReviewIntelligenceModuleContract,
} from "./contract/review-intelligence-module.js";
