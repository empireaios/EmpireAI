import type { ExecutiveAuditEngineConfiguration } from "./configuration.js";
import type {
  AUDIT_STATUSES,
  AUDIT_TYPES,
  ENGINE_STATUSES,
  EXA_CAPABILITIES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  SEVERITY_LEVELS,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type BuiltinAuditType = (typeof AUDIT_TYPES)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type SeverityLevel = (typeof SEVERITY_LEVELS)[number];
export type ExecutiveAuditCapability = (typeof EXA_CAPABILITIES)[number];

/** Input for Q0-08 — audit target inspection only. */
export type ExecutiveAuditInput = {
  auditType?: string;
  targetObject?: string;
  objectId?: string;
  summary?: string;
  decisionHints?: string[];
  missionHints?: string[];
  workforceHints?: string[];
  governanceHints?: string[];
  approvalHints?: string[];
  businessHints?: string[];
  memoryHints?: string[];
  recommendationHints?: string[];
  evidenceHints?: string[];
  violationHints?: string[];
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  executeCorrections?: boolean;
  approveMissions?: boolean;
  assignWorkers?: boolean;
  modifyBusinessState?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
};

/** Machine-readable Audit Report (Q0-08). */
export type AuditReport = {
  auditId: string;
  timestamp: string;
  auditType: string;
  targetObject: string;
  objectId: string;
  auditStatus: AuditStatus;
  findings: string[];
  severity: SeverityLevel;
  violations: string[];
  recommendations: string[];
  correctiveActions: string[];
  evidence: string[];
  metadataVersion: string;
  auditTraceId: string;
  validationStatus: ValidationStatus;
  /** Explicit Q0-08 boundaries. */
  neverExecuteCorrections: true;
  neverApproveMissions: true;
  neverAssignWorkers: true;
  neverModifyBusinessState: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  correctionsExecuted: false;
  missionsApproved: false;
  workersAssigned: false;
  businessStateModified: false;
  pillowOverridden: false;
  grandKingOverridden: false;
  preserveAuditTraceability: true;
  preserveAuditability: true;
  preserveAuditIntegrity: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type AuditValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ExecutiveAuditEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-EXA-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: ExecutiveAuditCapability[];
  totalAudits: number;
  violationCount: number;
  metadataVersion: string;
};

export type ExecutiveAuditRunReport = {
  auditRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "audit_executive_decision"
    | "audit_mission_output"
    | "audit_workforce_action"
    | "audit_governance"
    | "audit_approval"
    | "audit_business_state"
    | "audit_execution_memory"
    | "audit_decision_recommendations"
    | "audit_recommendation_quality"
    | "run_audit"
    | "validate_audits"
    | "diagnostics";
  engineRecord: ExecutiveAuditEngineRecord;
  reports: AuditReport[];
  validation: AuditValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ExecutiveAuditEngineState = {
  engineVersion: "PILLOW-EXA-001";
  missionId: "Q0-08";
  status: EngineStatus;
  initializedAt: string;
  configuration: ExecutiveAuditEngineConfiguration;
  latestReport: ExecutiveAuditRunReport | null;
  engineRecord: ExecutiveAuditEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalAudits: number;
    violationCount: number;
    notes: string[];
  };
};

export type ExecutiveAuditCockpitSnapshot = {
  missionId: "Q0-08";
  status: EngineStatus;
  healthStatus: HealthStatus;
  totalAudits: number;
  violationCount: number;
  latestAuditId: string | null;
  neverExecuteCorrections: true;
  neverApproveMissions: true;
  neverAssignWorkers: true;
  neverModifyBusinessState: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
