import type { WorkforceOrchestratorConfiguration } from "./configuration.js";
import type {
  COMPLETION_STATUSES,
  COORDINATION_MODES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  PWO_CAPABILITIES,
  VALIDATION_STATUSES,
  WORKER_STATES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type WorkerState = (typeof WORKER_STATES)[number];
export type CompletionStatus = (typeof COMPLETION_STATUSES)[number];
export type CoordinationMode = (typeof COORDINATION_MODES)[number];
export type WorkforceOrchestratorCapability = (typeof PWO_CAPABILITIES)[number];

/** Input for Q0-09 — executive intent for orchestration only. */
export type WorkforceOrchestratorInput = {
  executiveRequest: string;
  missionId?: string | null;
  categoryHints?: string[];
  capabilityHints?: string[];
  coordinationMode?: CoordinationMode;
  maxWorkers?: number;
  timeoutMsHint?: number;
  failureHints?: string[];
  escalationHints?: string[];
  dependencyHints?: string[];
  handoffHints?: string[];
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  performWorkerTasks?: boolean;
  replaceWorkerLogic?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  performStrategicPlanning?: boolean;
};

/** Abstract worker descriptor — no location or implementation details. */
export type WorkerDescriptor = {
  workerId: string;
  category: string;
  capabilities: string[];
  state: WorkerState;
  suitabilityScore: number;
};

export type WorkerStatusEntry = {
  workerId: string;
  category: string;
  state: WorkerState;
  progressPercent: number;
  note: string;
};

export type ExecutionStep = {
  stepId: string;
  order: number;
  mode: "sequential" | "parallel" | "handoff";
  workerIds: string[];
  dependsOn: string[];
  status: WorkerState;
};

export type EscalationRecord = {
  escalationId: string;
  workerId: string;
  reason: string;
  timestamp: string;
  status: "open" | "acknowledged";
};

/** Machine-readable Orchestration Record (Q0-09). */
export type OrchestrationRecord = {
  orchestrationId: string;
  timestamp: string;
  executiveRequest: string;
  missionId: string | null;
  workersSelected: WorkerDescriptor[];
  executionSequence: ExecutionStep[];
  workerStatus: WorkerStatusEntry[];
  currentProgress: number;
  escalations: EscalationRecord[];
  completionStatus: CompletionStatus;
  metadataVersion: string;
  orchestrationTraceId: string;
  coordinationMode: CoordinationMode;
  discoveredWorkerCount: number;
  validationStatus: ValidationStatus;
  /** Explicit Q0-09 boundaries. */
  neverPerformWorkerTasks: true;
  neverReplaceWorkerLogic: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverPerformStrategicPlanning: true;
  workerTasksPerformed: false;
  workerLogicReplaced: false;
  pillowOverridden: false;
  grandKingOverridden: false;
  strategicPlanningPerformed: false;
  preserveOrchestrationTraceability: true;
  preserveAuditability: true;
  preserveOrchestrationIntegrity: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type OrchestrationValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type WorkforceOrchestratorEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-PWO-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: WorkforceOrchestratorCapability[];
  totalOrchestrations: number;
  activeWorkers: number;
  metadataVersion: string;
};

export type WorkforceOrchestratorRunReport = {
  orchestrationRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_intent"
    | "discover_workers"
    | "select_workers"
    | "build_groups"
    | "coordinate"
    | "monitor"
    | "handle_failure"
    | "handle_timeout"
    | "handle_escalation"
    | "produce_record"
    | "validate_orchestrations"
    | "diagnostics";
  engineRecord: WorkforceOrchestratorEngineRecord;
  records: OrchestrationRecord[];
  discoveredWorkers: WorkerDescriptor[];
  validation: OrchestrationValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type WorkforceOrchestratorState = {
  engineVersion: "PILLOW-PWO-001";
  missionId: "Q0-09";
  status: EngineStatus;
  initializedAt: string;
  configuration: WorkforceOrchestratorConfiguration;
  latestReport: WorkforceOrchestratorRunReport | null;
  engineRecord: WorkforceOrchestratorEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalOrchestrations: number;
    activeWorkers: number;
    notes: string[];
  };
};

export type WorkforceOrchestratorCockpitSnapshot = {
  missionId: "Q0-09";
  status: EngineStatus;
  healthStatus: HealthStatus;
  totalOrchestrations: number;
  activeWorkers: number;
  latestOrchestrationId: string | null;
  neverPerformWorkerTasks: true;
  neverReplaceWorkerLogic: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverPerformStrategicPlanning: true;
};
