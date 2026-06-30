export {
  reasoningStepSchema,
  decisionReasoningSchema,
  validateDecisionReasoning,
  validateReasoningStep,
} from "./models/decision-reasoning.js";
export type { ReasoningStep, DecisionReasoning } from "./models/decision-reasoning.js";

export {
  EVIDENCE_CATEGORIES,
  EVIDENCE_SOURCES,
  decisionEvidenceSchema,
  validateDecisionEvidence,
} from "./models/decision-evidence.js";
export type { EvidenceCategory, EvidenceSource, DecisionEvidence } from "./models/decision-evidence.js";

export {
  CERTAINTY_LEVELS,
  decisionConfidenceSchema,
  validateDecisionConfidence,
} from "./models/decision-confidence.js";
export type { CertaintyLevel, DecisionConfidence } from "./models/decision-confidence.js";

export {
  decisionAlternativeSchema,
  validateDecisionAlternative,
} from "./models/decision-alternative.js";
export type { DecisionAlternative } from "./models/decision-alternative.js";

export {
  TRADEOFF_DIMENSIONS,
  decisionTradeoffSchema,
  validateDecisionTradeoff,
} from "./models/decision-tradeoff.js";
export type { TradeoffDimension, DecisionTradeoff } from "./models/decision-tradeoff.js";

export {
  DECISION_SUPPORTING_SIGNAL_TYPES,
  decisionSupportingSignalSchema,
  validateDecisionSupportingSignal,
} from "./models/decision-supporting-signal.js";
export type {
  DecisionSupportingSignalType,
  DecisionSupportingSignal,
} from "./models/decision-supporting-signal.js";

export {
  DECISION_TYPES,
  decisionExplainabilityReportSchema,
  validateDecisionExplainabilityReport,
} from "./models/decision-explainability-report.js";
export type {
  DecisionType,
  DecisionExplainabilityReportId,
  DecisionExplainabilityReport,
  DecisionExplainabilityReportCreateInput,
} from "./models/decision-explainability-report.js";

export {
  decisionExplainabilityRecordSchema,
  validateDecisionExplainabilityRecord,
} from "./models/decision-explainability-record.js";
export type {
  DecisionExplainabilityRecordId,
  DecisionExplainabilityRecord,
  DecisionExplainabilityRecordCreateInput,
} from "./models/decision-explainability-record.js";

export type {
  DecisionExplainabilityIntelligenceRepositoryQuery,
  DecisionExplainabilityIntelligenceRepository,
} from "./repositories/decision-explainability-intelligence-repository.js";

export {
  InMemoryDecisionExplainabilityIntelligenceRepository,
  createInMemoryDecisionExplainabilityIntelligenceRepository,
} from "./repositories/in-memory-decision-explainability-intelligence-repository.js";

export {
  DECISION_SUPPORTING_SIGNAL_WEIGHTS,
  generateDecisionExplainability,
  decisionExplainabilityIntelligenceScoring,
} from "./scoring/decision-explainability-intelligence-scoring.js";
export type {
  DecisionExplainabilityBrandInput,
  DecisionExplainabilityDecisionInput,
  DecisionExplainabilityInput,
  DecisionExplainabilityBreakdown,
} from "./scoring/decision-explainability-intelligence-scoring.js";

export {
  DecisionExplainabilityIntelligenceEngine,
  defaultDecisionExplainabilityIntelligenceEngine,
} from "./engines/decision-explainability-intelligence-engine.js";

export {
  DECISION_EXPLAINABILITY_INTELLIGENCE_MODULE_ID,
  DECISION_EXPLAINABILITY_INTELLIGENCE_MODULE_VERSION,
  DECISION_EXPLAINABILITY_INTELLIGENCE_CAPABILITIES,
  DECISION_EXPLAINABILITY_INTELLIGENCE_MODULE_CONTRACT,
  DecisionExplainabilityIntelligenceModule,
  createDecisionExplainabilityIntelligenceModule,
  decisionExplainabilityIntelligenceModule,
} from "./contract/decision-explainability-intelligence-module.js";
export type {
  DecisionExplainabilityIntelligenceModuleId,
  DecisionExplainabilityIntelligenceCapability,
  DecisionExplainabilityIntelligenceModuleContract,
} from "./contract/decision-explainability-intelligence-module.js";
