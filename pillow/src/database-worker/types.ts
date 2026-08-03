import type { DATABASE_COMPONENTS, DBW_CAPABILITIES, ENGINE_STATUSES, INTEGRATION_TARGETS } from "./paths.js";
import type { DatabaseWorkerConfiguration } from "./configuration.js";

export type DbwEngineStatus = (typeof ENGINE_STATUSES)[number];
export type DatabaseComponent = (typeof DATABASE_COMPONENTS)[number];
export type DbwIntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type DatabaseWorkerCapability = (typeof DBW_CAPABILITIES)[number];
export type DatabaseEntry = { id: string; name: string; description: string; source?: string; fields?: string[] };
export type BuildStep = { stepId: string; stepType: string; title: string; order: number; summary: string };
export type ReviewFinding = { findingId: string; category: string; severity: "info" | "warning" | "error"; message: string };
export type PreservedDecision = { decisionId: string; topic: string; decision: string; recordedAt: string };
export type DatabaseBuildReport = {
  buildId: string; timestamp: string; platformId: string; platformName: string;
  databaseType: string; schemasCreated: DatabaseEntry[]; tablesCreated: DatabaseEntry[]; relationships: DatabaseEntry[];
  indexes: DatabaseEntry[]; constraints: DatabaseEntry[]; migrationStatus: "generated" | "partial" | "pending";
  integrityValidation: "passed" | "partial" | "pending" | "failed"; performanceSummary: string; confidenceScore: number; metadataVersion: string;
  requirementsReportId: string; architectureReportId: string; factoryMissionId: string; businessId: string; businessObjective: string;
  views: DatabaseEntry[]; primaryKeys: DatabaseEntry[]; foreignKeys: DatabaseEntry[]; seedData: DatabaseEntry[]; backupStrategy: string;
  buildSteps: BuildStep[]; selfReviewPassed: boolean; selfReviewFindings: ReviewFinding[]; selfReviewSummary: string; qualityReview: string; complianceReview: string;
  databaseCompliance: "compliant" | "partial" | "non_compliant"; databaseComplianceNotes: string; workerId: string; reportVersion: string;
  traceabilityRefs: string[]; preservedDecisions: PreservedDecision[]; submittedToExecutiveReporting: boolean; executiveReportId: string | null;
  neverBuildFrontend: true; neverBuildBackendBusinessLogic: true; neverOverrideApprovedArchitecture: true; neverOverridePillow: true; neverOverrideGrandKing: true; neverImplementQ607OrLater: true;
  neverImplementApplicationBusinessLogic: true; followApprovedRequirementsAndArchitecture: true; preserveCompleteTraceability: true; maintainDataIntegrity: true; optimizePerformance: true; preserveAuditHistory: true; structuralSignalOnly: true; maskSensitiveValues: true;
};
export type DatabaseWorkerInput = {
  buildId?: string | null; requirementsReportId?: string | null; architectureReportId?: string | null; platformId?: string | null; platformName?: string | null;
  businessId?: string | null; factoryMissionId?: string | null; businessObjective?: string | null; validated?: boolean;
  buildFrontend?: boolean; buildBackendBusinessLogic?: boolean; overrideApprovedArchitecture?: boolean; overridePillow?: boolean; overrideGrandKing?: boolean;
  implementQ607OrLater?: boolean; implementApplicationBusinessLogic?: boolean;
};
export type IntegrationHandshake = { target: DbwIntegrationTarget; status: "ready" | "bound" | "unavailable"; details: string; timestamp: string };
export type DatabaseWorkerValidationReport = { validationReportId: string; validationTimestamp: string; decision: "pass" | "partial" | "fail"; errors: string[]; warnings: string[]; durationMs: number; metadataVersion: string };
export type DatabaseWorkerEngineRecord = {
  engineRecordId: string; timestamp: string; engineId: string; engineVersion: "PILLOW-DBW-001"; currentOperationalState: string;
  healthStatus: "healthy" | "degraded" | "failed" | "standby"; validationStatus: string; supportedCapabilities: DatabaseWorkerCapability[];
  totalDatabaseBuildReports: number; lastDatabaseBuildReportId: string | null; lastConfidenceScore: number | null; workerId: string;
  integrationTargets: DbwIntegrationTarget[]; metadataVersion: string;
};
export type DatabaseWorkerCatalog = { reportVersion: string; workerId: string; databaseBuildReports: DatabaseBuildReport[]; integrations: IntegrationHandshake[]; metadataVersion: string; executiveAuthority: "pillow"; neverBuildFrontend: true; neverBuildBackendBusinessLogic: true; neverOverrideApprovedArchitecture: true; neverOverridePillow: true; neverOverrideGrandKing: true; neverImplementQ607OrLater: true };
export type DatabaseWorkerRunReport = { databaseRunReportId: string; runTimestamp: string; action: string; engineRecord: DatabaseWorkerEngineRecord; catalog: DatabaseWorkerCatalog | null; databaseBuildReports: DatabaseBuildReport[]; latestDatabaseBuildReport: DatabaseBuildReport | null; integrations: IntegrationHandshake[]; validation: DatabaseWorkerValidationReport; durationMs: number; metadataVersion: string };
export type DatabaseWorkerState = { engineVersion: "PILLOW-DBW-001"; missionId: "Q6-06"; status: DbwEngineStatus; initializedAt: string; configuration: DatabaseWorkerConfiguration; latestReport: DatabaseWorkerRunReport | null; engineRecord: DatabaseWorkerEngineRecord | null; health: { status: "healthy" | "degraded" | "failed" | "standby"; healthScore: number; engineEnabled: boolean; lastOperationAt: string | null; lastValidationDecision: "pass" | "partial" | "fail" | null; totalDatabaseBuildReports: number; lastDatabaseBuildReportId: string | null; lastConfidenceScore: number | null; notes: string[] } };
export type DatabaseWorkerCockpitSnapshot = { missionId: "Q6-06"; status: DbwEngineStatus; healthStatus: "healthy" | "degraded" | "failed" | "standby"; totalDatabaseBuildReports: number; latestDatabaseBuildReportId: string | null; lastConfidenceScore: number | null; workerId: string; neverBuildFrontend: true; neverBuildBackendBusinessLogic: true; neverOverrideApprovedArchitecture: true; neverImplementQ607OrLater: true };
