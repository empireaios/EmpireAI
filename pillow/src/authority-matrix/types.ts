import type { AuthorityMatrixConfiguration } from "./configuration.js";
import type {
  AUTHORITY_LEVELS,
  AUTHORITY_RULES,
  AMX_CAPABILITIES,
  DECISION_CATEGORIES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  MATRIX_DECISIONS,
  OPERATIONAL_STATES,
  RISK_CLASSIFICATIONS,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type AuthorityLevel = (typeof AUTHORITY_LEVELS)[number];
export type DecisionCategory = (typeof DECISION_CATEGORIES)[number];
export type RiskClassification = (typeof RISK_CLASSIFICATIONS)[number];
export type MatrixDecision = (typeof MATRIX_DECISIONS)[number];
export type AuthorityRuleId = (typeof AUTHORITY_RULES)[number];
export type AuthorityMatrixCapability = (typeof AMX_CAPABILITIES)[number];

/** Machine-readable Authority Rule (Q1-05). */
export type AuthorityRuleDefinition = {
  matrixVersion: string;
  authorityId: string;
  decisionCategory: DecisionCategory | string;
  workerRole: string;
  permittedActions: string[];
  restrictedActions: string[];
  requiredApproval: AuthorityLevel | string;
  escalationTarget: string;
  riskClassification: RiskClassification | string;
  metadataVersion: string;
  whoMayPerform: string[];
  approvalRequired: boolean;
  maximumAuthority: AuthorityLevel | string;
  escalationPath: string[];
  riskLevel: RiskClassification | string;
  auditRequirements: string[];
  parentAuthority: string | null;
  purpose: string;
  /** Explicit Q1-05 boundaries. */
  neverExecuteWorkerTasks: true;
  neverReplaceApprovalRouter: true;
  neverReplaceOrganizationCharter: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  preserveAuditability: true;
  preserveTraceability: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type AuthorityBinding = {
  bindingId: string;
  timestamp: string;
  subjectId: string;
  subjectType: "worker" | "manager" | "department" | "factory" | "pillow" | "grand_king" | string;
  authorityIds: string[];
  matrixVersion: string;
  derived: true;
  parentChains: Record<string, string[]>;
  matrixDecision: MatrixDecision | string;
  rulesApplied: string[];
  rulesSatisfied: string[];
  rulesFailed: string[];
  metadataVersion: string;
  bindingTraceId: string;
  validationStatus: ValidationStatus;
  neverExecuteWorkerTasks: true;
  neverReplaceApprovalRouter: true;
  neverReplaceOrganizationCharter: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  workerTasksExecuted: false;
  approvalRouterReplaced: false;
  organizationCharterReplaced: false;
  pillowOverridden: false;
  grandKingOverridden: false;
  preserveAuditability: true;
  preserveTraceability: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type AuthorityMatrixCatalog = {
  matrixVersion: string;
  authorityLevels: string[];
  decisionCategories: string[];
  rules: AuthorityRuleDefinition[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  supremeAuthority: "grand_king";
  neverExecuteWorkerTasks: true;
  neverReplaceApprovalRouter: true;
  neverReplaceOrganizationCharter: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type AuthorityMatrixInput = {
  bindingId?: string | null;
  authorityId?: string | null;
  decisionCategory?: DecisionCategory | string | null;
  workerRole?: string | null;
  permittedActions?: string[];
  restrictedActions?: string[];
  requiredApproval?: AuthorityLevel | string | null;
  escalationTarget?: string | null;
  riskClassification?: RiskClassification | string | null;
  whoMayPerform?: string[];
  approvalRequired?: boolean;
  maximumAuthority?: AuthorityLevel | string | null;
  escalationPath?: string[];
  riskLevel?: RiskClassification | string | null;
  auditRequirements?: string[];
  parentAuthority?: string | null;
  purpose?: string | null;
  authorityIds?: string[];
  subjectId?: string | null;
  subjectType?: string | null;
  rules?: AuthorityRuleDefinition[];
  matrixRules?: string[];
  violatedRules?: string[];
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  executeWorkerTasks?: boolean;
  replaceApprovalRouter?: boolean;
  replaceOrganizationCharter?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
};

export type AuthorityMatrixValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type AuthorityMatrixEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-AMX-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: AuthorityMatrixCapability[];
  matrixVersion: string;
  totalRules: number;
  totalBindings: number;
  authorityLevelCount: number;
  decisionCategoryCount: number;
  lastMatrixDecision: MatrixDecision | string | null;
  metadataVersion: string;
};

export type AuthorityMatrixRunReport = {
  matrixRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "define_matrix"
    | "register_rule"
    | "derive_authority"
    | "validate_worker_authority"
    | "validate_pillow_authority"
    | "validate_grand_king_authority"
    | "validate_approval_routing"
    | "produce_matrix"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: AuthorityMatrixEngineRecord;
  catalog: AuthorityMatrixCatalog | null;
  rules: AuthorityRuleDefinition[];
  bindings: AuthorityBinding[];
  matrixDecision: MatrixDecision | string | null;
  rulesFailed: string[];
  validation: AuthorityMatrixValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type AuthorityMatrixState = {
  engineVersion: "PILLOW-AMX-001";
  missionId: "Q1-05";
  status: EngineStatus;
  initializedAt: string;
  configuration: AuthorityMatrixConfiguration;
  latestReport: AuthorityMatrixRunReport | null;
  engineRecord: AuthorityMatrixEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    matrixVersion: string;
    totalRules: number;
    totalBindings: number;
    authorityLevelCount: number;
    decisionCategoryCount: number;
    lastMatrixDecision: MatrixDecision | string | null;
    notes: string[];
  };
};

export type AuthorityMatrixCockpitSnapshot = {
  missionId: "Q1-05";
  status: EngineStatus;
  healthStatus: HealthStatus;
  matrixVersion: string;
  totalRules: number;
  authorityLevelCount: number;
  decisionCategoryCount: number;
  latestBindingId: string | null;
  neverExecuteWorkerTasks: true;
  neverReplaceApprovalRouter: true;
  neverReplaceOrganizationCharter: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
