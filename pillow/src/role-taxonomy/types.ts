import type { RoleTaxonomyConfiguration } from "./configuration.js";
import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  ROLE_CATEGORIES,
  ROLE_KINDS,
  ROLE_RULES,
  RTX_CAPABILITIES,
  TAXONOMY_DECISIONS,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type RoleCategory = (typeof ROLE_CATEGORIES)[number];
export type RoleKind = (typeof ROLE_KINDS)[number];
export type TaxonomyDecision = (typeof TAXONOMY_DECISIONS)[number];
export type RoleRule = (typeof ROLE_RULES)[number];
export type RoleTaxonomyCapability = (typeof RTX_CAPABILITIES)[number];

/** Machine-readable Role Definition (Q1-03). */
export type RoleDefinition = {
  taxonomyVersion: string;
  roleId: string;
  roleName: string;
  roleCategory: RoleCategory | string;
  parentRole: string | null;
  responsibilities: string[];
  authorityLevel: string;
  reportingRelationship: string;
  collaborationRules: string[];
  escalationRules: string[];
  governanceRules: string[];
  metadataVersion: string;
  purpose: string;
  decisionAuthority: string[];
  escalationAuthority: string[];
  requiredSkills: string[];
  requiredQualityStandard: string;
  roleKind: RoleKind | string;
  /** Explicit Q1-03 boundaries. */
  neverExecuteWorkerTasks: true;
  neverReplaceOrganizationCharter: true;
  neverReplaceWorkerConstitution: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  preserveAuditability: true;
  preserveTraceability: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type RoleInheritanceBinding = {
  inheritanceId: string;
  timestamp: string;
  workerId: string;
  workerName: string;
  roleId: string;
  taxonomyVersion: string;
  inherited: true;
  parentChain: string[];
  taxonomyDecision: TaxonomyDecision | string;
  rulesApplied: string[];
  rulesSatisfied: string[];
  rulesFailed: string[];
  metadataVersion: string;
  inheritanceTraceId: string;
  validationStatus: ValidationStatus;
  neverExecuteWorkerTasks: true;
  neverReplaceOrganizationCharter: true;
  neverReplaceWorkerConstitution: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  workerTasksExecuted: false;
  organizationCharterReplaced: false;
  workerConstitutionReplaced: false;
  pillowOverridden: false;
  grandKingOverridden: false;
  preserveAuditability: true;
  preserveTraceability: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type RoleTaxonomyCatalog = {
  taxonomyVersion: string;
  categories: string[];
  roles: RoleDefinition[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverExecuteWorkerTasks: true;
  neverReplaceOrganizationCharter: true;
  neverReplaceWorkerConstitution: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type RoleTaxonomyInput = {
  inheritanceId?: string | null;
  roleId?: string | null;
  roleName?: string | null;
  roleCategory?: RoleCategory | string | null;
  parentRole?: string | null;
  purpose?: string | null;
  responsibilities?: string[];
  authorityLevel?: string | null;
  reportingRelationship?: string | null;
  collaborationRules?: string[];
  escalationRules?: string[];
  governanceRules?: string[];
  decisionAuthority?: string[];
  escalationAuthority?: string[];
  requiredSkills?: string[];
  requiredQualityStandard?: string | null;
  roleKind?: RoleKind | string | null;
  workerId?: string | null;
  workerName?: string | null;
  roles?: RoleDefinition[];
  rules?: string[];
  violatedRules?: string[];
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  executeWorkerTasks?: boolean;
  replaceOrganizationCharter?: boolean;
  replaceWorkerConstitution?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
};

export type RoleTaxonomyValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type RoleTaxonomyEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-RTX-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: RoleTaxonomyCapability[];
  taxonomyVersion: string;
  totalRoles: number;
  totalInheritanceRecords: number;
  categoryCount: number;
  lastTaxonomyDecision: TaxonomyDecision | string | null;
  metadataVersion: string;
};

export type RoleTaxonomyRunReport = {
  taxonomyRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "define_taxonomy"
    | "register_role"
    | "inherit_role"
    | "validate_reporting"
    | "validate_inheritance"
    | "produce_taxonomy"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: RoleTaxonomyEngineRecord;
  catalog: RoleTaxonomyCatalog | null;
  roles: RoleDefinition[];
  inheritanceRecords: RoleInheritanceBinding[];
  taxonomyDecision: TaxonomyDecision | string | null;
  rulesFailed: string[];
  validation: RoleTaxonomyValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type RoleTaxonomyState = {
  engineVersion: "PILLOW-RTX-001";
  missionId: "Q1-03";
  status: EngineStatus;
  initializedAt: string;
  configuration: RoleTaxonomyConfiguration;
  latestReport: RoleTaxonomyRunReport | null;
  engineRecord: RoleTaxonomyEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    taxonomyVersion: string;
    totalRoles: number;
    totalInheritanceRecords: number;
    categoryCount: number;
    lastTaxonomyDecision: TaxonomyDecision | string | null;
    notes: string[];
  };
};

export type RoleTaxonomyCockpitSnapshot = {
  missionId: "Q1-03";
  status: EngineStatus;
  healthStatus: HealthStatus;
  taxonomyVersion: string;
  totalRoles: number;
  categoryCount: number;
  latestInheritanceId: string | null;
  neverExecuteWorkerTasks: true;
  neverReplaceOrganizationCharter: true;
  neverReplaceWorkerConstitution: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
