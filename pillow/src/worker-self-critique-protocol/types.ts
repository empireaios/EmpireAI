import type { WorkerSelfCritiqueProtocolConfiguration } from "./configuration.js";
import type {
  CRITIQUE_CHECKS,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  SUBMISSION_DECISIONS,
  VALIDATION_STATUSES,
  WSCP_CAPABILITIES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type CritiqueCheck = (typeof CRITIQUE_CHECKS)[number];
export type SubmissionDecision = (typeof SUBMISSION_DECISIONS)[number];
export type WorkerSelfCritiqueProtocolCapability = (typeof WSCP_CAPABILITIES)[number];

/** Machine-readable Self-Critique Record (Q0-28). */
export type SelfCritiqueRecord = {
  selfCritiqueId: string;
  timestamp: string;
  workerId: string;
  missionId: string;
  outputReviewed: string;
  completenessScore: number;
  logicalConsistency: number;
  evidenceReview: string[];
  weaknessesFound: string[];
  suggestedImprovements: string[];
  revisedConfidenceScore: number;
  submissionDecision: SubmissionDecision | string;
  metadataVersion: string;
  critiqueTraceId: string;
  validationStatus: ValidationStatus;
  checksPerformed: string[];
  checksFailed: string[];
  factualConsistency: number;
  assumptionsIdentified: string[];
  missingEvidence: string[];
  initialConfidenceScore: number;
  revisionRequired: boolean;
  /** Explicit Q0-28 boundaries. */
  neverReplacePeerReviewRuntime: true;
  neverReplaceWorkerQualityStandard: true;
  neverExecuteWorkerTasks: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  peerReviewRuntimeReplaced: false;
  workerQualityStandardReplaced: false;
  workerTasksExecuted: false;
  pillowOverridden: false;
  grandKingOverridden: false;
  preserveCritiqueTraceability: true;
  preserveAuditability: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

/** Input for Q0-28 — evaluate completed result only. */
export type WorkerSelfCritiqueProtocolInput = {
  selfCritiqueId?: string | null;
  workerId?: string | null;
  missionId?: string | null;
  businessId?: string | null;
  outputReviewed?: string | null;
  completenessScore?: number | null;
  logicalConsistency?: number | null;
  factualConsistency?: number | null;
  evidenceReview?: string[];
  weaknessesFound?: string[];
  suggestedImprovements?: string[];
  assumptionsIdentified?: string[];
  missingEvidence?: string[];
  initialConfidenceScore?: number | null;
  forceDecision?: SubmissionDecision | string | null;
  forceRevision?: boolean;
  checks?: string[];
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  replacePeerReviewRuntime?: boolean;
  replaceWorkerQualityStandard?: boolean;
  executeWorkerTasks?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
};

export type WorkerSelfCritiqueProtocolValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type WorkerSelfCritiqueProtocolEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-WSCP-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: WorkerSelfCritiqueProtocolCapability[];
  totalCritiqueRecords: number;
  reviseCount: number;
  submitCount: number;
  escalateCount: number;
  averageRevisedConfidence: number;
  lastDecision: SubmissionDecision | string | null;
  metadataVersion: string;
};

export type WorkerSelfCritiqueProtocolRunReport = {
  critiqueRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "critique"
    | "check_completeness"
    | "check_consistency"
    | "identify_weaknesses"
    | "recalculate_confidence"
    | "decide_submission"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: WorkerSelfCritiqueProtocolEngineRecord;
  records: SelfCritiqueRecord[];
  submissionDecision: SubmissionDecision | string | null;
  revisedConfidenceScore: number | null;
  weaknessesFound: string[];
  revisionRequired: boolean;
  validation: WorkerSelfCritiqueProtocolValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type WorkerSelfCritiqueProtocolState = {
  engineVersion: "PILLOW-WSCP-001";
  missionId: "Q0-28";
  status: EngineStatus;
  initializedAt: string;
  configuration: WorkerSelfCritiqueProtocolConfiguration;
  latestReport: WorkerSelfCritiqueProtocolRunReport | null;
  engineRecord: WorkerSelfCritiqueProtocolEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalCritiqueRecords: number;
    reviseCount: number;
    submitCount: number;
    averageRevisedConfidence: number;
    lastDecision: SubmissionDecision | string | null;
    notes: string[];
  };
};

export type WorkerSelfCritiqueProtocolCockpitSnapshot = {
  missionId: "Q0-28";
  status: EngineStatus;
  healthStatus: HealthStatus;
  totalCritiqueRecords: number;
  latestSelfCritiqueId: string | null;
  reviseCount: number;
  neverReplacePeerReviewRuntime: true;
  neverReplaceWorkerQualityStandard: true;
  neverExecuteWorkerTasks: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
