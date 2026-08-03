import type { WorkforceCapabilityRegistryConfiguration } from "./configuration.js";
import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  LOOKUP_DIMENSIONS,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
  WCR_CAPABILITIES,
  WORKER_STATUSES,
  WORKER_TYPES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type WorkerStatus = (typeof WORKER_STATUSES)[number];
export type WorkerType = (typeof WORKER_TYPES)[number];
export type LookupDimension = (typeof LOOKUP_DIMENSIONS)[number];
export type WorkforceCapabilityRegistryCapability = (typeof WCR_CAPABILITIES)[number];

export type OperatingLimits = {
  maxConcurrentMissions: number;
  requiredApprovals: string[];
  allowedTools: string[];
  securityRestrictions: string[];
};

/** Machine-readable Registry Record (Q0-10). */
export type RegistryRecord = {
  registryId: string;
  workerId: string;
  workerName: string;
  department: string;
  workerType: string;
  capabilityList: string[];
  skillList: string[];
  approvedTools: string[];
  dependencies: string[];
  operatingLimits: OperatingLimits;
  currentStatus: WorkerStatus;
  version: string;
  lastUpdated: string;
  metadataVersion: string;
  registryTraceId: string;
  validationStatus: ValidationStatus;
  /** Explicit Q0-10 boundaries. */
  neverExecuteWork: true;
  neverAssignWorkers: true;
  neverOrchestrateWorkers: true;
  neverApproveActions: true;
  neverReplacePillow: true;
  workExecuted: false;
  workersAssigned: false;
  workersOrchestrated: false;
  actionsApproved: false;
  pillowReplaced: false;
  preserveRegistryTraceability: true;
  preserveAuditability: true;
  preserveRegistryIntegrity: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type DepartmentRecord = {
  departmentId: string;
  name: string;
  description: string;
};

export type CapabilityCatalogEntry = {
  capabilityId: string;
  name: string;
  description: string;
};

export type ToolCatalogEntry = {
  toolId: string;
  name: string;
  description: string;
};

export type SkillCatalogEntry = {
  skillId: string;
  name: string;
  description: string;
};

export type RegisterWorkerInput = {
  workerId: string;
  workerName: string;
  department: string;
  workerType?: string;
  capabilityList?: string[];
  skillList?: string[];
  approvedTools?: string[];
  dependencies?: string[];
  operatingLimits?: Partial<OperatingLimits>;
  currentStatus?: WorkerStatus;
  version?: string;
  validated?: boolean;
  executeWork?: boolean;
  assignWorkers?: boolean;
  orchestrateWorkers?: boolean;
  approveActions?: boolean;
  replacePillow?: boolean;
};

export type RegisterCatalogInput = {
  id: string;
  name: string;
  description?: string;
  validated?: boolean;
  executeWork?: boolean;
  assignWorkers?: boolean;
  orchestrateWorkers?: boolean;
  approveActions?: boolean;
  replacePillow?: boolean;
};

export type UpdateWorkerStatusInput = {
  workerId: string;
  currentStatus: WorkerStatus;
  validated?: boolean;
  executeWork?: boolean;
  assignWorkers?: boolean;
  orchestrateWorkers?: boolean;
  approveActions?: boolean;
  replacePillow?: boolean;
};

export type LookupInput = {
  dimension: LookupDimension;
  query: string;
  validated?: boolean;
  executeWork?: boolean;
  assignWorkers?: boolean;
  orchestrateWorkers?: boolean;
  approveActions?: boolean;
  replacePillow?: boolean;
};

export type WorkforceCapabilityRegistryInput = {
  validated?: boolean;
  executeWork?: boolean;
  assignWorkers?: boolean;
  orchestrateWorkers?: boolean;
  approveActions?: boolean;
  replacePillow?: boolean;
};

export type RegistryValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type WorkforceCapabilityRegistryEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-WCR-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: WorkforceCapabilityRegistryCapability[];
  totalWorkers: number;
  totalDepartments: number;
  totalCapabilities: number;
  totalTools: number;
  totalSkills: number;
  metadataVersion: string;
};

export type WorkforceCapabilityRegistryRunReport = {
  registryRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "register_worker"
    | "register_department"
    | "register_capability"
    | "register_tool"
    | "register_skill"
    | "update_status"
    | "lookup"
    | "list_records"
    | "validate_registry"
    | "diagnostics";
  engineRecord: WorkforceCapabilityRegistryEngineRecord;
  records: RegistryRecord[];
  departments: DepartmentRecord[];
  capabilities: CapabilityCatalogEntry[];
  tools: ToolCatalogEntry[];
  skills: SkillCatalogEntry[];
  validation: RegistryValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type WorkforceCapabilityRegistryState = {
  engineVersion: "PILLOW-WCR-001";
  missionId: "Q0-10";
  status: EngineStatus;
  initializedAt: string;
  configuration: WorkforceCapabilityRegistryConfiguration;
  latestReport: WorkforceCapabilityRegistryRunReport | null;
  engineRecord: WorkforceCapabilityRegistryEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalWorkers: number;
    totalDepartments: number;
    notes: string[];
  };
};

export type WorkforceCapabilityRegistryCockpitSnapshot = {
  missionId: "Q0-10";
  status: EngineStatus;
  healthStatus: HealthStatus;
  totalWorkers: number;
  totalDepartments: number;
  totalCapabilities: number;
  totalTools: number;
  totalSkills: number;
  latestRegistryId: string | null;
  neverExecuteWork: true;
  neverAssignWorkers: true;
  neverOrchestrateWorkers: true;
  neverApproveActions: true;
  neverReplacePillow: true;
};
