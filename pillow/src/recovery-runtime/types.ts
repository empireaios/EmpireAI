import type { RecoveryRuntimeConfiguration } from "./configuration.js";
import type {
  AUDIT_STATUSES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  ESCALATION_STATUSES,
  FAILURE_CLASSIFICATIONS,
  INTEGRATION_TARGETS,
  RECRT_CAPABILITIES,
  RECOVERY_STATUSES,
  RECOVERY_STRATEGIES,
  ROLLBACK_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type FailureClassification = (typeof FAILURE_CLASSIFICATIONS)[number];
export type RecoveryStrategy = (typeof RECOVERY_STRATEGIES)[number];
export type RecoveryStatus = (typeof RECOVERY_STATUSES)[number];
export type EscalationStatus = (typeof ESCALATION_STATUSES)[number];
export type RollbackStatus = (typeof ROLLBACK_STATUSES)[number];
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type RecrtCapability = (typeof RECRT_CAPABILITIES)[number];

export type RecoveryCase = {
  recoveryId: string;
  failureId: string;
  missionId: string;
  jobId: string;
  workerId: string;
  factoryId: string;
  failureClassification: FailureClassification;
  recoveryStrategy: RecoveryStrategy;
  recoveryStatus: RecoveryStatus;
  restartCount: number;
  maxRestarts: number;
  rollbackStatus: RollbackStatus;
  escalationStatus: EscalationStatus;
  detectedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  checkpointRef: string | null;
  stateRef: string | null;
  supportingEvidence: string[];
  auditReference: string;
  pillowConfirmed: boolean;
  grandKingApproved: boolean;
  automaticPermitted: boolean;
  highRisk: boolean;
  fabricated: false;
  structuralSignalOnly: true;
  metadataVersion: string;
};

export type FailureRecord = {
  failureId: string;
  missionId: string;
  jobId: string;
  workerId: string;
  factoryId: string;
  failureClassification: FailureClassification | null;
  classificationSignals: string[];
  detectedAt: string;
  checkpointRef: string | null;
  stateRef: string | null;
  highRisk: boolean;
  supportingEvidence: string[];
  auditReference: string;
  fabricated: false;
  structuralSignalOnly: true;
  metadataVersion: string;
};

export type CheckpointRecord = {
  checkpointId: string;
  recoveryId: string;
  failureId: string;
  checkpointRef: string;
  stateRef: string | null;
  restoredAt: string | null;
  status: "registered" | "restoring" | "restored" | "failed";
  supportingEvidence: string[];
  auditReference: string;
  fabricated: false;
  structuralSignalOnly: true;
  metadataVersion: string;
};

export type RestartRecord = {
  restartId: string;
  recoveryId: string;
  failureId: string;
  jobId: string;
  attempt: number;
  maxRestarts: number;
  status: "pending" | "restarting" | "restarted" | "failed" | "max_exceeded";
  timestamp: string;
  supportingEvidence: string[];
  auditReference: string;
  fabricated: false;
  structuralSignalOnly: true;
  metadataVersion: string;
};

export type RollbackRecord = {
  rollbackId: string;
  recoveryId: string;
  failureId: string;
  rollbackStatus: RollbackStatus;
  checkpointRef: string | null;
  stateRef: string | null;
  timestamp: string;
  supportingEvidence: string[];
  auditReference: string;
  fabricated: false;
  structuralSignalOnly: true;
  metadataVersion: string;
};

export type EscalationRecord = {
  escalationId: string;
  recoveryId: string;
  failureId: string;
  escalationStatus: EscalationStatus;
  reasonRef: string;
  timestamp: string;
  supportingEvidence: string[];
  auditReference: string;
  fabricated: false;
  structuralSignalOnly: true;
  metadataVersion: string;
};

export type RecoverySummary = {
  totalFailures: number;
  totalRecoveries: number;
  activeCount: number;
  completedCount: number;
  failedCount: number;
  escalatedCount: number;
  awaitingApprovalCount: number;
  supportingEvidence: string[];
  fabricated: false;
  structuralSignalOnly: true;
};

export type RestartSummary = {
  totalRestarts: number;
  successfulRestarts: number;
  failedRestarts: number;
  maxExceededCount: number;
  supportingEvidence: string[];
  fabricated: false;
  structuralSignalOnly: true;
};

export type RollbackSummary = {
  totalRollbacks: number;
  completedRollbacks: number;
  failedRollbacks: number;
  supportingEvidence: string[];
  fabricated: false;
  structuralSignalOnly: true;
};

export type EscalationSummary = {
  totalEscalations: number;
  pendingCount: number;
  escalatedCount: number;
  acknowledgedCount: number;
  supportingEvidence: string[];
  fabricated: false;
  structuralSignalOnly: true;
};

export type RecoveryMetrics = {
  totalFailures: number;
  totalRecoveries: number;
  totalRestarts: number;
  totalRollbacks: number;
  totalEscalations: number;
  totalCheckpoints: number;
  totalReports: number;
  activeRecoveries: number;
  completedRecoveries: number;
  failedRecoveries: number;
};

export type RecoveryRuntimeReport = {
  reportId: string;
  timestamp: string;
  runtimeVersion: string;
  recoverySummary: RecoverySummary;
  activeRecoveries: RecoveryCase[];
  completedRecoveries: RecoveryCase[];
  failedRecoveries: RecoveryCase[];
  restartSummary: RestartSummary;
  rollbackSummary: RollbackSummary;
  escalationSummary: EscalationSummary;
  recoveryMetrics: RecoveryMetrics;
  supportingEvidence: string[];
  auditStatus: AuditStatus;
  outstandingIssues: string[];
  confidenceScore: number;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  consumableByQ1012: boolean;
  neverFabricateRecoverySuccess: true;
  neverLoseRecoverableExecutionState: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverModifyValidatedBusinessData: true;
  neverReplaceBusinessLogic: true;
  neverImplementQ1012OrLater: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  preserveCompleteTraceability: true;
  preserveRecoveryHistory: true;
  preserveAuditHistory: true;
  deterministicRecoveryBehaviour: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type Q1012ConsumableContract = {
  contractId: string;
  contractVersion: string;
  producedBy: "recovery-runtime";
  missionId: "Q10-11";
  consumerMissionId: "Q10-12";
  exposedFields: string[];
  failureClassificationCatalog: string[];
  recoveryStrategyCatalog: string[];
  recoveryStatusCatalog: string[];
  notes: string[];
  neverImplementQ1012OrLater: true;
  structuralSignalOnly: true;
};

export type RecrtInput = {
  recoveryId?: string;
  failureId?: string;
  missionId?: string | null;
  jobId?: string;
  workerId?: string;
  factoryId?: string;
  failureClassification?: FailureClassification;
  recoveryStrategy?: RecoveryStrategy;
  classificationSignals?: string[];
  checkpointRef?: string | null;
  stateRef?: string | null;
  auditReference?: string;
  pillowConfirmed?: boolean;
  grandKingApproved?: boolean;
  automaticPermitted?: boolean;
  highRisk?: boolean;
  maxRestarts?: number;
  validated?: boolean;
  forceFail?: boolean;
  exposeSecrets?: boolean;
  fabricateSuccess?: boolean;
  loseState?: boolean;
  loseRecoverableExecutionState?: boolean;
  bypassPillowGovernance?: boolean;
  bypassGrandKingApproval?: boolean;
  modifyBusinessData?: boolean;
  modifyValidatedBusinessData?: boolean;
  replaceBusinessLogic?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  overrideApprovedArchitecture?: boolean;
  implementQ1012OrLater?: boolean;
  targetMissionId?: string | null;
  businessPayload?: unknown;
};

export type RecrtValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type RecrtRunReport = {
  action: string;
  runTimestamp: string;
  durationMs: number;
  decision: "pass" | "partial" | "fail";
  validation: RecrtValidationReport;
  failure: FailureRecord | null;
  failures: FailureRecord[];
  recovery: RecoveryCase | null;
  recoveries: RecoveryCase[];
  checkpoint: CheckpointRecord | null;
  checkpoints: CheckpointRecord[];
  restart: RestartRecord | null;
  restarts: RestartRecord[];
  rollback: RollbackRecord | null;
  rollbacks: RollbackRecord[];
  escalation: EscalationRecord | null;
  escalations: EscalationRecord[];
  recoveryRuntimeReport: RecoveryRuntimeReport | null;
  q1012Contract: Q1012ConsumableContract | null;
  integrationHandshakes: IntegrationHandshake[];
  errors: string[];
  warnings: string[];
};

export type IntegrationHandshake = {
  target: string;
  available: boolean;
  probed: boolean;
  notes: string[];
};

export type RecrtEngineRecord = {
  engineId: string;
  workerId: string;
  operationalState: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalFailures: number;
  totalRecoveries: number;
  totalRestarts: number;
  totalRollbacks: number;
  totalEscalations: number;
  totalReports: number;
  lastReportId: string | null;
  supportedCapabilities: RecrtCapability[];
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type RecrtDiagnosticsSnapshot = {
  diagnosticsId: string;
  timestamp: string;
  totalFailures: number;
  totalRecoveries: number;
  totalCheckpoints: number;
  totalRestarts: number;
  totalRollbacks: number;
  totalEscalations: number;
  totalReports: number;
  activeRecoveries: number;
  integrationHandshakes: IntegrationHandshake[];
  notes: string[];
};

export type RecoveryRuntimeState = {
  engineVersion: "PILLOW-RECRT-001";
  missionId: "Q10-11";
  status: EngineStatus;
  initializedAt: string;
  configuration: RecoveryRuntimeConfiguration;
  latestReport: RecrtRunReport | null;
  engineRecord: RecrtEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalFailures: number;
    totalRecoveries: number;
    lastReportId: string | null;
    notes: string[];
  };
};

export type RecoveryRuntimeCockpitSnapshot = {
  missionId: "Q10-11";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalFailures: number;
  totalRecoveries: number;
  activeRecoveries: number;
  completedRecoveries: number;
  failedRecoveries: number;
  latestReportId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverFabricateRecoverySuccess: true;
  neverLoseRecoverableExecutionState: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverModifyValidatedBusinessData: true;
  neverReplaceBusinessLogic: true;
  neverImplementQ1012OrLater: true;
  structuralSignalOnly: true;
};
