import type { WorkerRecoverySystemConfiguration } from "./configuration.js";
import type {
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  ESCALATION_STATUSES,
  FAILURE_TYPES,
  OPERATIONAL_STATES,
  RECOVERY_DECISIONS,
  RECOVERY_RULES,
  RECOVERY_STATUSES,
  RECOVERY_STRATEGIES,
  VALIDATION_STATUSES,
  WRS_CAPABILITIES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type RecoveryStrategy = (typeof RECOVERY_STRATEGIES)[number];
export type FailureType = (typeof FAILURE_TYPES)[number];
export type RecoveryStatus = (typeof RECOVERY_STATUSES)[number];
export type EscalationStatus = (typeof ESCALATION_STATUSES)[number];
export type RecoveryDecision = (typeof RECOVERY_DECISIONS)[number];
export type RecoveryRule = (typeof RECOVERY_RULES)[number];
export type WorkerRecoveryCapability = (typeof WRS_CAPABILITIES)[number];

/** Worker enrolled for automatic recovery registration. */
export type RecoverableWorker = {
  workerId: string;
  workerName: string;
  missionId: string | null;
  lifecycleStatus: string;
  authorityLevel: string;
  available: boolean;
  failureCount: number;
  lastFailureType: FailureType | string | null;
  executionStatePreserved: boolean;
  duplicateExecutionPrevented: true;
  neverExecuteWorkerBusinessLogic: true;
};

export type RecoveryOption = {
  strategy: RecoveryStrategy | string;
  safe: boolean;
  reason: string;
  preferred: boolean;
};

/** Machine-readable Worker Recovery Record (Q1-12). */
export type RecoveryRecord = {
  recoveryId: string;
  timestamp: string;
  workerId: string;
  workerName: string;
  missionId: string;
  failureType: FailureType | string;
  failureCause: string;
  recoveryStrategy: RecoveryStrategy | string;
  recoveryAction: string;
  recoveryStatus: RecoveryStatus | string;
  escalationStatus: EscalationStatus | string;
  recoveryDurationMs: number;
  supportingEvidence: string[];
  metadataVersion: string;
  optionsConsidered: RecoveryOption[];
  reassignedToWorkerId: string | null;
  missionContinued: boolean;
  executionStatePreserved: true;
  neverExecuteWorkerBusinessLogic: true;
  neverReplaceWorkerMonitoring: true;
  neverReplaceWorkforceOrchestrator: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  respectAuthorityMatrix: true;
  respectWorkerLifecycle: true;
  respectMissionCoordinationEngine: true;
  preserveMissionIntegrity: true;
  preserveAuditHistory: true;
  preserveExecutionHistory: true;
  preventDuplicateExecution: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type WorkerRecoveryCatalog = {
  recoveryVersion: string;
  strategies: string[];
  failureTypes: string[];
  workers: RecoverableWorker[];
  records: RecoveryRecord[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverExecuteWorkerBusinessLogic: true;
  neverReplaceWorkerMonitoring: true;
  neverReplaceWorkforceOrchestrator: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  respectAuthorityMatrix: true;
  respectWorkerLifecycle: true;
  respectMissionCoordinationEngine: true;
};

export type WorkerRecoveryInput = {
  recoveryId?: string | null;
  workerId?: string | null;
  workerName?: string | null;
  missionId?: string | null;
  failureType?: FailureType | string | null;
  failureCause?: string | null;
  recoveryStrategy?: RecoveryStrategy | string | null;
  lifecycleStatus?: string | null;
  authorityLevel?: string | null;
  available?: boolean | null;
  failureCount?: number | null;
  replacementWorkerId?: string | null;
  reassignToWorkerId?: string | null;
  unsafeAutomaticRecovery?: boolean | null;
  workers?: RecoverableWorker[];
  rules?: string[];
  violatedRules?: string[];
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  executeWorkerBusinessLogic?: boolean;
  replaceWorkerMonitoring?: boolean;
  replaceWorkforceOrchestrator?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
};

export type WorkerRecoveryValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type WorkerRecoveryEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-WRS-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: WorkerRecoveryCapability[];
  totalWorkers: number;
  totalRecords: number;
  totalEscalations: number;
  lastRecoveryDecision: RecoveryDecision | string | null;
  metadataVersion: string;
};

export type WorkerRecoveryRunReport = {
  recoveryRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "register_worker"
    | "detect_failure"
    | "detect_stalled"
    | "detect_hung"
    | "analyse_options"
    | "recover"
    | "restart"
    | "resume"
    | "reassign"
    | "rollback"
    | "preserve_state"
    | "escalate"
    | "produce"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: WorkerRecoveryEngineRecord;
  catalog: WorkerRecoveryCatalog | null;
  workers: RecoverableWorker[];
  records: RecoveryRecord[];
  latestRecord: RecoveryRecord | null;
  options: RecoveryOption[];
  recoveryDecision: RecoveryDecision | string | null;
  rulesFailed: string[];
  validation: WorkerRecoveryValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type WorkerRecoverySystemState = {
  engineVersion: "PILLOW-WRS-001";
  missionId: "Q1-12";
  status: EngineStatus;
  initializedAt: string;
  configuration: WorkerRecoverySystemConfiguration;
  latestReport: WorkerRecoveryRunReport | null;
  engineRecord: WorkerRecoveryEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalWorkers: number;
    totalRecords: number;
    totalEscalations: number;
    lastRecoveryDecision: RecoveryDecision | string | null;
    notes: string[];
  };
};

export type WorkerRecoveryCockpitSnapshot = {
  missionId: "Q1-12";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalWorkers: number;
  totalRecords: number;
  totalEscalations: number;
  latestRecoveryId: string | null;
  neverExecuteWorkerBusinessLogic: true;
  neverReplaceWorkerMonitoring: true;
  neverReplaceWorkforceOrchestrator: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
