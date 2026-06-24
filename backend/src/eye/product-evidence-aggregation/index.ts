export {
  EVIDENCE_AGGREGATION_SIGNAL_TYPES,
  evidenceAggregationSignalSchema,
  validateEvidenceAggregationSignal,
} from "./models/evidence-aggregation-signal.js";
export type {
  EvidenceAggregationSignal,
  EvidenceAggregationSignalType,
  SourceStrengthSummary,
} from "./models/evidence-aggregation-signal.js";

export {
  EVIDENCE_TREND_DIRECTIONS,
  productEvidenceSummarySchema,
  validateProductEvidenceSummary,
} from "./models/product-evidence-summary.js";
export type {
  ProductEvidenceSummary,
  ProductEvidenceSummaryId,
  ProductEvidenceSummaryCreateInput,
  ProductEvidenceSummaryUpdateInput,
  EvidenceTrendDirection,
} from "./models/product-evidence-summary.js";

export type {
  EvidenceAggregationListQuery,
  EvidenceAggregationRepository,
} from "./repositories/evidence-aggregation-repository.js";

export {
  InMemoryEvidenceAggregationRepository,
  createInMemoryEvidenceAggregationRepository,
} from "./repositories/in-memory-evidence-aggregation-repository.js";

export {
  EVIDENCE_AGGREGATION_WEIGHTS,
  aggregateProductEvidence,
  evidenceAggregationScoring,
} from "./scoring/evidence-aggregation-scoring.js";
export type { EvidenceAggregationScoreBreakdown } from "./scoring/evidence-aggregation-scoring.js";

export {
  ProductEvidenceAggregationEngine,
  defaultProductEvidenceAggregationEngine,
} from "./engines/product-evidence-aggregation-engine.js";

export {
  PRODUCT_EVIDENCE_AGGREGATION_MODULE_ID,
  PRODUCT_EVIDENCE_AGGREGATION_MODULE_VERSION,
  PRODUCT_EVIDENCE_AGGREGATION_CAPABILITIES,
  PRODUCT_EVIDENCE_AGGREGATION_MODULE_CONTRACT,
  ProductEvidenceAggregationModule,
  createProductEvidenceAggregationModule,
  productEvidenceAggregationModule,
} from "./contract/product-evidence-aggregation-module.js";
export type {
  ProductEvidenceAggregationModuleId,
  ProductEvidenceAggregationCapability,
  ProductEvidenceAggregationModuleContract,
} from "./contract/product-evidence-aggregation-module.js";
