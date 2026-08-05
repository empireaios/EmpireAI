import { nextReportId } from "./certification-store.js";
import {
  PCCRT_METADATA_VERSION,
  PRODUCTION_CERTIFICATION_CORE_REPORT_VERSION,
  PRODUCTION_CERTIFICATION_CORE_RUNTIME_VERSION,
} from "./paths.js";
import type {
  AuditStatus,
  CertificationDecision,
  CertificationResult,
  EvidenceSummary,
  FactorySummary,
  GovernanceResults,
  IntegrationVerification,
  PccrtCatalog,
  ProductionCertificationReport,
  PccrtValidationReport,
  ProgrammeRegistration,
  Q1101ContractConsumption,
  ReadinessSummary,
  ReportingResults,
  RuntimeSummary,
  WorkerSummary,
  IntegrationHandshake,
} from "./types.js";

export function computeConfidenceScore(matrix: CertificationResult[]): number {
  if (matrix.length === 0) return 0;
  return Math.round((matrix.reduce((sum, row) => sum + row.readinessScore, 0) / matrix.length) * 100) / 100;
}

export function buildRisksAndFindings(
  matrix: CertificationResult[],
  governanceResults: GovernanceResults,
  reportingResults: ReportingResults,
  integrationVerification: IntegrationVerification,
  readinessSummary: ReadinessSummary,
): { risks: string[]; outstandingIssues: string[] } {
  const risks: string[] = [];
  const outstandingIssues: string[] = [];

  for (const row of matrix) {
    if (row.certificationStatus === "Blocked") {
      risks.push(`${row.programmeId} (${row.componentId}) blocked`);
      outstandingIssues.push(`${row.componentId}: blocked — ${row.outstandingIssues.join("; ") || "no evidence"}`);
    } else if (row.certificationStatus === "Failed Certification") {
      risks.push(`${row.programmeId} (${row.componentId}) failed certification`);
      outstandingIssues.push(`${row.componentId}: ${row.outstandingIssues.join("; ") || "failed"}`);
    } else if (row.certificationStatus === "Partially Certified") {
      risks.push(`${row.programmeId} (${row.componentId}) partially certified`);
      outstandingIssues.push(`${row.componentId}: ${row.outstandingIssues.join("; ") || "incomplete evidence"}`);
    } else if (row.certificationStatus === "Pending") {
      outstandingIssues.push(`${row.componentId}: pending — no dependency injected`);
    }
  }

  if (!governanceResults.compliant) {
    risks.push("Governance compliance incomplete");
    outstandingIssues.push(`Governance: ${governanceResults.evidence.join("; ")}`);
  }
  if (!reportingResults.verified) {
    outstandingIssues.push(`Reporting verification incomplete: ${reportingResults.evidence.join("; ")}`);
  }
  if (!integrationVerification.allBound) {
    outstandingIssues.push(
      `Integration incomplete: ${integrationVerification.boundCount}/${integrationVerification.totalTargets} targets bound`,
    );
  }
  if (!readinessSummary.ready) {
    outstandingIssues.push(
      `Production readiness incomplete: ${readinessSummary.certifiedCount}/${readinessSummary.totalItems} items Certified`,
    );
  }

  return { risks, outstandingIssues };
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

export type BuildReportParams = {
  reportId?: string | null;
  certificationScope: ProgrammeRegistration[];
  factorySummary: FactorySummary;
  workerSummary: WorkerSummary;
  runtimeSummary: RuntimeSummary;
  governanceResults: GovernanceResults;
  reportingResults: ReportingResults;
  integrationVerification: IntegrationVerification;
  readinessSummary: ReadinessSummary;
  evidenceSummary: EvidenceSummary;
  certificationResults: CertificationResult[];
  q1101ContractConsumed: Q1101ContractConsumption;
  certificationDecision: CertificationDecision;
  risks: string[];
  outstandingIssues: string[];
  validation: PccrtValidationReport;
  workerId: string;
  consumableByQ1102: boolean;
};

export function buildReport(params: BuildReportParams): ProductionCertificationReport {
  const now = new Date().toISOString();
  const confidenceScore = computeConfidenceScore(params.certificationResults);
  const failedItems = params.certificationResults
    .filter((r) => r.certificationStatus === "Failed Certification" || r.certificationStatus === "Blocked")
    .map((r) => r.componentId);

  return {
    reportId: params.reportId?.trim() || nextReportId(),
    timestamp: now,
    runtimeVersion: PRODUCTION_CERTIFICATION_CORE_RUNTIME_VERSION,
    certificationScope: params.certificationScope.map((p) => p.programmeId),
    factorySummary: params.factorySummary,
    workerSummary: params.workerSummary,
    runtimeSummary: params.runtimeSummary,
    governanceSummary: params.governanceResults,
    readinessSummary: params.readinessSummary,
    evidenceSummary: params.evidenceSummary,
    failedItems,
    outstandingRisks: params.risks,
    auditStatus: mapDecisionToAuditStatus(params.certificationDecision, params.validation.decision),
    confidenceScore,
    metadataVersion: PCCRT_METADATA_VERSION,
    reportVersion: PRODUCTION_CERTIFICATION_CORE_REPORT_VERSION,
    workerId: params.workerId,
    certificationDecision: params.certificationDecision,
    validation: params.validation,
    consumableByQ1102: params.consumableByQ1102,
    neverImplementQ1102OrLater: true,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    finalQ11CoreGate: true,
    q1101ContractConsumed: params.q1101ContractConsumed,
    programmeInventory: params.certificationScope,
    certificationResults: params.certificationResults,
    reportingSummary: params.reportingResults,
    integrationSummary: params.integrationVerification,
    submittedToExecutiveReporting: false,
    executiveReportId: null,
    traceabilityRefs: [
      "q11-01:production-certification-core",
      ...params.certificationResults.map((row) => `programme:${row.programmeId}:component:${row.componentId}`),
    ],
    runTimestamp: now,
    preserveCompleteTraceability: true,
    preserveImmutableCertificationHistory: true,
    preserveCertificationHistory: true,
    preserveAuditHistory: true,
    deterministicCertification: true,
    maskSensitiveValues: true,
    neverFabricateCertificationEvidence: true,
    neverCertifyMissingCapabilities: true,
    neverAssumeImplementation: true,
    neverImplementMissingCapabilities: true,
    neverModifyProductionLogic: true,
    neverReplaceIndividualAuditProgrammes: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
  };
}

export function buildCatalog(
  workerId: string,
  reports: ProductionCertificationReport[],
  integrations: IntegrationHandshake[],
): PccrtCatalog {
  return {
    reportVersion: PRODUCTION_CERTIFICATION_CORE_REPORT_VERSION,
    workerId,
    reports: reports.map((r) => ({ ...r })),
    integrations: integrations.map((i) => ({ ...i })),
    metadataVersion: PCCRT_METADATA_VERSION,
    executiveAuthority: "pillow",
    neverFabricateCertificationEvidence: true,
    neverAssumeImplementation: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1102OrLater: true,
    firstQ11Gate: true,
  };
}
