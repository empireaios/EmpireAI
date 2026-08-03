import type { ExecutiveCommandCenterConfiguration } from "./configuration.js";
import type {
  COMMAND_STATUSES,
  ENGINE_STATUSES,
  EXECUTIVE_COMMAND_TYPES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  PECC_CAPABILITIES,
  ROUTED_SERVICES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type CommandStatus = (typeof COMMAND_STATUSES)[number];
export type ExecutiveCommandType = (typeof EXECUTIVE_COMMAND_TYPES)[number];
export type RoutedService = (typeof ROUTED_SERVICES)[number];
export type ExecutiveCommandCenterCapability = (typeof PECC_CAPABILITIES)[number];

export type RegisteredWorker = {
  workerId: string;
  department: string;
  status: "available" | "busy" | "offline";
};

export type RegisteredTool = {
  toolId: string;
  name: string;
  approved: boolean;
};

export type RegisteredMission = {
  missionId: string;
  title: string;
  status: "active" | "paused" | "completed";
};

export type BusinessStateView = {
  businessId: string;
  state: string;
  health: string;
};

export type ApprovalView = {
  approvalId: string;
  status: string;
  subject: string;
};

export type MemoryView = {
  memoryId: string;
  kind: "execution" | "decision";
  summary: string;
};

export type ExecutiveReportView = {
  reportId: string;
  title: string;
  generatedAt: string;
};

/** Machine-readable Executive Command Record (Q0-18). */
export type ExecutiveCommandRecord = {
  commandId: string;
  timestamp: string;
  executiveRequest: string;
  requestedCapability: ExecutiveCommandType | string;
  routedService: RoutedService | string;
  relatedBusiness: string;
  relatedMission: string;
  currentStatus: CommandStatus;
  result: string;
  executionReference: string;
  metadataVersion: string;
  commandTraceId: string;
  validationStatus: ValidationStatus;
  relatedWorkers: string[];
  relatedTools: string[];
  payloadSummary: string;
  /** Explicit Q0-18 boundaries. */
  neverExecuteWorkerLogic: true;
  neverReplaceWorkforceOrchestrator: true;
  neverReplaceWorkers: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  workerLogicExecuted: false;
  workforceOrchestratorReplaced: false;
  workersReplaced: false;
  pillowOverridden: false;
  grandKingOverridden: false;
  preserveCommandTraceability: true;
  preserveAuditability: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

/** Input for Q0-18 — coordinate/route/aggregate only. */
export type ExecutiveCommandCenterInput = {
  commandId?: string | null;
  executiveRequest?: string | null;
  requestedCapability?: ExecutiveCommandType | string | null;
  routedService?: RoutedService | string | null;
  relatedBusiness?: string | null;
  relatedMission?: string | null;
  workerId?: string | null;
  toolId?: string | null;
  reportId?: string | null;
  query?: string | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  executeWorkerLogic?: boolean;
  replaceWorkforceOrchestrator?: boolean;
  replaceWorkers?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
};

export type ExecutiveCommandCenterValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ExecutiveCommandCenterEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-PECC-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: ExecutiveCommandCenterCapability[];
  totalCommandRecords: number;
  registeredWorkerCount: number;
  registeredToolCount: number;
  metadataVersion: string;
};

export type ExecutiveCommandCenterRunReport = {
  commandRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "submit_command"
    | "query_business_state"
    | "access_workers"
    | "access_tools"
    | "access_missions"
    | "access_approvals"
    | "access_execution_memory"
    | "access_decision_memory"
    | "access_executive_reports"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: ExecutiveCommandCenterEngineRecord;
  records: ExecutiveCommandRecord[];
  routedService: RoutedService | string | null;
  workers: RegisteredWorker[];
  tools: RegisteredTool[];
  missions: RegisteredMission[];
  businessStates: BusinessStateView[];
  approvals: ApprovalView[];
  executionMemory: MemoryView[];
  decisionMemory: MemoryView[];
  executiveReports: ExecutiveReportView[];
  validation: ExecutiveCommandCenterValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ExecutiveCommandCenterState = {
  engineVersion: "PILLOW-PECC-001";
  missionId: "Q0-18";
  status: EngineStatus;
  initializedAt: string;
  configuration: ExecutiveCommandCenterConfiguration;
  latestReport: ExecutiveCommandCenterRunReport | null;
  engineRecord: ExecutiveCommandCenterEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalCommandRecords: number;
    registeredWorkerCount: number;
    notes: string[];
  };
};

export type ExecutiveCommandCenterCockpitSnapshot = {
  missionId: "Q0-18";
  status: EngineStatus;
  healthStatus: HealthStatus;
  totalCommandRecords: number;
  latestCommandId: string | null;
  registeredWorkerCount: number;
  neverExecuteWorkerLogic: true;
  neverReplaceWorkforceOrchestrator: true;
  neverReplaceWorkers: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
