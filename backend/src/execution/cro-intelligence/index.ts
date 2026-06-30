export {
  CRO_AREA_TYPES,
  CRO_AREA_LABELS,
  croAreaTypeSchema,
  validateCroAreaType,
} from "./models/cro-area-types.js";
export type { CroAreaType } from "./models/cro-area-types.js";

export {
  CRO_AREA_STATUSES,
  croAreaAnalysisSchema,
  validateCroAreaAnalysis,
} from "./models/cro-area-analysis.js";
export type { CroAreaStatus, CroAreaAnalysis } from "./models/cro-area-analysis.js";

export {
  CRO_IMPROVEMENT_PRIORITIES,
  croPriorityImprovementSchema,
  validateCroPriorityImprovement,
} from "./models/cro-priority-improvement.js";
export type {
  CroImprovementPriority,
  CroPriorityImprovement,
} from "./models/cro-priority-improvement.js";

export {
  CRO_SIGNAL_TYPES,
  croSignalSchema,
  validateCroSignal,
} from "./models/cro-signal.js";
export type { CroSignalType, CroSignal } from "./models/cro-signal.js";

export { croReportSchema, validateCroReport } from "./models/cro-report.js";
export type { CroReportId, CroReport, CroReportCreateInput } from "./models/cro-report.js";

export {
  croIntelligenceRecordSchema,
  validateCroIntelligenceRecord,
} from "./models/cro-intelligence-record.js";
export type {
  CroIntelligenceRecordId,
  CroIntelligenceRecord,
  CroIntelligenceRecordCreateInput,
} from "./models/cro-intelligence-record.js";

export type {
  CroIntelligenceRepositoryQuery,
  CroIntelligenceRepository,
} from "./repositories/cro-intelligence-repository.js";

export {
  InMemoryCroIntelligenceRepository,
  createInMemoryCroIntelligenceRepository,
} from "./repositories/in-memory-cro-intelligence-repository.js";

export {
  CRO_SIGNAL_WEIGHTS,
  generateCroReport,
  croIntelligenceScoring,
} from "./scoring/cro-intelligence-scoring.js";
export type {
  CroIntelligenceBrandInput,
  CroIntelligenceOfferInput,
  CroIntelligenceInput,
  CroIntelligenceBreakdown,
} from "./scoring/cro-intelligence-scoring.js";

export {
  CroIntelligenceEngine,
  defaultCroIntelligenceEngine,
} from "./engines/cro-intelligence-engine.js";

export {
  CRO_INTELLIGENCE_MODULE_ID,
  CRO_INTELLIGENCE_MODULE_VERSION,
  CRO_INTELLIGENCE_CAPABILITIES,
  CRO_INTELLIGENCE_MODULE_CONTRACT,
  CroIntelligenceModule,
  createCroIntelligenceModule,
  croIntelligenceModule,
} from "./contract/cro-intelligence-module.js";
export type {
  CroIntelligenceModuleId,
  CroIntelligenceCapability,
  CroIntelligenceModuleContract,
} from "./contract/cro-intelligence-module.js";
