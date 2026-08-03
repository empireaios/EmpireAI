import type { DecisionEngineConfiguration } from "./configuration.js";
import type {
  DE_CAPABILITIES,
  ENGINE_STATUSES,
  EVALUATION_CRITERIA,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type BuiltinEvaluationCriterion = (typeof EVALUATION_CRITERIA)[number];
export type DecisionEngineCapability = (typeof DE_CAPABILITIES)[number];

/** Input for Q0-05 — executive problem only. No execution or approval. */
export type DecisionEngineInput = {
  executiveObjective: string;
  contextHints?: string[];
  constraintHints?: string[];
  riskHints?: string[];
  assumptionHints?: string[];
  optionHints?: Array<{ title: string; description?: string; approach?: string }>;
  /** Additional/future criteria IDs without redesign. */
  criteriaHints?: string[];
  missingInfoHints?: string[];
  evidenceHints?: string[];
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  executeWork?: boolean;
  assignWorkers?: boolean;
  approveActions?: boolean;
  overridePillow?: boolean;
  replaceGrandKingApproval?: boolean;
};

export type CandidateOption = {
  optionId: string;
  title: string;
  description: string;
  approach: string;
  tags: string[];
};

export type CriterionScore = {
  criterionId: string;
  criterionLabel: string;
  /** Benefit-scale score 0–100 (higher is always better). */
  score: number;
  weight: number;
  notes: string;
};

export type EvaluationMatrixRow = {
  optionId: string;
  scores: CriterionScore[];
  weightedTotal: number;
};

export type TradeOffComparison = {
  criterionId: string;
  leadingOptionId: string;
  trailingOptionId: string;
  delta: number;
  insight: string;
};

export type TradeOffAnalysis = {
  summary: string;
  comparisons: TradeOffComparison[];
  dominantTradeOffs: string[];
};

export type RecommendedOption = {
  optionId: string;
  title: string;
  rationale: string;
};

/** Machine-readable Decision Package (Q0-05). */
export type DecisionPackage = {
  decisionId: string;
  timestamp: string;
  executiveObjective: string;
  candidateOptions: CandidateOption[];
  evaluationMatrix: EvaluationMatrixRow[];
  tradeOffAnalysis: TradeOffAnalysis;
  recommendedOption: RecommendedOption;
  confidenceScore: number;
  riskAssessment: string[];
  assumptions: string[];
  missingInformation: string[];
  supportingEvidence: string[];
  metadataVersion: string;
  decisionTraceId: string;
  validationStatus: ValidationStatus;
  /** Explicit Q0-05 boundaries. */
  neverExecuteWork: true;
  neverAssignWorkers: true;
  neverApproveActions: true;
  neverOverridePillow: true;
  neverReplaceGrandKingApproval: true;
  workExecuted: false;
  workersAssigned: false;
  actionsApproved: false;
  pillowOverridden: false;
  grandKingApprovalReplaced: false;
  preserveDecisionTraceability: true;
  preserveAuditability: true;
  preserveDecisionIntegrity: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type DecisionValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type DecisionEngineEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-DE-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: DecisionEngineCapability[];
  totalDecisions: number;
  metadataVersion: string;
};

export type DecisionEngineRunReport = {
  decisionRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "submit_problem"
    | "generate_options"
    | "evaluate_options"
    | "produce_decision_package"
    | "validate_decision"
    | "diagnostics";
  engineRecord: DecisionEngineEngineRecord;
  packages: DecisionPackage[];
  validation: DecisionValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type DecisionEngineState = {
  engineVersion: "PILLOW-DE-001";
  missionId: "Q0-05";
  status: EngineStatus;
  initializedAt: string;
  configuration: DecisionEngineConfiguration;
  latestReport: DecisionEngineRunReport | null;
  engineRecord: DecisionEngineEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalDecisions: number;
    notes: string[];
  };
};

export type DecisionEngineCockpitSnapshot = {
  missionId: "Q0-05";
  status: EngineStatus;
  healthStatus: HealthStatus;
  totalDecisions: number;
  latestDecisionId: string | null;
  neverExecuteWork: true;
  neverAssignWorkers: true;
  neverApproveActions: true;
  neverOverridePillow: true;
  neverReplaceGrandKingApproval: true;
};
