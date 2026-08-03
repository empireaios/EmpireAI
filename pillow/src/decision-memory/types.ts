import type { DecisionMemoryConfiguration } from "./configuration.js";
import type {
  APPROVAL_STATUSES,
  ENGINE_STATUSES,
  FINAL_OUTCOMES,
  HEALTH_STATUSES,
  LOOKUP_DIMENSIONS,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
  DMEM_CAPABILITIES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];
export type FinalOutcome = (typeof FINAL_OUTCOMES)[number];
export type LookupDimension = (typeof LOOKUP_DIMENSIONS)[number];
export type DecisionMemoryCapability = (typeof DMEM_CAPABILITIES)[number];

export type AlternativeOption = {
  optionId: string;
  summary: string;
  rejectedReason?: string | null;
};

export type RiskAssessment = {
  level: "low" | "medium" | "high" | "critical";
  summary: string;
  factors: string[];
};

/** Machine-readable Decision Record (Q0-16). */
export type DecisionRecord = {
  decisionId: string;
  timestamp: string;
  executiveObjective: string;
  businessId: string;
  missionId: string;
  decisionSummary: string;
  recommendedOption: string;
  alternativeOptions: AlternativeOption[];
  decisionRationale: string;
  supportingEvidence: string[];
  assumptions: string[];
  riskAssessment: RiskAssessment;
  confidenceScore: number;
  approvalStatus: ApprovalStatus;
  finalOutcome: FinalOutcome;
  relatedWorkers: string[];
  metadataVersion: string;
  decisionTraceId: string;
  validationStatus: ValidationStatus;
  /** Explicit Q0-16 boundaries. */
  neverMakeDecisions: true;
  neverExecuteWork: true;
  neverReplaceExecutionMemory: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  decisionsMade: false;
  workExecuted: false;
  executionMemoryReplaced: false;
  pillowOverridden: false;
  grandKingOverridden: false;
  preserveDecisionTraceability: true;
  preserveAuditability: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

/** Input for Q0-16 — record/retrieve only. */
export type DecisionMemoryInput = {
  decisionId?: string | null;
  executiveObjective?: string | null;
  businessId?: string | null;
  missionId?: string | null;
  decisionSummary?: string | null;
  recommendedOption?: string | null;
  alternativeOptions?: AlternativeOption[];
  decisionRationale?: string | null;
  supportingEvidence?: string[];
  assumptions?: string[];
  riskLevel?: RiskAssessment["level"] | null;
  riskSummary?: string | null;
  riskFactors?: string[];
  confidenceScore?: number | null;
  approvalStatus?: ApprovalStatus | string | null;
  finalOutcome?: FinalOutcome | string | null;
  relatedWorkers?: string[];
  /** Lookup / compare helpers */
  dimension?: LookupDimension | string | null;
  query?: string | null;
  minConfidence?: number | null;
  maxConfidence?: number | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  compareDecisionIds?: string[];
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  makeDecisions?: boolean;
  executeWork?: boolean;
  replaceExecutionMemory?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
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

export type DecisionMemoryEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-DMEM-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: DecisionMemoryCapability[];
  totalDecisionRecords: number;
  lastConfidenceScore: number | null;
  metadataVersion: string;
};

export type DecisionMemoryRunReport = {
  decisionRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "record"
    | "retrieve"
    | "search"
    | "compare"
    | "update_outcome"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: DecisionMemoryEngineRecord;
  records: DecisionRecord[];
  comparisons: Array<{
    leftDecisionId: string;
    rightDecisionId: string;
    sharedAssumptions: string[];
    differingOptions: string[];
    confidenceDelta: number;
    outcomeDelta: string;
  }>;
  validation: DecisionValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type DecisionMemoryState = {
  engineVersion: "PILLOW-DMEM-001";
  missionId: "Q0-16";
  status: EngineStatus;
  initializedAt: string;
  configuration: DecisionMemoryConfiguration;
  latestReport: DecisionMemoryRunReport | null;
  engineRecord: DecisionMemoryEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalDecisionRecords: number;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type DecisionMemoryCockpitSnapshot = {
  missionId: "Q0-16";
  status: EngineStatus;
  healthStatus: HealthStatus;
  totalDecisionRecords: number;
  latestDecisionId: string | null;
  lastConfidenceScore: number | null;
  neverMakeDecisions: true;
  neverExecuteWork: true;
  neverReplaceExecutionMemory: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
