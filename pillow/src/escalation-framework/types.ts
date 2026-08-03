import type { EscalationFrameworkConfiguration } from "./configuration.js";
import type {
  ENGINE_STATUSES,
  ESCALATION_CATEGORIES,
  ESCALATION_PRIORITIES,
  ESCALATION_STATUSES,
  ESF_CAPABILITIES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type EscalationCategory = (typeof ESCALATION_CATEGORIES)[number];
export type EscalationPriority = (typeof ESCALATION_PRIORITIES)[number];
export type EscalationStatus = (typeof ESCALATION_STATUSES)[number];
export type EscalationFrameworkCapability = (typeof ESF_CAPABILITIES)[number];

export type RiskAssessment = {
  level: "low" | "medium" | "high" | "critical";
  summary: string;
  factors: string[];
};

export type EscalationTriggerSignals = {
  confidenceScore?: number | null;
  missingFields?: string[];
  conflictingRecommendations?: string[];
  conflictingEvidence?: string[];
  authorityViolation?: boolean;
  policyViolation?: boolean;
  workerDeadlock?: boolean;
  repeatedFailureCount?: number | null;
  technicalFailure?: boolean;
  businessRisk?: boolean;
  securityRisk?: boolean;
  executiveDecisionRequired?: boolean;
  unresolvedDisagreement?: boolean;
};

/** Machine-readable Escalation Record (Q0-22). */
export type EscalationRecord = {
  escalationId: string;
  timestamp: string;
  missionId: string;
  taskId: string;
  businessId: string;
  escalationCategory: EscalationCategory | string;
  triggerReason: string;
  relatedWorkers: string[];
  currentEvidence: string[];
  riskAssessment: RiskAssessment;
  recommendedActions: string[];
  escalationPriority: EscalationPriority;
  currentStatus: EscalationStatus;
  metadataVersion: string;
  escalationTraceId: string;
  validationStatus: ValidationStatus;
  routedToPillow: boolean;
  pillowNotified: boolean;
  detectedConditions: string[];
  /** Explicit Q0-22 boundaries. */
  neverExecuteWorkerTasks: true;
  neverResolveBusinessDisputes: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverReplaceExecutiveJudgement: true;
  workerTasksExecuted: false;
  businessDisputesResolved: false;
  pillowOverridden: false;
  grandKingOverridden: false;
  executiveJudgementReplaced: false;
  preserveEscalationTraceability: true;
  preserveAuditability: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

/** Input for Q0-22 — detect/route/track only. */
export type EscalationFrameworkInput = {
  escalationId?: string | null;
  missionId?: string | null;
  taskId?: string | null;
  businessId?: string | null;
  escalationCategory?: EscalationCategory | string | null;
  triggerReason?: string | null;
  relatedWorkers?: string[];
  currentEvidence?: string[];
  recommendedActions?: string[];
  escalationPriority?: EscalationPriority | string | null;
  riskLevel?: RiskAssessment["level"] | null;
  riskSummary?: string | null;
  riskFactors?: string[];
  signals?: EscalationTriggerSignals;
  forceRouteToPillow?: boolean;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  executeWorkerTasks?: boolean;
  resolveBusinessDisputes?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  replaceExecutiveJudgement?: boolean;
};

export type EscalationFrameworkValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type EscalationFrameworkEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-ESF-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: EscalationFrameworkCapability[];
  totalEscalationRecords: number;
  openEscalations: number;
  lastPriority: EscalationPriority | null;
  metadataVersion: string;
};

export type EscalationFrameworkRunReport = {
  escalationRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "detect"
    | "escalate_low_confidence"
    | "escalate_missing_information"
    | "escalate_conflicting_recommendations"
    | "escalate_worker_deadlock"
    | "escalate_executive_decision"
    | "generate"
    | "route_to_pillow"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: EscalationFrameworkEngineRecord;
  records: EscalationRecord[];
  detectedConditions: string[];
  routedToPillow: boolean;
  escalationPriority: EscalationPriority | null;
  validation: EscalationFrameworkValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type EscalationFrameworkState = {
  engineVersion: "PILLOW-ESF-001";
  missionId: "Q0-22";
  status: EngineStatus;
  initializedAt: string;
  configuration: EscalationFrameworkConfiguration;
  latestReport: EscalationFrameworkRunReport | null;
  engineRecord: EscalationFrameworkEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalEscalationRecords: number;
    openEscalations: number;
    lastPriority: EscalationPriority | null;
    notes: string[];
  };
};

export type EscalationFrameworkCockpitSnapshot = {
  missionId: "Q0-22";
  status: EngineStatus;
  healthStatus: HealthStatus;
  totalEscalationRecords: number;
  latestEscalationId: string | null;
  openEscalations: number;
  neverExecuteWorkerTasks: true;
  neverResolveBusinessDisputes: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverReplaceExecutiveJudgement: true;
};
