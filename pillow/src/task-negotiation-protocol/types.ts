import type { TaskNegotiationProtocolConfiguration } from "./configuration.js";
import type {
  ENGINE_STATUSES,
  ESCALATION_STATUSES,
  HEALTH_STATUSES,
  NEGOTIATION_OUTCOMES,
  OPERATIONAL_STATES,
  TNP_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type NegotiationOutcome = (typeof NEGOTIATION_OUTCOMES)[number];
export type EscalationStatus = (typeof ESCALATION_STATUSES)[number];
export type TaskNegotiationProtocolCapability = (typeof TNP_CAPABILITIES)[number];

export type WorkerCapabilityDeclaration = {
  workerId: string;
  capabilityScore: number;
  available: boolean;
  declaredCapabilities: string[];
  declineReason?: string | null;
};

export type DependencyEdge = {
  fromTaskId: string;
  toTaskId: string;
  dependencyType: "blocks" | "requires" | "handoff";
};

export type TaskHandoff = {
  fromWorkerId: string;
  toWorkerId: string;
  taskId: string;
  reason: string;
};

export type OwnershipDecision = {
  primaryWorkerId: string | null;
  ownershipMode: "sole" | "shared" | "delegated" | "unresolved";
  rationale: string;
};

/** Machine-readable Negotiation Record (Q0-20). */
export type NegotiationRecord = {
  negotiationId: string;
  timestamp: string;
  missionId: string;
  taskId: string;
  candidateWorkers: string[];
  capabilityAssessment: WorkerCapabilityDeclaration[];
  ownershipDecision: OwnershipDecision;
  supportingWorkers: string[];
  dependencyGraph: DependencyEdge[];
  negotiationResult: NegotiationOutcome;
  escalationStatus: EscalationStatus;
  metadataVersion: string;
  negotiationTraceId: string;
  validationStatus: ValidationStatus;
  requiredCapabilities: string[];
  handoffs: TaskHandoff[];
  conflicts: string[];
  /** Explicit Q0-20 boundaries. */
  neverExecuteWorkerTasks: true;
  neverReplaceWorkforceOrchestrator: true;
  neverReplacePillow: true;
  neverOverrideGrandKing: true;
  neverPerformStrategicPlanning: true;
  workerTasksExecuted: false;
  workforceOrchestratorReplaced: false;
  pillowReplaced: false;
  grandKingOverridden: false;
  strategicPlanningPerformed: false;
  preserveNegotiationTraceability: true;
  preserveAuditability: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

/** Input for Q0-20 — negotiate/coordinate only. */
export type TaskNegotiationProtocolInput = {
  negotiationId?: string | null;
  missionId?: string | null;
  taskId?: string | null;
  requiredCapabilities?: string[];
  candidateWorkers?: WorkerCapabilityDeclaration[];
  dependencyEdges?: DependencyEdge[];
  forceEscalate?: boolean;
  cancel?: boolean;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  executeWorkerTasks?: boolean;
  replaceWorkforceOrchestrator?: boolean;
  replacePillow?: boolean;
  overrideGrandKing?: boolean;
  performStrategicPlanning?: boolean;
};

export type TaskNegotiationProtocolValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type TaskNegotiationProtocolEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-TNP-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: TaskNegotiationProtocolCapability[];
  totalNegotiationRecords: number;
  lastOutcome: NegotiationOutcome | null;
  metadataVersion: string;
};

export type TaskNegotiationProtocolRunReport = {
  negotiationRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_task"
    | "identify_candidates"
    | "declare_capability"
    | "decline_work"
    | "resolve_ownership"
    | "negotiate"
    | "detect_conflicts"
    | "escalate"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: TaskNegotiationProtocolEngineRecord;
  records: NegotiationRecord[];
  candidateWorkers: string[];
  primaryWorkerId: string | null;
  supportingWorkers: string[];
  conflicts: string[];
  escalationStatus: EscalationStatus | null;
  validation: TaskNegotiationProtocolValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type TaskNegotiationProtocolState = {
  engineVersion: "PILLOW-TNP-001";
  missionId: "Q0-20";
  status: EngineStatus;
  initializedAt: string;
  configuration: TaskNegotiationProtocolConfiguration;
  latestReport: TaskNegotiationProtocolRunReport | null;
  engineRecord: TaskNegotiationProtocolEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalNegotiationRecords: number;
    lastOutcome: NegotiationOutcome | null;
    notes: string[];
  };
};

export type TaskNegotiationProtocolCockpitSnapshot = {
  missionId: "Q0-20";
  status: EngineStatus;
  healthStatus: HealthStatus;
  totalNegotiationRecords: number;
  latestNegotiationId: string | null;
  lastOutcome: NegotiationOutcome | null;
  neverExecuteWorkerTasks: true;
  neverReplaceWorkforceOrchestrator: true;
  neverReplacePillow: true;
  neverOverrideGrandKing: true;
  neverPerformStrategicPlanning: true;
};
