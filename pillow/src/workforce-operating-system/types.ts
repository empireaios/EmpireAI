import type { WorkforceOperatingSystemConfiguration } from "./configuration.js";
import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  ORGANIZATION_STATES,
  SESSION_STATES,
  VALIDATION_STATUSES,
  WFOS_CAPABILITIES,
  WORKER_LIFECYCLE_STATES,
  WORKFORCE_OS_SERVICES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type OrganizationState = (typeof ORGANIZATION_STATES)[number];
export type WorkerLifecycleState = (typeof WORKER_LIFECYCLE_STATES)[number];
export type SessionState = (typeof SESSION_STATES)[number];
export type WorkforceOsService = (typeof WORKFORCE_OS_SERVICES)[number];
export type WorkforceOperatingSystemCapability = (typeof WFOS_CAPABILITIES)[number];

export type RegisteredDepartment = {
  departmentId: string;
  name: string;
  status: "active" | "paused" | "retired";
};

export type RegisteredFactory = {
  factoryId: string;
  name: string;
  departmentId: string;
  status: "active" | "paused" | "retired";
};

export type RegisteredWorker = {
  workerId: string;
  departmentId: string;
  factoryId: string;
  lifecycle: WorkerLifecycleState;
};

export type RegisteredMission = {
  missionId: string;
  title: string;
  status: "active" | "paused" | "completed";
};

export type WorkforceSession = {
  sessionId: string;
  workerId: string;
  state: SessionState;
  openedAt: string;
  closedAt: string | null;
};

export type RuntimeEvent = {
  eventId: string;
  timestamp: string;
  kind: string;
  summary: string;
};

export type CommunicationMessage = {
  messageId: string;
  fromDepartmentId: string;
  toDepartmentId: string;
  subject: string;
  timestamp: string;
};

/** Machine-readable Workforce OS Record (Q0-19). */
export type WorkforceOsRecord = {
  runtimeId: string;
  timestamp: string;
  organizationState: OrganizationState;
  activeDepartments: string[];
  activeFactories: string[];
  activeWorkers: string[];
  activeMissions: string[];
  runtimeHealth: HealthStatus;
  runtimeEvents: RuntimeEvent[];
  metadataVersion: string;
  runtimeTraceId: string;
  validationStatus: ValidationStatus;
  openSessions: string[];
  servicesInvoked: Array<WorkforceOsService | string>;
  /** Explicit Q0-19 boundaries. */
  neverReplacePillow: true;
  neverReplaceWorkforceOrchestrator: true;
  neverExecuteWorkerTasks: true;
  neverMakeStrategicDecisions: true;
  neverOverrideGrandKing: true;
  pillowReplaced: false;
  workforceOrchestratorReplaced: false;
  workerTasksExecuted: false;
  strategicDecisionsMade: false;
  grandKingOverridden: false;
  preserveRuntimeTraceability: true;
  preserveAuditability: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

/** Input for Q0-19 — runtime coordinate/register/sync only. */
export type WorkforceOperatingSystemInput = {
  runtimeId?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  factoryId?: string | null;
  factoryName?: string | null;
  workerId?: string | null;
  missionId?: string | null;
  missionTitle?: string | null;
  sessionId?: string | null;
  lifecycle?: WorkerLifecycleState | string | null;
  fromDepartmentId?: string | null;
  toDepartmentId?: string | null;
  communicationSubject?: string | null;
  service?: WorkforceOsService | string | null;
  query?: string | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  replacePillow?: boolean;
  replaceWorkforceOrchestrator?: boolean;
  executeWorkerTasks?: boolean;
  makeStrategicDecisions?: boolean;
  overrideGrandKing?: boolean;
};

export type WorkforceOperatingSystemValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type WorkforceOperatingSystemEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-WFOS-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: WorkforceOperatingSystemCapability[];
  totalRuntimeRecords: number;
  organizationState: OrganizationState;
  activeWorkerCount: number;
  metadataVersion: string;
};

export type WorkforceOperatingSystemRunReport = {
  runtimeRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "start_runtime"
    | "register_department"
    | "register_factory"
    | "register_worker"
    | "manage_session"
    | "coordinate_communication"
    | "discover_workers"
    | "synchronize_state"
    | "monitor_health"
    | "recover_runtime"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: WorkforceOperatingSystemEngineRecord;
  records: WorkforceOsRecord[];
  departments: RegisteredDepartment[];
  factories: RegisteredFactory[];
  workers: RegisteredWorker[];
  missions: RegisteredMission[];
  sessions: WorkforceSession[];
  communications: CommunicationMessage[];
  organizationState: OrganizationState;
  runtimeHealth: HealthStatus;
  validation: WorkforceOperatingSystemValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type WorkforceOperatingSystemState = {
  engineVersion: "PILLOW-WFOS-001";
  missionId: "Q0-19";
  status: EngineStatus;
  initializedAt: string;
  configuration: WorkforceOperatingSystemConfiguration;
  latestReport: WorkforceOperatingSystemRunReport | null;
  engineRecord: WorkforceOperatingSystemEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalRuntimeRecords: number;
    organizationState: OrganizationState;
    activeWorkerCount: number;
    notes: string[];
  };
};

export type WorkforceOperatingSystemCockpitSnapshot = {
  missionId: "Q0-19";
  status: EngineStatus;
  healthStatus: HealthStatus;
  totalRuntimeRecords: number;
  latestRuntimeId: string | null;
  organizationState: OrganizationState;
  activeWorkerCount: number;
  neverReplacePillow: true;
  neverReplaceWorkforceOrchestrator: true;
  neverExecuteWorkerTasks: true;
  neverMakeStrategicDecisions: true;
  neverOverrideGrandKing: true;
};
