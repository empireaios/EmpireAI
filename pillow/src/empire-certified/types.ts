import type {
  CERTIFIED_MODULE_IDS,
  CERTIFIED_PROGRAMME_IDS,
  ENGINE_STATUSES,
  MODULE_PASS_STATUSES,
  PROGRAMME_ANCHOR_IDS,
} from "./paths.js";
import type { EmpireCertifiedConfiguration } from "./configuration.js";

export type CertifiedModuleId = (typeof CERTIFIED_MODULE_IDS)[number];
export type CertifiedProgrammeId = (typeof CERTIFIED_PROGRAMME_IDS)[number];
export type ProgrammeAnchorId = (typeof PROGRAMME_ANCHOR_IDS)[number];
export type CertifiedDependencyId = CertifiedModuleId | ProgrammeAnchorId;
export type ModulePassStatus = (typeof MODULE_PASS_STATUSES)[number];
export type EngineStatus = (typeof ENGINE_STATUSES)[number];

export type ModuleCertificationResult = {
  moduleId: CertifiedModuleId;
  missionId: string;
  status: ModulePassStatus;
  evidenceReference: string;
  notes: string;
};

export type ProgrammeCertificationResult = {
  programmeId: CertifiedProgrammeId;
  programmeLabel: string;
  status: ModulePassStatus;
  evidenceReference: string;
  notes: string;
};

export type EmpireCertificationReport = {
  certificationId: string;
  timestamp: string;
  validationResultsX1ThroughX5: ProgrammeCertificationResult[];
  validationResultsEmpireIntelligenceModules: ModuleCertificationResult[];
  crossProgrammeIntegrationStatus: ModulePassStatus;
  constitutionalGovernanceStatus: ModulePassStatus;
  enterpriseIntelligenceStatus: ModulePassStatus;
  endToEndWorkflowStatus: ModulePassStatus;
  executiveGovernanceStatus: ModulePassStatus;
  enterpriseHealthStatus: ModulePassStatus;
  overallReadinessScore: number;
  warnings: string[];
  errors: string[];
  certificationStatus: "certified" | "partial" | "failed" | "pending";
  evidenceReferences: string;
  metadataVersion: string;
  structuralSignalsOnly: true;
  modifiedProductionSystemsWithoutSafeTestMode: false;
};

export type CertificationValidationReport = {
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type CertificationEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-EC-001";
  dependencyPresence: Record<CertifiedDependencyId, boolean>;
  metadataVersion: string;
};

export type CertificationRunReport = {
  certificationRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "validate_programmes"
    | "validate_cross_programme"
    | "validate_end_to_end"
    | "validate_constitutional_governance"
    | "validate_enterprise_intelligence"
    | "validate_executive_governance"
    | "generate_certification_report"
    | "diagnostics";
  engineRecord: CertificationEngineRecord;
  certificationReports: EmpireCertificationReport[];
  validation: CertificationValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type EmpireCertifiedState = {
  engineVersion: "PILLOW-EC-001";
  missionId: "X5-20";
  status: EngineStatus;
  initializedAt: string;
  configuration: EmpireCertifiedConfiguration;
  latestReport: CertificationRunReport | null;
  engineRecord: CertificationEngineRecord | null;
  health: {
    status: "healthy" | "degraded" | "failed" | "standby";
    healthScore: number;
    notes: string[];
  };
};

export type CertificationActionInput = {
  scope?: CertifiedModuleId[];
  validated?: boolean;
};
