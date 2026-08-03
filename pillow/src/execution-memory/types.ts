import type { ExecutionMemoryConfiguration } from "./configuration.js";
import type {
  APPROVAL_STATUSES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  EXECUTION_EVENT_TYPES,
  EXM_CAPABILITIES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type ExecutionEventType = (typeof EXECUTION_EVENT_TYPES)[number];
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];
export type ExecutionMemoryCapability = (typeof EXM_CAPABILITIES)[number];

/** Machine-readable execution memory record (Q0-04). */
export type ExecutionMemoryRecord = {
  memoryId: string;
  timestamp: string;
  eventType: ExecutionEventType;
  missionId: string | null;
  businessId: string | null;
  relatedWorkers: string[];
  executiveDecision: string | null;
  outcome: string | null;
  lessonLearned: string | null;
  approvalStatus: ApprovalStatus;
  confidence: number;
  evidence: string[];
  metadataVersion: string;
  memoryTraceId: string;
  version: number;
  validationStatus: ValidationStatus;
  /** Explicit Q0-04 boundaries. */
  neverMakeDecisions: true;
  neverPlanMissions: true;
  neverAssignWorkers: true;
  neverExecuteWork: true;
  neverReplaceKnowledgeSystems: true;
  decisionMadeByMemory: false;
  missionPlannedByMemory: false;
  workersAssignedByMemory: false;
  workExecutedByMemory: false;
  preserveMemoryTraceability: true;
  preserveAuditability: true;
  preserveMemoryIntegrity: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type StoreMemoryInput = {
  memoryId?: string;
  eventType: ExecutionEventType;
  missionId?: string | null;
  businessId?: string | null;
  relatedWorkers?: string[];
  executiveDecision?: string | null;
  outcome?: string | null;
  lessonLearned?: string | null;
  approvalStatus?: ApprovalStatus;
  confidence?: number;
  evidence?: string[];
  validated?: boolean;
  makeDecisions?: boolean;
  planMissions?: boolean;
  assignWorkers?: boolean;
  executeWork?: boolean;
  replaceKnowledgeSystems?: boolean;
};

export type UpdateMemoryInput = {
  memoryId: string;
  outcome?: string | null;
  lessonLearned?: string | null;
  approvalStatus?: ApprovalStatus;
  confidence?: number;
  evidence?: string[];
  executiveDecision?: string | null;
  relatedWorkers?: string[];
  validated?: boolean;
  makeDecisions?: boolean;
  planMissions?: boolean;
  assignWorkers?: boolean;
  executeWork?: boolean;
  replaceKnowledgeSystems?: boolean;
};

export type RetrieveMemoryInput = {
  memoryId: string;
  validated?: boolean;
};

export type SearchMemoryInput = {
  missionId?: string;
  businessId?: string;
  eventType?: ExecutionEventType;
  approvalStatus?: ApprovalStatus;
  limit?: number;
  validated?: boolean;
};

export type MemoryValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ExecutionMemoryEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-EXM-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: ExecutionMemoryCapability[];
  totalRecords: number;
  metadataVersion: string;
};

export type ExecutionMemoryRunReport = {
  memoryRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "store_record"
    | "retrieve_record"
    | "search_records"
    | "update_record"
    | "list_records"
    | "validate_records"
    | "diagnostics";
  engineRecord: ExecutionMemoryEngineRecord;
  records: ExecutionMemoryRecord[];
  validation: MemoryValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ExecutionMemoryState = {
  engineVersion: "PILLOW-EXM-001";
  missionId: "Q0-04";
  status: EngineStatus;
  initializedAt: string;
  configuration: ExecutionMemoryConfiguration;
  latestReport: ExecutionMemoryRunReport | null;
  engineRecord: ExecutionMemoryEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalRecords: number;
    notes: string[];
  };
};

export type ExecutionMemoryCockpitSnapshot = {
  missionId: "Q0-04";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalRecords: number;
  neverMakeDecisions: true;
  neverPlanMissions: true;
  neverAssignWorkers: true;
  neverExecuteWork: true;
  neverReplaceKnowledgeSystems: true;
};
