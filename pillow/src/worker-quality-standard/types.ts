import type { WorkerQualityStandardConfiguration } from "./configuration.js";
import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  QUALITY_DECISIONS,
  QUALITY_STANDARDS,
  VALIDATION_STATUSES,
  WQS_CAPABILITIES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type QualityStandard = (typeof QUALITY_STANDARDS)[number];
export type QualityDecision = (typeof QUALITY_DECISIONS)[number];
export type WorkerQualityStandardCapability = (typeof WQS_CAPABILITIES)[number];

/** Machine-readable Quality Record (Q0-27). */
export type QualityRecord = {
  qualityRecordId: string;
  timestamp: string;
  workerId: string;
  missionId: string;
  reasoningSummary: string;
  confidenceScore: number;
  evidence: string[];
  assumptions: string[];
  limitations: string[];
  validationResult: QualityDecision | string;
  governanceCompliance: boolean;
  metadataVersion: string;
  qualityTraceId: string;
  validationStatus: ValidationStatus;
  uncertaintyDetected: boolean;
  standardsChecked: string[];
  standardsSatisfied: string[];
  standardsFailed: string[];
  completionReport: string;
  /** Explicit Q0-27 boundaries. */
  neverExecuteWorkerTasks: true;
  neverReplaceWorkerImplementations: true;
  neverReplacePeerReviewRuntime: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  workerTasksExecuted: false;
  workerImplementationsReplaced: false;
  peerReviewRuntimeReplaced: false;
  pillowOverridden: false;
  grandKingOverridden: false;
  preserveQualityTraceability: true;
  preserveAuditability: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

/** Input for Q0-27 — define/validate quality only. */
export type WorkerQualityStandardInput = {
  qualityRecordId?: string | null;
  workerId?: string | null;
  missionId?: string | null;
  businessId?: string | null;
  reasoningSummary?: string | null;
  confidenceScore?: number | null;
  evidence?: string[];
  assumptions?: string[];
  limitations?: string[];
  uncertaintySignals?: string[];
  governanceCompliant?: boolean | null;
  structuredReasoningPerformed?: boolean | null;
  selfValidationPerformed?: boolean | null;
  completionReport?: string | null;
  requiredStandards?: string[];
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  executeWorkerTasks?: boolean;
  replaceWorkerImplementations?: boolean;
  replacePeerReviewRuntime?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
};

export type WorkerQualityStandardValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type WorkerQualityStandardEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-WQS-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: WorkerQualityStandardCapability[];
  totalQualityRecords: number;
  compliantCount: number;
  nonCompliantCount: number;
  averageConfidence: number;
  lastDecision: QualityDecision | string | null;
  metadataVersion: string;
};

export type WorkerQualityStandardRunReport = {
  qualityRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "validate_worker"
    | "score_confidence"
    | "record_evidence"
    | "record_assumptions"
    | "report_limitations"
    | "check_governance"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: WorkerQualityStandardEngineRecord;
  records: QualityRecord[];
  qualityDecision: QualityDecision | string | null;
  confidenceScore: number | null;
  standardsFailed: string[];
  validation: WorkerQualityStandardValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type WorkerQualityStandardState = {
  engineVersion: "PILLOW-WQS-001";
  missionId: "Q0-27";
  status: EngineStatus;
  initializedAt: string;
  configuration: WorkerQualityStandardConfiguration;
  latestReport: WorkerQualityStandardRunReport | null;
  engineRecord: WorkerQualityStandardEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalQualityRecords: number;
    compliantCount: number;
    nonCompliantCount: number;
    averageConfidence: number;
    lastDecision: QualityDecision | string | null;
    notes: string[];
  };
};

export type WorkerQualityStandardCockpitSnapshot = {
  missionId: "Q0-27";
  status: EngineStatus;
  healthStatus: HealthStatus;
  totalQualityRecords: number;
  latestQualityRecordId: string | null;
  compliantCount: number;
  neverExecuteWorkerTasks: true;
  neverReplaceWorkerImplementations: true;
  neverReplacePeerReviewRuntime: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
