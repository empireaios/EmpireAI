import type { ResponsibilityMatrixConfiguration } from "./configuration.js";
import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  MATRIX_DECISIONS,
  OPERATIONAL_STATES,
  RESPONSIBILITY_RULES,
  RMX_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type MatrixDecision = (typeof MATRIX_DECISIONS)[number];
export type ResponsibilityRule = (typeof RESPONSIBILITY_RULES)[number];
export type ResponsibilityMatrixCapability = (typeof RMX_CAPABILITIES)[number];

/** Machine-readable Responsibility Record (Q1-06). */
export type ResponsibilityDefinition = {
  matrixVersion: string;
  responsibilityId: string;
  responsibilityName: string;
  primaryOwner: string;
  supportingWorkers: string[];
  department: string;
  factory: string;
  requiredInputs: string[];
  expectedOutputs: string[];
  dependencies: string[];
  requiredApprovals: string[];
  successCriteria: string[];
  failureConditions: string[];
  escalationTarget: string;
  metadataVersion: string;
  escalationPath: string[];
  qualityRequirements: string[];
  completionCriteria: string[];
  purpose: string;
  /** Explicit Q1-06 boundaries. */
  neverExecuteWorkerTasks: true;
  neverReplaceAuthorityMatrix: true;
  neverReplaceOrganizationCharter: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  preserveAuditability: true;
  preserveTraceability: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type ResponsibilityBinding = {
  bindingId: string;
  timestamp: string;
  subjectId: string;
  subjectType: "worker" | "department" | "factory" | string;
  responsibilityIds: string[];
  matrixVersion: string;
  derived: true;
  ownerMap: Record<string, string>;
  matrixDecision: MatrixDecision | string;
  rulesApplied: string[];
  rulesSatisfied: string[];
  rulesFailed: string[];
  metadataVersion: string;
  bindingTraceId: string;
  validationStatus: ValidationStatus;
  neverExecuteWorkerTasks: true;
  neverReplaceAuthorityMatrix: true;
  neverReplaceOrganizationCharter: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  workerTasksExecuted: false;
  authorityMatrixReplaced: false;
  organizationCharterReplaced: false;
  pillowOverridden: false;
  grandKingOverridden: false;
  preserveAuditability: true;
  preserveTraceability: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type ResponsibilityMatrixCatalog = {
  matrixVersion: string;
  responsibilities: ResponsibilityDefinition[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverExecuteWorkerTasks: true;
  neverReplaceAuthorityMatrix: true;
  neverReplaceOrganizationCharter: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type ResponsibilityMatrixInput = {
  bindingId?: string | null;
  responsibilityId?: string | null;
  responsibilityName?: string | null;
  primaryOwner?: string | null;
  supportingWorkers?: string[];
  department?: string | null;
  factory?: string | null;
  requiredInputs?: string[];
  expectedOutputs?: string[];
  dependencies?: string[];
  requiredApprovals?: string[];
  successCriteria?: string[];
  failureConditions?: string[];
  escalationTarget?: string | null;
  escalationPath?: string[];
  qualityRequirements?: string[];
  completionCriteria?: string[];
  purpose?: string | null;
  responsibilityIds?: string[];
  subjectId?: string | null;
  subjectType?: string | null;
  responsibilities?: ResponsibilityDefinition[];
  matrixRules?: string[];
  violatedRules?: string[];
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  executeWorkerTasks?: boolean;
  replaceAuthorityMatrix?: boolean;
  replaceOrganizationCharter?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
};

export type ResponsibilityMatrixValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ResponsibilityMatrixEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-RMX-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: ResponsibilityMatrixCapability[];
  matrixVersion: string;
  totalResponsibilities: number;
  totalBindings: number;
  ownerCount: number;
  lastMatrixDecision: MatrixDecision | string | null;
  metadataVersion: string;
};

export type ResponsibilityMatrixRunReport = {
  matrixRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "define_matrix"
    | "register_responsibility"
    | "derive_ownership"
    | "validate_ownership"
    | "validate_inputs_outputs"
    | "validate_dependencies"
    | "validate_approvals"
    | "produce_matrix"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: ResponsibilityMatrixEngineRecord;
  catalog: ResponsibilityMatrixCatalog | null;
  responsibilities: ResponsibilityDefinition[];
  bindings: ResponsibilityBinding[];
  matrixDecision: MatrixDecision | string | null;
  rulesFailed: string[];
  validation: ResponsibilityMatrixValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ResponsibilityMatrixState = {
  engineVersion: "PILLOW-RMX-001";
  missionId: "Q1-06";
  status: EngineStatus;
  initializedAt: string;
  configuration: ResponsibilityMatrixConfiguration;
  latestReport: ResponsibilityMatrixRunReport | null;
  engineRecord: ResponsibilityMatrixEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    matrixVersion: string;
    totalResponsibilities: number;
    totalBindings: number;
    ownerCount: number;
    lastMatrixDecision: MatrixDecision | string | null;
    notes: string[];
  };
};

export type ResponsibilityMatrixCockpitSnapshot = {
  missionId: "Q1-06";
  status: EngineStatus;
  healthStatus: HealthStatus;
  matrixVersion: string;
  totalResponsibilities: number;
  ownerCount: number;
  latestBindingId: string | null;
  neverExecuteWorkerTasks: true;
  neverReplaceAuthorityMatrix: true;
  neverReplaceOrganizationCharter: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
