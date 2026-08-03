import type { WorkforceAccessManagerConfiguration } from "./configuration.js";
import type {
  ACCESS_STATUSES,
  ENGINE_STATUSES,
  EXECUTIVE_ACTIONS,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
  WAM_CAPABILITIES,
  WORKER_RUNTIME_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type ExecutiveAction = (typeof EXECUTIVE_ACTIONS)[number];
export type AccessStatus = (typeof ACCESS_STATUSES)[number];
export type WorkerRuntimeStatus = (typeof WORKER_RUNTIME_STATUSES)[number];
export type WorkforceAccessManagerCapability = (typeof WAM_CAPABILITIES)[number];

/** Input for Q0-11 — executive access control only. */
export type WorkforceAccessManagerInput = {
  executiveRequest: string;
  workerId?: string | null;
  workerNameHint?: string | null;
  requestedAction?: ExecutiveAction | string;
  reassignToWorkerId?: string | null;
  reason?: string | null;
  capabilityHints?: string[];
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  executeWorkerLogic?: boolean;
  replaceWorkerImplementations?: boolean;
  performOrchestration?: boolean;
  makeStrategicDecisions?: boolean;
  overrideGrandKing?: boolean;
};

/** Accessible worker directory entry — no task execution. */
export type AccessibleWorker = {
  workerId: string;
  workerName: string;
  department: string;
  capabilities: string[];
  runtimeStatus: WorkerRuntimeStatus;
  connectedToPillow: boolean;
};

/** Machine-readable Access Record (Q0-11). */
export type AccessRecord = {
  accessId: string;
  timestamp: string;
  executiveRequest: string;
  workerId: string;
  workerName: string;
  requestedAction: string;
  accessStatus: AccessStatus;
  workerStatus: WorkerRuntimeStatus;
  reason: string;
  metadataVersion: string;
  accessTraceId: string;
  capabilitiesInspected: string[];
  connectedToPillow: boolean;
  validationStatus: ValidationStatus;
  /** Explicit Q0-11 boundaries. */
  neverExecuteWorkerLogic: true;
  neverReplaceWorkerImplementations: true;
  neverPerformOrchestration: true;
  neverMakeStrategicDecisions: true;
  neverOverrideGrandKing: true;
  workerLogicExecuted: false;
  workerImplementationsReplaced: false;
  orchestrationPerformed: false;
  strategicDecisionsMade: false;
  grandKingOverridden: false;
  preserveAccessTraceability: true;
  preserveAuditability: true;
  preserveAccessIntegrity: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type AccessValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type WorkforceAccessManagerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-WAM-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: WorkforceAccessManagerCapability[];
  totalAccessRecords: number;
  connectedWorkers: number;
  metadataVersion: string;
};

export type WorkforceAccessManagerRunReport = {
  accessRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "locate"
    | "invoke"
    | "suspend"
    | "resume"
    | "pause"
    | "continue"
    | "reassign"
    | "inspect"
    | "restart"
    | "stop"
    | "list_access"
    | "validate_access"
    | "diagnostics";
  engineRecord: WorkforceAccessManagerEngineRecord;
  records: AccessRecord[];
  workers: AccessibleWorker[];
  validation: AccessValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type WorkforceAccessManagerState = {
  engineVersion: "PILLOW-WAM-001";
  missionId: "Q0-11";
  status: EngineStatus;
  initializedAt: string;
  configuration: WorkforceAccessManagerConfiguration;
  latestReport: WorkforceAccessManagerRunReport | null;
  engineRecord: WorkforceAccessManagerEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalAccessRecords: number;
    connectedWorkers: number;
    notes: string[];
  };
};

export type WorkforceAccessManagerCockpitSnapshot = {
  missionId: "Q0-11";
  status: EngineStatus;
  healthStatus: HealthStatus;
  totalAccessRecords: number;
  connectedWorkers: number;
  latestAccessId: string | null;
  neverExecuteWorkerLogic: true;
  neverReplaceWorkerImplementations: true;
  neverPerformOrchestration: true;
  neverMakeStrategicDecisions: true;
  neverOverrideGrandKing: true;
};
