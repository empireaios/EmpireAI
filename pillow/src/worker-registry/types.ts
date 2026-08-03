import type { WorkerRegistryConfiguration } from "./configuration.js";
import type {
  CERTIFICATION_STATUSES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  REGISTRY_DECISIONS,
  REGISTRY_RULES,
  VALIDATION_STATUSES,
  WORKER_STATES,
  WRG_CAPABILITIES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type WorkerState = (typeof WORKER_STATES)[number];
export type CertificationStatus = (typeof CERTIFICATION_STATUSES)[number];
export type RegistryDecision = (typeof REGISTRY_DECISIONS)[number];
export type RegistryRule = (typeof REGISTRY_RULES)[number];
export type WorkerRegistryCapability = (typeof WRG_CAPABILITIES)[number];

export type WorkerVersionEntry = {
  version: number;
  updatedAt: string;
  changeSummary: string;
};

/** Machine-readable Worker Record (Q1-07). */
export type WorkerRecord = {
  registryVersion: string;
  workerId: string;
  workerName: string;
  workerType: string;
  department: string;
  factory: string;
  role: string;
  reportingLine: string[];
  governingAuthority: "pillow";
  skillProfile: string[];
  approvedTools: string[];
  authorityLevel: string;
  certificationStatus: CertificationStatus | string;
  operationalStatus: WorkerState | string;
  createdDate: string;
  lastUpdated: string;
  metadataVersion: string;
  versionHistory: WorkerVersionEntry[];
  /** Explicit Q1-07 boundaries. */
  neverExecuteWorkerTasks: true;
  neverReplaceWorkforceCapabilityRegistry: true;
  neverReplaceOrganizationCharter: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  preserveAuditability: true;
  preserveTraceability: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type WorkerRegistryCatalog = {
  registryVersion: string;
  workers: WorkerRecord[];
  metadataVersion: string;
  governingAuthority: "pillow";
  neverExecuteWorkerTasks: true;
  neverReplaceWorkforceCapabilityRegistry: true;
  neverReplaceOrganizationCharter: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type WorkerRegistryInput = {
  workerId?: string | null;
  workerName?: string | null;
  workerType?: string | null;
  department?: string | null;
  factory?: string | null;
  role?: string | null;
  reportingLine?: string[];
  skillProfile?: string[];
  approvedTools?: string[];
  authorityLevel?: string | null;
  certificationStatus?: CertificationStatus | string | null;
  operationalStatus?: WorkerState | string | null;
  changeSummary?: string | null;
  workers?: WorkerRecord[];
  registryRules?: string[];
  violatedRules?: string[];
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  executeWorkerTasks?: boolean;
  replaceWorkforceCapabilityRegistry?: boolean;
  replaceOrganizationCharter?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
};

export type WorkerRegistryValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type WorkerRegistryEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-WRG-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: WorkerRegistryCapability[];
  registryVersion: string;
  totalWorkers: number;
  departmentCount: number;
  factoryCount: number;
  lastRegistryDecision: RegistryDecision | string | null;
  metadataVersion: string;
};

export type WorkerRegistryRunReport = {
  registryRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "register_worker"
    | "get_worker"
    | "query_by_department"
    | "query_by_role"
    | "query_by_factory"
    | "validate_reporting_line"
    | "update_status"
    | "produce_registry"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: WorkerRegistryEngineRecord;
  catalog: WorkerRegistryCatalog | null;
  workers: WorkerRecord[];
  matchedWorkers: WorkerRecord[];
  registryDecision: RegistryDecision | string | null;
  rulesFailed: string[];
  validation: WorkerRegistryValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type WorkerRegistryState = {
  engineVersion: "PILLOW-WRG-001";
  missionId: "Q1-07";
  status: EngineStatus;
  initializedAt: string;
  configuration: WorkerRegistryConfiguration;
  latestReport: WorkerRegistryRunReport | null;
  engineRecord: WorkerRegistryEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    registryVersion: string;
    totalWorkers: number;
    departmentCount: number;
    factoryCount: number;
    lastRegistryDecision: RegistryDecision | string | null;
    notes: string[];
  };
};

export type WorkerRegistryCockpitSnapshot = {
  missionId: "Q1-07";
  status: EngineStatus;
  healthStatus: HealthStatus;
  registryVersion: string;
  totalWorkers: number;
  departmentCount: number;
  factoryCount: number;
  latestWorkerId: string | null;
  neverExecuteWorkerTasks: true;
  neverReplaceWorkforceCapabilityRegistry: true;
  neverReplaceOrganizationCharter: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
