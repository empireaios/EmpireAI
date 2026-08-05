import { Q9_MISSIONS } from "./mission-catalog.js";
import { nextReportId } from "./certification-store.js";
import {
  CAPCRT_METADATA_VERSION,
  CAPITAL_FACTORY_CERTIFICATION_REPORT_VERSION,
  CAPITAL_FACTORY_VERSION,
} from "./paths.js";
import type {
  AuditStatus,
  CertificationDecision,
  WorkerCertificationRow,
  GovernanceResults,
  IntegrationVerification,
  EndToEndWorkflowResults,
  ExecutiveReportingResults,
  FinancialTraceabilityResults,
  ProductionReadinessAssessment,
  RepositoryAudit,
  RuntimeAudit,
  WorkerInventory,
  Q911ContractConsumption,
  CapcrtCatalog,
  CapitalCertificationReport,
  CapcrtValidationReport,
  IntegrationHandshake,
} from "./types.js";

export function computeConfidenceScore(matrix: WorkerCertificationRow[]): number {
  if (matrix.length === 0) return 0;
  const certified = matrix.filter((row) => row.status === "Certified").length;
  return Math.round((certified / matrix.length) * 100) / 100;
}

export function buildRisksAndFindings(
  matrix: WorkerCertificationRow[],
  integration: IntegrationVerification,
  productionReadiness: ProductionReadinessAssessment,
  governanceResults: GovernanceResults,
  workflowResults: EndToEndWorkflowResults,
): { risks: string[]; openIssues: string[] } {
  const risks: string[] = [];
  const openIssues: string[] = [];

  for (const row of matrix) {
    if (row.status === "Blocked") {
      risks.push(`${row.missionId} (${row.missionName}) blocked: ${row.reason}`);
      openIssues.push(`${row.missionId}: blocked — ${row.reason}`);
    } else if (row.status === "Failed Certification") {
      risks.push(`${row.missionId} (${row.missionName}) failed certification: ${row.reason}`);
      openIssues.push(`${row.missionId}: ${row.reason}`);
    } else if (row.status === "Partially Certified") {
      risks.push(`${row.missionId} (${row.missionName}) partially certified: ${row.reason}`);
      openIssues.push(`${row.missionId}: ${row.reason}`);
    } else if (row.status === "Deferred") {
      openIssues.push(`${row.missionId}: deferred — ${row.reason}`);
    }
  }

  for (const row of integration.rows) {
    if (!row.allBound) {
      risks.push(`${row.missionId} integration incomplete`);
      openIssues.push(`${row.missionId}: integration binds incomplete`);
    }
  }

  if (!governanceResults.compliant) {
    for (const doc of governanceResults.missingDocs) {
      risks.push(`Governance document missing: ${doc}`);
      openIssues.push(`Governance: ${doc} missing`);
    }
  }

  if (!productionReadiness.ready) {
    openIssues.push(
      `Production readiness incomplete: ${productionReadiness.certifiedWorkers}/${productionReadiness.certifiedWorkersTotal} workers Certified`,
    );
  }

  if (!workflowResults.complete) {
    for (const stage of workflowResults.stages) {
      if (!stage.satisfied) {
        openIssues.push(`${stage.stageId}: workflow stage not satisfied — ${stage.evidence}`);
      }
    }
  }

  return { risks, openIssues };
}

export function mapDecisionToAuditStatus(
  decision: CertificationDecision,
  validationDecision: "pass" | "partial" | "fail",
): AuditStatus {
  if (validationDecision === "fail") return "rejected";
  switch (decision) {
    case "Certified":
      return "certified";
    case "Conditionally_Certified":
      return "conditionally_certified";
    case "Not_Certified":
      return "not_certified";
    case "Failed":
      return "failed";
    case "Deferred":
      return "deferred";
    default:
      return "unknown";
  }
}

export function buildSupportingEvidence(
  repositoryAudit: RepositoryAudit,
  runtimeAudit: RuntimeAudit,
  matrix: WorkerCertificationRow[],
): string[] {
  return [
    ...repositoryAudit.evidence,
    ...runtimeAudit.notes,
    ...matrix.map((row) => `${row.missionId}:${row.status}:${row.reason}`),
  ];
}

export type BuildReportParams = {
  reportId?: string | null;
  factoryName: string;
  repositoryAudit: RepositoryAudit;
  runtimeAudit: RuntimeAudit;
  workerInventory: WorkerInventory;
  workerCertificationMatrix: WorkerCertificationRow[];
  integrationResults: IntegrationVerification;
  endToEndWorkflowResults: EndToEndWorkflowResults;
  executiveReportingResults: ExecutiveReportingResults;
  governanceResults: GovernanceResults;
  financialTraceabilityResults: FinancialTraceabilityResults;
  productionReadinessAssessment: ProductionReadinessAssessment;
  q911ContractConsumed: Q911ContractConsumption;
  certificationDecision: CertificationDecision;
  risks: string[];
  openIssues: string[];
  validation: CapcrtValidationReport;
  workerId: string;
};

export function buildReport(params: BuildReportParams): CapitalCertificationReport {
  const now = new Date().toISOString();
  const confidenceScore = computeConfidenceScore(params.workerCertificationMatrix);
  const supportingEvidence = buildSupportingEvidence(
    params.repositoryAudit,
    params.runtimeAudit,
    params.workerCertificationMatrix,
  );
  return {
    certificationId: params.reportId?.trim() || nextReportId(),
    timestamp: now,
    capitalFactoryVersion: CAPITAL_FACTORY_VERSION,
    repositoryAudit: params.repositoryAudit,
    runtimeAudit: params.runtimeAudit,
    workerInventory: params.workerInventory,
    workerCertificationMatrix: params.workerCertificationMatrix,
    integrationResults: params.integrationResults,
    endToEndWorkflowResults: params.endToEndWorkflowResults,
    executiveReportingResults: params.executiveReportingResults,
    governanceResults: params.governanceResults,
    financialTraceabilityResults: params.financialTraceabilityResults,
    productionReadinessAssessment: params.productionReadinessAssessment,
    openIssues: params.openIssues,
    risks: params.risks,
    certificationDecision: params.certificationDecision,
    supportingEvidence,
    confidenceScore,
    metadataVersion: CAPCRT_METADATA_VERSION,
    reportVersion: CAPITAL_FACTORY_CERTIFICATION_REPORT_VERSION,
    workerId: params.workerId,
    factoryName: params.factoryName,
    certificationScope: Q9_MISSIONS.map((m) => m.missionId),
    validation: params.validation,
    runTimestamp: now,
    auditStatus: mapDecisionToAuditStatus(params.certificationDecision, params.validation.decision),
    submittedToExecutiveReporting: false,
    executiveReportId: null,
    q911ContractConsumed: params.q911ContractConsumed,
    traceabilityRefs: [
      "q9-11:capital-factory-certification",
      ...params.workerCertificationMatrix.map(
        (row) => `mission:${row.missionId}:module:${row.modulePath}`,
      ),
    ],
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    preserveCompleteTraceability: true,
    preserveCertificationHistory: true,
    preserveAuditHistory: true,
    neverFabricateSuccessfulTests: true,
    neverAssumeImplementation: true,
    neverImplementMissingWorkers: true,
    neverModifyFinancialRecords: true,
    neverAutomaticallyFixFailures: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ10OrLater: true,
    neverExposeCredentials: true,
    finalQ9Gate: true,
    consumableByFutureSeries: false,
  };
}

export function buildCatalog(
  workerId: string,
  reports: CapitalCertificationReport[],
  integrations: IntegrationHandshake[],
): CapcrtCatalog {
  return {
    reportVersion: CAPITAL_FACTORY_CERTIFICATION_REPORT_VERSION,
    workerId,
    reports: reports.map((r) => ({ ...r })),
    integrations: integrations.map((i) => ({ ...i })),
    metadataVersion: CAPCRT_METADATA_VERSION,
    executiveAuthority: "pillow",
    neverFabricateSuccessfulTests: true,
    neverAssumeImplementation: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ10OrLater: true,
    finalQ9Gate: true,
  };
}
