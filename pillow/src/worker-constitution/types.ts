import type { WorkerConstitutionConfiguration } from "./configuration.js";
import type {
  COMPLIANCE_DECISIONS,
  CONSTITUTIONAL_RULES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
  WCT_CAPABILITIES,
  WORKER_LIFECYCLE_STAGES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type WorkerLifecycleStage = (typeof WORKER_LIFECYCLE_STAGES)[number];
export type ComplianceDecision = (typeof COMPLIANCE_DECISIONS)[number];
export type ConstitutionalRule = (typeof CONSTITUTIONAL_RULES)[number];
export type WorkerConstitutionCapability = (typeof WCT_CAPABILITIES)[number];

/** Machine-readable Worker Constitution definition (Q1-01). */
export type WorkerConstitutionDefinition = {
  constitutionVersion: string;
  workerIdentity: string;
  workerPurpose: string;
  workerResponsibilities: string[];
  workerAuthority: string[];
  workerRestrictions: string[];
  workerObligations: string[];
  communicationStandards: string[];
  reportingStandards: string[];
  qualityStandards: string[];
  governanceStandards: string[];
  escalationStandards: string[];
  auditStandards: string[];
  traceabilityStandards: string[];
  metadataVersion: string;
  constitutionalRules: string[];
  lifecycleStages: string[];
  /** Explicit Q1-01 boundaries. */
  neverExecuteWorkerTasks: true;
  neverReplaceWorkerQualityStandard: true;
  neverReplaceGovernance: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  preserveAuditability: true;
  preserveTraceability: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

/** Inheritance binding — every worker must inherit the constitution. */
export type WorkerInheritanceRecord = {
  inheritanceId: string;
  timestamp: string;
  workerId: string;
  workerName: string;
  department: string;
  constitutionVersion: string;
  lifecycleStage: WorkerLifecycleStage | string;
  complianceDecision: ComplianceDecision | string;
  rulesApplied: string[];
  rulesSatisfied: string[];
  rulesFailed: string[];
  inherited: true;
  metadataVersion: string;
  inheritanceTraceId: string;
  validationStatus: ValidationStatus;
  neverExecuteWorkerTasks: true;
  neverReplaceWorkerQualityStandard: true;
  neverReplaceGovernance: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  workerTasksExecuted: false;
  workerQualityStandardReplaced: false;
  governanceReplaced: false;
  pillowOverridden: false;
  grandKingOverridden: false;
  preserveAuditability: true;
  preserveTraceability: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type WorkerConstitutionInput = {
  inheritanceId?: string | null;
  workerId?: string | null;
  workerName?: string | null;
  department?: string | null;
  missionId?: string | null;
  lifecycleStage?: WorkerLifecycleStage | string | null;
  rules?: string[];
  violatedRules?: string[];
  governedByPillow?: boolean | null;
  followsExecutiveInstructions?: boolean | null;
  neverBypassesPillow?: boolean | null;
  withinAuthority?: boolean | null;
  reportsAllWork?: boolean | null;
  preservesAuditHistory?: boolean | null;
  preservesTraceability?: boolean | null;
  followsQualityStandard?: boolean | null;
  followsSelfCritiqueProtocol?: boolean | null;
  participatesPeerReviewWhenRequired?: boolean | null;
  usesApprovedToolsOnly?: boolean | null;
  escalatesBeyondAuthority?: boolean | null;
  remainsCertifiable?: boolean | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  executeWorkerTasks?: boolean;
  replaceWorkerQualityStandard?: boolean;
  replaceGovernance?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
};

export type WorkerConstitutionValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type WorkerConstitutionEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-WCT-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: WorkerConstitutionCapability[];
  constitutionVersion: string;
  totalInheritanceRecords: number;
  compliantCount: number;
  nonCompliantCount: number;
  lastComplianceDecision: ComplianceDecision | string | null;
  metadataVersion: string;
};

export type WorkerConstitutionRunReport = {
  constitutionRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "define_constitution"
    | "inherit_worker"
    | "validate_compliance"
    | "produce_constitution"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: WorkerConstitutionEngineRecord;
  constitution: WorkerConstitutionDefinition | null;
  inheritanceRecords: WorkerInheritanceRecord[];
  complianceDecision: ComplianceDecision | string | null;
  rulesFailed: string[];
  validation: WorkerConstitutionValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type WorkerConstitutionState = {
  engineVersion: "PILLOW-WCT-001";
  missionId: "Q1-01";
  status: EngineStatus;
  initializedAt: string;
  configuration: WorkerConstitutionConfiguration;
  latestReport: WorkerConstitutionRunReport | null;
  engineRecord: WorkerConstitutionEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    constitutionVersion: string;
    totalInheritanceRecords: number;
    compliantCount: number;
    nonCompliantCount: number;
    lastComplianceDecision: ComplianceDecision | string | null;
    notes: string[];
  };
};

export type WorkerConstitutionCockpitSnapshot = {
  missionId: "Q1-01";
  status: EngineStatus;
  healthStatus: HealthStatus;
  constitutionVersion: string;
  totalInheritanceRecords: number;
  latestInheritanceId: string | null;
  neverExecuteWorkerTasks: true;
  neverReplaceWorkerQualityStandard: true;
  neverReplaceGovernance: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
