import type { OperationalPlaybookEngineConfiguration } from "./configuration.js";
import type {
  ENGINE_STATUSES,
  EXECUTION_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  OPBK_CAPABILITIES,
  PLAYBOOK_CATEGORIES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type PlaybookCategory = (typeof PLAYBOOK_CATEGORIES)[number];
export type ExecutionStatus = (typeof EXECUTION_STATUSES)[number];
export type OperationalPlaybookCapability = (typeof OPBK_CAPABILITIES)[number];

export type PlaybookStep = {
  stepId: string;
  order: number;
  action: string;
  requiredCapability?: string | null;
  requiredTool?: string | null;
  notes?: string | null;
};

/** Canonical Playbook Record (Q0-15 definition). */
export type PlaybookRecord = {
  playbookId: string;
  version: string;
  category: PlaybookCategory | string;
  name: string;
  purpose: string;
  preconditions: string[];
  executionSteps: PlaybookStep[];
  requiredCapabilities: string[];
  requiredTools: string[];
  approvalRequirements: string[];
  successCriteria: string[];
  failureCriteria: string[];
  metadataVersion: string;
  approved: boolean;
  active: boolean;
};

/** Input for Q0-15 — playbook interpretation/coordination only. */
export type OperationalPlaybookEngineInput = {
  playbookId?: string | null;
  category?: PlaybookCategory | string | null;
  intent?: string | null;
  nameHint?: string | null;
  availableCapabilities?: string[];
  availableTools?: string[];
  approvalsPresent?: string[];
  playbook?: Partial<PlaybookRecord> | null;
  executionId?: string | null;
  progressStepId?: string | null;
  progressStatus?: ExecutionStatus | string | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  executeWorkerTasks?: boolean;
  replaceWorkers?: boolean;
  replaceWorkforceOrchestrator?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
};

export type ExecutableWorkflowStep = {
  stepId: string;
  order: number;
  action: string;
  requiredCapability: string | null;
  requiredTool: string | null;
  status: ExecutionStatus;
  notes: string;
};

export type ExecutableWorkflow = {
  workflowId: string;
  playbookId: string;
  playbookVersion: string;
  category: string;
  steps: ExecutableWorkflowStep[];
  prerequisitesSatisfied: boolean;
  blockedReasons: string[];
};

/** Machine-readable Playbook Execution Record (Q0-15). */
export type PlaybookExecutionRecord = {
  executionId: string;
  timestamp: string;
  playbookId: string;
  playbookVersion: string;
  category: string;
  name: string;
  intent: string;
  status: ExecutionStatus;
  currentStepId: string | null;
  completedStepIds: string[];
  workflow: ExecutableWorkflow;
  selectionReason: string;
  integrityValid: boolean;
  prerequisitesValid: boolean;
  confidenceScore: number;
  metadataVersion: string;
  executionTraceId: string;
  validationStatus: ValidationStatus;
  /** Explicit Q0-15 boundaries. */
  neverExecuteWorkerTasks: true;
  neverReplaceWorkers: true;
  neverReplaceWorkforceOrchestrator: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  workerTasksExecuted: false;
  workersReplaced: false;
  workforceOrchestratorReplaced: false;
  pillowOverridden: false;
  grandKingOverridden: false;
  preservePlaybookTraceability: true;
  preserveAuditability: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type PlaybookValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type OperationalPlaybookEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-OPBK-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: OperationalPlaybookCapability[];
  totalPlaybooks: number;
  totalExecutionRecords: number;
  lastConfidenceScore: number | null;
  metadataVersion: string;
};

export type OperationalPlaybookEngineRunReport = {
  playbookRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "register"
    | "retrieve"
    | "validate_playbook"
    | "select"
    | "interpret"
    | "prepare_workflow"
    | "track_progress"
    | "list_playbooks"
    | "list_executions"
    | "validate_engine"
    | "diagnostics";
  engineRecord: OperationalPlaybookEngineRecord;
  playbooks: PlaybookRecord[];
  executions: PlaybookExecutionRecord[];
  selectedPlaybook: PlaybookRecord | null;
  workflow: ExecutableWorkflow | null;
  validation: PlaybookValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type OperationalPlaybookEngineState = {
  engineVersion: "PILLOW-OPBK-001";
  missionId: "Q0-15";
  status: EngineStatus;
  initializedAt: string;
  configuration: OperationalPlaybookEngineConfiguration;
  latestReport: OperationalPlaybookEngineRunReport | null;
  engineRecord: OperationalPlaybookEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalPlaybooks: number;
    totalExecutionRecords: number;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type OperationalPlaybookEngineCockpitSnapshot = {
  missionId: "Q0-15";
  status: EngineStatus;
  healthStatus: HealthStatus;
  totalPlaybooks: number;
  totalExecutionRecords: number;
  latestExecutionId: string | null;
  lastConfidenceScore: number | null;
  neverExecuteWorkerTasks: true;
  neverReplaceWorkers: true;
  neverReplaceWorkforceOrchestrator: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
