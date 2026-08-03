import type { WorkerLifecycleConfiguration } from "./configuration.js";
import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  LIFECYCLE_DECISIONS,
  LIFECYCLE_EVENTS,
  LIFECYCLE_RULES,
  LIFECYCLE_STATES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
  WLC_CAPABILITIES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type LifecycleState = (typeof LIFECYCLE_STATES)[number];
export type LifecycleEvent = (typeof LIFECYCLE_EVENTS)[number];
export type LifecycleDecision = (typeof LIFECYCLE_DECISIONS)[number];
export type LifecycleRule = (typeof LIFECYCLE_RULES)[number];
export type WorkerLifecycleCapability = (typeof WLC_CAPABILITIES)[number];

/** Machine-readable Worker Lifecycle Record (Q1-08). */
export type LifecycleRecord = {
  lifecycleId: string;
  timestamp: string;
  workerId: string;
  workerName: string;
  lifecycleEvent: LifecycleEvent | string;
  previousState: LifecycleState | string | null;
  newState: LifecycleState | string;
  triggerReason: string;
  requestedBy: string;
  approvedBy: string | null;
  supportingEvidence: string[];
  metadataVersion: string;
  /** Explicit Q1-08 boundaries. */
  neverExecuteWorkerTasks: true;
  neverReplaceWorkerRegistry: true;
  neverReplaceWorkforceCertificationMonitor: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  permanentlyDeleted: false;
  preserveAuditability: true;
  preserveTraceability: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type WorkerLifecycleProfile = {
  workerId: string;
  workerName: string;
  currentState: LifecycleState | string;
  history: LifecycleRecord[];
  createdAt: string;
  lastUpdated: string;
  certified: boolean;
  neverPermanentlyDeleted: true;
};

export type WorkerLifecycleCatalog = {
  lifecycleVersion: string;
  states: string[];
  profiles: WorkerLifecycleProfile[];
  records: LifecycleRecord[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverExecuteWorkerTasks: true;
  neverReplaceWorkerRegistry: true;
  neverReplaceWorkforceCertificationMonitor: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverPermanentlyDeleted: true;
};

export type WorkerLifecycleInput = {
  lifecycleId?: string | null;
  workerId?: string | null;
  workerName?: string | null;
  lifecycleEvent?: LifecycleEvent | string | null;
  previousState?: LifecycleState | string | null;
  newState?: LifecycleState | string | null;
  triggerReason?: string | null;
  requestedBy?: string | null;
  approvedBy?: string | null;
  supportingEvidence?: string[];
  replacementWorkerId?: string | null;
  rules?: string[];
  violatedRules?: string[];
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  executeWorkerTasks?: boolean;
  replaceWorkerRegistry?: boolean;
  replaceWorkforceCertificationMonitor?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  permanentlyDelete?: boolean;
};

export type WorkerLifecycleValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type WorkerLifecycleEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-WLC-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: WorkerLifecycleCapability[];
  totalWorkers: number;
  totalRecords: number;
  lastLifecycleDecision: LifecycleDecision | string | null;
  metadataVersion: string;
};

export type WorkerLifecycleRunReport = {
  lifecycleRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "create"
    | "onboard"
    | "configure"
    | "activate"
    | "suspend"
    | "resume"
    | "replace"
    | "retire"
    | "archive"
    | "audit"
    | "restore"
    | "produce"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: WorkerLifecycleEngineRecord;
  catalog: WorkerLifecycleCatalog | null;
  profiles: WorkerLifecycleProfile[];
  records: LifecycleRecord[];
  lifecycleDecision: LifecycleDecision | string | null;
  rulesFailed: string[];
  validation: WorkerLifecycleValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type WorkerLifecycleState = {
  engineVersion: "PILLOW-WLC-001";
  missionId: "Q1-08";
  status: EngineStatus;
  initializedAt: string;
  configuration: WorkerLifecycleConfiguration;
  latestReport: WorkerLifecycleRunReport | null;
  engineRecord: WorkerLifecycleEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalWorkers: number;
    totalRecords: number;
    lastLifecycleDecision: LifecycleDecision | string | null;
    notes: string[];
  };
};

export type WorkerLifecycleCockpitSnapshot = {
  missionId: "Q1-08";
  status: EngineStatus;
  healthStatus: HealthStatus;
  totalWorkers: number;
  totalRecords: number;
  latestLifecycleId: string | null;
  neverExecuteWorkerTasks: true;
  neverReplaceWorkerRegistry: true;
  neverReplaceWorkforceCertificationMonitor: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverPermanentlyDeleted: true;
};
