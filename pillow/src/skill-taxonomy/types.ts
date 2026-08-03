import type { SkillTaxonomyConfiguration } from "./configuration.js";
import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  PROFICIENCY_LEVELS,
  SKILL_CATEGORIES,
  SKILL_RULES,
  STX_CAPABILITIES,
  TAXONOMY_DECISIONS,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type SkillCategory = (typeof SKILL_CATEGORIES)[number];
export type ProficiencyLevel = (typeof PROFICIENCY_LEVELS)[number];
export type TaxonomyDecision = (typeof TAXONOMY_DECISIONS)[number];
export type SkillRule = (typeof SKILL_RULES)[number];
export type SkillTaxonomyCapability = (typeof STX_CAPABILITIES)[number];

/** Machine-readable Skill Definition (Q1-04). */
export type SkillDefinition = {
  taxonomyVersion: string;
  skillId: string;
  skillName: string;
  skillCategory: SkillCategory | string;
  parentSkill: string | null;
  description: string;
  proficiencyLevel: ProficiencyLevel | string;
  requiredTools: string[];
  capabilityLimits: string[];
  validationRules: string[];
  certificationRequirements: string[];
  metadataVersion: string;
  purpose: string;
  requiredKnowledge: string[];
  validationMethod: string;
  dependencies: string[];
  prerequisites: string[];
  /** Explicit Q1-04 boundaries. */
  neverExecuteWorkerTasks: true;
  neverReplaceRoleTaxonomy: true;
  neverReplaceWorkforceCapabilityRegistry: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  preserveAuditability: true;
  preserveTraceability: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type WorkerSkillBinding = {
  derivationId: string;
  timestamp: string;
  workerId: string;
  workerName: string;
  skillIds: string[];
  taxonomyVersion: string;
  derived: true;
  parentChains: Record<string, string[]>;
  proficiencyLevels: Record<string, string>;
  taxonomyDecision: TaxonomyDecision | string;
  rulesApplied: string[];
  rulesSatisfied: string[];
  rulesFailed: string[];
  metadataVersion: string;
  derivationTraceId: string;
  validationStatus: ValidationStatus;
  neverExecuteWorkerTasks: true;
  neverReplaceRoleTaxonomy: true;
  neverReplaceWorkforceCapabilityRegistry: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  workerTasksExecuted: false;
  roleTaxonomyReplaced: false;
  workforceCapabilityRegistryReplaced: false;
  pillowOverridden: false;
  grandKingOverridden: false;
  preserveAuditability: true;
  preserveTraceability: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type SkillTaxonomyCatalog = {
  taxonomyVersion: string;
  categories: string[];
  proficiencyLevels: string[];
  skills: SkillDefinition[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverExecuteWorkerTasks: true;
  neverReplaceRoleTaxonomy: true;
  neverReplaceWorkforceCapabilityRegistry: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type SkillTaxonomyInput = {
  derivationId?: string | null;
  skillId?: string | null;
  skillName?: string | null;
  skillCategory?: SkillCategory | string | null;
  parentSkill?: string | null;
  description?: string | null;
  purpose?: string | null;
  proficiencyLevel?: ProficiencyLevel | string | null;
  requiredTools?: string[];
  capabilityLimits?: string[];
  validationRules?: string[];
  certificationRequirements?: string[];
  requiredKnowledge?: string[];
  validationMethod?: string | null;
  dependencies?: string[];
  prerequisites?: string[];
  skillIds?: string[];
  workerId?: string | null;
  workerName?: string | null;
  skills?: SkillDefinition[];
  rules?: string[];
  violatedRules?: string[];
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  executeWorkerTasks?: boolean;
  replaceRoleTaxonomy?: boolean;
  replaceWorkforceCapabilityRegistry?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
};

export type SkillTaxonomyValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type SkillTaxonomyEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-STX-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: SkillTaxonomyCapability[];
  taxonomyVersion: string;
  totalSkills: number;
  totalDerivationRecords: number;
  categoryCount: number;
  proficiencyLevelCount: number;
  lastTaxonomyDecision: TaxonomyDecision | string | null;
  metadataVersion: string;
};

export type SkillTaxonomyRunReport = {
  taxonomyRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "define_taxonomy"
    | "register_skill"
    | "derive_worker_skills"
    | "validate_hierarchy"
    | "validate_proficiency"
    | "produce_taxonomy"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: SkillTaxonomyEngineRecord;
  catalog: SkillTaxonomyCatalog | null;
  skills: SkillDefinition[];
  derivationRecords: WorkerSkillBinding[];
  taxonomyDecision: TaxonomyDecision | string | null;
  rulesFailed: string[];
  validation: SkillTaxonomyValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type SkillTaxonomyState = {
  engineVersion: "PILLOW-STX-001";
  missionId: "Q1-04";
  status: EngineStatus;
  initializedAt: string;
  configuration: SkillTaxonomyConfiguration;
  latestReport: SkillTaxonomyRunReport | null;
  engineRecord: SkillTaxonomyEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    taxonomyVersion: string;
    totalSkills: number;
    totalDerivationRecords: number;
    categoryCount: number;
    proficiencyLevelCount: number;
    lastTaxonomyDecision: TaxonomyDecision | string | null;
    notes: string[];
  };
};

export type SkillTaxonomyCockpitSnapshot = {
  missionId: "Q1-04";
  status: EngineStatus;
  healthStatus: HealthStatus;
  taxonomyVersion: string;
  totalSkills: number;
  categoryCount: number;
  proficiencyLevelCount: number;
  latestDerivationId: string | null;
  neverExecuteWorkerTasks: true;
  neverReplaceRoleTaxonomy: true;
  neverReplaceWorkforceCapabilityRegistry: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
