import type { CERTIFIED_MODULE_IDS, ENGINE_STATUSES, MODULE_PASS_STATUSES } from "./paths.js";
import type { GlobalOperationsCertifiedConfiguration } from "./configuration.js";
export type CertifiedModuleId = (typeof CERTIFIED_MODULE_IDS)[number];
export type ModulePassStatus = (typeof MODULE_PASS_STATUSES)[number];
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type ModuleCertificationResult = { moduleId: CertifiedModuleId; missionId: string; status: ModulePassStatus; evidenceReference: string; notes: string };
export type GlobalOperationsCertificationReport = {
  certificationId: string; timestamp: string; validationResultsX401ToX418: ModuleCertificationResult[];
  crossModuleIntegrationResult: ModulePassStatus; endToEndGlobalWorkflowResult: ModulePassStatus;
  executiveGovernanceResult: ModulePassStatus; overallGlobalReadinessScore: number;
  warnings: string[]; errors: string[]; overallCertificationStatus: "certified" | "partial" | "failed" | "pending";
  evidenceReferences: string; metadataVersion: string; structuralSignalsOnly: true;
  modifiedProductionSystemsWithoutSafeTestMode: false;
};
export type CertificationValidationReport = { decision: "pass" | "partial" | "fail"; errors: string[]; warnings: string[]; durationMs: number; metadataVersion: string };
export type CertificationEngineRecord = {
  engineRecordId: string; timestamp: string; engineId: string; engineVersion: "PILLOW-GOC-001";
  dependencyPresence: Record<CertifiedModuleId, boolean>; metadataVersion: string;
};
export type CertificationRunReport = {
  certificationRunReportId: string; runTimestamp: string;
  action: "connect" | "validate_all_modules" | "validate_cross_module" | "validate_end_to_end" | "validate_executive_governance" | "generate_certification_report" | "diagnostics";
  engineRecord: CertificationEngineRecord; certificationReports: GlobalOperationsCertificationReport[];
  validation: CertificationValidationReport; durationMs: number; metadataVersion: string;
};
export type GlobalOperationsCertifiedState = {
  engineVersion: "PILLOW-GOC-001"; missionId: "X4-19"; status: EngineStatus; initializedAt: string;
  configuration: GlobalOperationsCertifiedConfiguration; latestReport: CertificationRunReport | null;
  engineRecord: CertificationEngineRecord | null; health: { status: "healthy" | "degraded" | "failed" | "standby"; healthScore: number; notes: string[] };
};
export type CertificationActionInput = { scope?: CertifiedModuleId[]; validated?: boolean };
