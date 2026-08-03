import type { CERTIFICATION_STATUSES, ENGINE_STATUSES } from "./paths.js";

export type CertificationStatus = (typeof CERTIFICATION_STATUSES)[number];
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type WorkerHandle = object;
export type WorkerProbeResult = { workerKey: string; reachable: boolean; evidence: string; error?: string };
export type MissionVerificationRow = {
  missionId: string; missionName: string; expectedDeliverable: string; implementationLocation: string;
  registrationEvidence: string; integrationEvidence: string; testEvidence: string; runtimeEvidence: string;
  pillowAccessEvidence: string; governanceEvidence: string; failureEvidence: string; status: CertificationStatus;
  reason: string; remediationRequired: boolean;
};
export type CheckResult = { checkId: string; name: string; passed: boolean; evidence: string; safetyBehavior?: boolean };
export type DimensionResult = { dimension: string; passed: boolean; evidence: string; failedMissionIds: string[] };
export type EndToEndScenarioResult = { scenarioId: string; step: string; passed: boolean; critical: boolean; evidence: string };
export type PlatformFixture = { platformFixtureId?: string; factoryId?: string; factoryVersion?: string; environment?: string; grandKingApproval?: boolean };
export type PlatformCertificationDependencies = {
  repositoryRoot?: string; executiveReportingRuntime?: { submitWorkerReport?: (input: Record<string, unknown>) => unknown };
  enterprisePlatformFactoryCore?: WorkerHandle; requirementsWorker?: WorkerHandle; architectureWorker?: WorkerHandle;
  frontendWorker?: WorkerHandle; backendWorker?: WorkerHandle; databaseWorker?: WorkerHandle; authenticationWorker?: WorkerHandle;
  authorizationWorker?: WorkerHandle; billingWorker?: WorkerHandle; apiIntegrationWorker?: WorkerHandle;
  workflowBuilderWorker?: WorkerHandle; notificationWorker?: WorkerHandle; testingWorker?: WorkerHandle; deploymentWorker?: WorkerHandle;
  workerRegistry?: object; workerLifecycle?: object; workerAssignmentEngine?: object;
  workerPerformanceReview?: object; workerRecoverySystem?: object;
};
export type PlatformCertificationInput = PlatformFixture & {
  missionId?: string; fabricateCertificationSuccess?: boolean; autoMarkComplete?: boolean; activateProduction?: boolean;
  realBilling?: boolean; implementQ7OrLater?: boolean; overridePillow?: boolean; overrideGrandKing?: boolean;
};
export type PlatformCertificationConfiguration = {
  enabled: boolean; timeoutMs: number; repositoryEvidenceScanEnabled: boolean;
  neverFabricateCertificationSuccess: true; neverAutoMarkIncompleteMissionsComplete: true;
  neverActivateRealProduction: true; neverConductRealCustomerBilling: true; neverOverridePillowGrandKing: true; neverImplementQ7OrLater: true;
};
export type PlatformCertificationReport = {
  certificationId: string; certificationTimestamp: string; platformFixtureId: string; factoryId: string; factoryVersion: string;
  repositoryRevision: string; environment: string; certificationStatus: CertificationStatus; missionVerificationMatrix: MissionVerificationRow[];
  workerRegistrationResults: CheckResult[]; pillowCommandResults: CheckResult[]; dependencyVerificationResults: CheckResult[];
  requirementsResults: CheckResult[]; architectureResults: CheckResult[]; frontendResults: CheckResult[]; backendResults: CheckResult[];
  databaseResults: CheckResult[]; authenticationResults: CheckResult[]; authorizationResults: CheckResult[]; billingResults: CheckResult[];
  apiIntegrationResults: CheckResult[]; workflowResults: CheckResult[]; notificationResults: CheckResult[]; testingResults: CheckResult[];
  deploymentResults: CheckResult[]; rollbackResults: CheckResult[]; securityResults: CheckResult[]; governanceResults: CheckResult[];
  auditEvidence: CheckResult[]; endToEndScenarioResults: EndToEndScenarioResult[]; failedChecks: CheckResult[];
  conditionalFindings: string[]; outstandingIssues: string[]; recommendedRemediation: string[]; executiveSummary: string;
  evidenceReferences: string[]; confidenceScore: number; metadataVersion: "PFC-001-v1";
  neverFabricateCertificationSuccess: true; neverAutoMarkIncompleteMissionsComplete: true; neverActivateRealProduction: true;
  neverConductRealCustomerBilling: true; neverOverridePillowGrandKing: true; neverImplementQ7OrLater: true;
  submittedToExecutiveReporting: boolean; executiveReportId: string | null; workerId: "wkr-platform-cert-01"; reportVersion: "PFC-RPT-v1";
};
export type PlatformCertificationState = { engineVersion: "PILLOW-PFC-001"; missionId: "Q6-15"; status: EngineStatus; initializedAt: string; configuration: PlatformCertificationConfiguration; latestReport: PlatformCertificationReport | null };
