import type { OrganizationCharterConfiguration } from "./configuration.js";
import type {
  AUTHORITY_LEVELS,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  ORGANIZATIONAL_RULES,
  STRUCTURE_DECISIONS,
  VALIDATION_STATUSES,
  OCH_CAPABILITIES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type AuthorityLevel = (typeof AUTHORITY_LEVELS)[number];
export type StructureDecision = (typeof STRUCTURE_DECISIONS)[number];
export type OrganizationalRule = (typeof ORGANIZATIONAL_RULES)[number];
export type OrganizationCharterCapability = (typeof OCH_CAPABILITIES)[number];

export type FactoryDefinition = {
  factoryId: string;
  name: string;
  responsibilities: string[];
  reportsTo: "pillow";
};

export type DepartmentDefinition = {
  departmentId: string;
  name: string;
  factoryId: string;
  responsibilities: string[];
  reportsTo: string;
};

export type WorkerOwnership = {
  workerId: string;
  workerName: string;
  departmentId: string;
  reportsTo: string;
};

export type ReportingRelationship = {
  fromId: string;
  toId: string;
  relationship: "reports_to";
};

export type ResponsibilityEntry = {
  responsibilityId: string;
  ownerId: string;
  ownerType: "pillow" | "factory" | "department" | "worker";
  description: string;
};

export type EscalationStep = {
  level: number;
  actorId: string;
  actorType: AuthorityLevel | string;
};

/** Machine-readable Organization Charter (Q1-02). */
export type OrganizationCharterDefinition = {
  charterVersion: string;
  executiveAuthority: "pillow";
  organizationalHierarchy: string[];
  departments: DepartmentDefinition[];
  factories: FactoryDefinition[];
  reportingRelationships: ReportingRelationship[];
  authorityLevels: string[];
  responsibilityMatrix: ResponsibilityEntry[];
  escalationHierarchy: EscalationStep[];
  governanceRules: string[];
  metadataVersion: string;
  collaborationRules: string[];
  organizationalRules: string[];
  workerOwnership: WorkerOwnership[];
  /** Explicit Q1-02 boundaries. */
  neverExecuteWorkerTasks: true;
  neverReplaceWorkforceOperatingSystem: true;
  neverReplaceWorkforceOrchestrator: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  preserveAuditability: true;
  preserveTraceability: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type OrganizationStructureRecord = {
  structureRecordId: string;
  timestamp: string;
  charterVersion: string;
  structureDecision: StructureDecision | string;
  factoriesRegistered: string[];
  departmentsRegistered: string[];
  workersRegistered: string[];
  reportingValidated: boolean;
  escalationValidated: boolean;
  rulesApplied: string[];
  rulesSatisfied: string[];
  rulesFailed: string[];
  metadataVersion: string;
  structureTraceId: string;
  validationStatus: ValidationStatus;
  neverExecuteWorkerTasks: true;
  neverReplaceWorkforceOperatingSystem: true;
  neverReplaceWorkforceOrchestrator: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  workerTasksExecuted: false;
  workforceOperatingSystemReplaced: false;
  workforceOrchestratorReplaced: false;
  pillowOverridden: false;
  grandKingOverridden: false;
  preserveAuditability: true;
  preserveTraceability: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type OrganizationCharterInput = {
  structureRecordId?: string | null;
  factoryId?: string | null;
  factoryName?: string | null;
  factoryResponsibilities?: string[];
  departmentId?: string | null;
  departmentName?: string | null;
  departmentFactoryId?: string | null;
  departmentResponsibilities?: string[];
  workerId?: string | null;
  workerName?: string | null;
  workerDepartmentId?: string | null;
  reportsTo?: string | null;
  factories?: FactoryDefinition[];
  departments?: DepartmentDefinition[];
  workers?: WorkerOwnership[];
  rules?: string[];
  violatedRules?: string[];
  pillowIsSupremeAuthority?: boolean | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  executeWorkerTasks?: boolean;
  replaceWorkforceOperatingSystem?: boolean;
  replaceWorkforceOrchestrator?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
};

export type OrganizationCharterValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type OrganizationCharterEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-OCH-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: OrganizationCharterCapability[];
  charterVersion: string;
  totalStructureRecords: number;
  factoryCount: number;
  departmentCount: number;
  workerCount: number;
  lastStructureDecision: StructureDecision | string | null;
  metadataVersion: string;
};

export type OrganizationCharterRunReport = {
  charterRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "define_charter"
    | "register_factory"
    | "register_department"
    | "register_worker"
    | "validate_reporting"
    | "validate_escalation"
    | "produce_structure"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: OrganizationCharterEngineRecord;
  charter: OrganizationCharterDefinition | null;
  structureRecords: OrganizationStructureRecord[];
  structureDecision: StructureDecision | string | null;
  rulesFailed: string[];
  validation: OrganizationCharterValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type OrganizationCharterState = {
  engineVersion: "PILLOW-OCH-001";
  missionId: "Q1-02";
  status: EngineStatus;
  initializedAt: string;
  configuration: OrganizationCharterConfiguration;
  latestReport: OrganizationCharterRunReport | null;
  engineRecord: OrganizationCharterEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    charterVersion: string;
    totalStructureRecords: number;
    factoryCount: number;
    departmentCount: number;
    workerCount: number;
    lastStructureDecision: StructureDecision | string | null;
    notes: string[];
  };
};

export type OrganizationCharterCockpitSnapshot = {
  missionId: "Q1-02";
  status: EngineStatus;
  healthStatus: HealthStatus;
  charterVersion: string;
  factoryCount: number;
  departmentCount: number;
  workerCount: number;
  latestStructureRecordId: string | null;
  neverExecuteWorkerTasks: true;
  neverReplaceWorkforceOperatingSystem: true;
  neverReplaceWorkforceOrchestrator: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
