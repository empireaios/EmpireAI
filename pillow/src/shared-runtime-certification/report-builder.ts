import { nextReportId } from "./certification-store.js";
import {
  SRCRT_METADATA_VERSION,
  SHARED_RUNTIME_CERTIFICATION_REPORT_VERSION,
  SHARED_RUNTIME_CERTIFICATION_RUNTIME_VERSION,
} from "./paths.js";
import type {
  AuditStatus,
  CertificationDecision,
  CertificationResult,
  GovernanceResults,
  IntegrationVerification,
  MonitoringVerification,
  RecoveryVerification,
  AuditabilityVerification,
  ReportingVerification,
  CertificationSummary,
  RepositoryAudit,
  RuntimeAudit,
  RuntimeInventory,
  Q1014ContractConsumption,
  SrcrtCatalog,
  SharedRuntimeCertificationReport,
  SrcrtValidationReport,
  IntegrationHandshake,
} from "./types.js";

export function computeConfidenceScore(matrix: CertificationResult[]): number {
  if (matrix.length === 0) return 0;
  const certified = matrix.filter((row) => row.certificationStatus === "Certified").length;
  return Math.round((certified / matrix.length) * 100) / 100;
}

export function buildRisksAndFindings(
  matrix: CertificationResult[],
  integration: IntegrationVerification,
  certificationSummary: CertificationSummary,
  governanceResults: GovernanceResults,
  monitoringVerification: MonitoringVerification,
  recoveryVerification: RecoveryVerification,
  auditabilityVerification: AuditabilityVerification,
  reportingVerification: ReportingVerification,
): { risks: string[]; outstandingIssues: string[] } {
  const risks: string[] = [];
  const outstandingIssues: string[] = [];

  for (const row of matrix) {
    if (row.certificationStatus === "Blocked") {
      risks.push(`${row.missionId} (${row.runtimeComponent}) blocked: ${row.verificationResult}`);
      outstandingIssues.push(`${row.missionId}: blocked — ${row.verificationResult}`);
    } else if (row.certificationStatus === "Failed Certification") {
      risks.push(`${row.missionId} (${row.runtimeComponent}) failed certification: ${row.verificationResult}`);
      outstandingIssues.push(`${row.missionId}: ${row.verificationResult}`);
    } else if (row.certificationStatus === "Partially Certified") {
      risks.push(`${row.missionId} (${row.runtimeComponent}) partially certified: ${row.verificationResult}`);
      outstandingIssues.push(`${row.missionId}: ${row.verificationResult}`);
    } else if (row.certificationStatus === "Deferred") {
      outstandingIssues.push(`${row.missionId}: deferred — ${row.verificationResult}`);
    }
  }

  for (const row of integration.rows) {
    if (!row.allBound) {
      risks.push(`${row.missionId} integration incomplete`);
      outstandingIssues.push(`${row.missionId}: integration not bound`);
    }
  }

  if (!governanceResults.compliant) {
    for (const doc of governanceResults.missingDocs) {
      risks.push(`Governance document missing: ${doc}`);
      outstandingIssues.push(`Governance: ${doc} missing`);
    }
  }

  if (!certificationSummary.ready) {
    outstandingIssues.push(
      `Production readiness incomplete: ${certificationSummary.certifiedCount}/${certificationSummary.totalRuntimes} runtimes Certified`,
    );
  }

  if (!monitoringVerification.verified) {
    outstandingIssues.push(`Monitoring verification incomplete: ${monitoringVerification.evidence.join("; ")}`);
  }
  if (!recoveryVerification.verified) {
    outstandingIssues.push(`Recovery verification incomplete: ${recoveryVerification.evidence.join("; ")}`);
  }
  if (!auditabilityVerification.verified) {
    outstandingIssues.push(`Auditability verification incomplete: ${auditabilityVerification.evidence.join("; ")}`);
  }
  if (!reportingVerification.verified) {
    outstandingIssues.push(`Reporting verification incomplete: ${reportingVerification.evidence.join("; ")}`);
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

export function buildSupportingEvidence(
  repositoryAudit: RepositoryAudit,
  runtimeAudit: RuntimeAudit,
  matrix: CertificationResult[],
): string[] {
  return [
    ...repositoryAudit.evidence,
    ...runtimeAudit.notes,
    ...matrix.map((row) => `${row.missionId}:${row.certificationStatus}:${row.verificationResult}`),
  ];
}

export type BuildReportParams = {
  reportId?: string | null;
  repositoryAudit: RepositoryAudit;
  runtimeAudit: RuntimeAudit;
  runtimeInventory: RuntimeInventory;
  runtimeCertificationMatrix: CertificationResult[];
  integrationSummary: IntegrationVerification;
  certificationSummary: CertificationSummary;
  governanceResults: GovernanceResults;
  monitoringVerification: MonitoringVerification;
  recoveryVerification: RecoveryVerification;
  auditabilityVerification: AuditabilityVerification;
  reportingVerification: ReportingVerification;
  q1014ContractConsumed: Q1014ContractConsumption;
  certificationDecision: CertificationDecision;
  risks: string[];
  outstandingIssues: string[];
  validation: SrcrtValidationReport;
  workerId: string;
  consumableByQ1101: boolean;
};

export function buildReport(params: BuildReportParams): SharedRuntimeCertificationReport {
  const now = new Date().toISOString();
  const confidenceScore = computeConfidenceScore(params.runtimeCertificationMatrix);
  const supportingEvidence = buildSupportingEvidence(
    params.repositoryAudit,
    params.runtimeAudit,
    params.runtimeCertificationMatrix,
  );
  const passedComponents = params.runtimeCertificationMatrix
    .filter((r) => r.certificationStatus === "Certified")
    .map((r) => r.missionId);
  const failedComponents = params.runtimeCertificationMatrix
    .filter((r) => r.certificationStatus === "Failed Certification" || r.certificationStatus === "Blocked")
    .map((r) => r.missionId);
  const missingComponents = params.runtimeCertificationMatrix
    .filter((r) => r.certificationStatus === "Blocked")
    .map((r) => r.missionId);

  return {
    reportId: params.reportId?.trim() || nextReportId(),
    timestamp: now,
    runtimeVersion: SHARED_RUNTIME_CERTIFICATION_RUNTIME_VERSION,
    runtimeInventory: params.runtimeInventory,
    integrationSummary: params.integrationSummary,
    certificationSummary: params.certificationSummary,
    passedComponents,
    failedComponents,
    missingComponents,
    supportingEvidence,
    auditStatus: mapDecisionToAuditStatus(params.certificationDecision, params.validation.decision),
    outstandingIssues: params.outstandingIssues,
    confidenceScore,
    metadataVersion: SRCRT_METADATA_VERSION,
    reportVersion: SHARED_RUNTIME_CERTIFICATION_REPORT_VERSION,
    workerId: params.workerId,
    certificationDecision: params.certificationDecision,
    validation: params.validation,
    consumableByQ1101: params.consumableByQ1101,
    runtimeCertificationMatrix: params.runtimeCertificationMatrix,
    governanceResults: params.governanceResults,
    monitoringVerification: params.monitoringVerification,
    recoveryVerification: params.recoveryVerification,
    auditabilityVerification: params.auditabilityVerification,
    reportingVerification: params.reportingVerification,
    q1014ContractConsumed: params.q1014ContractConsumed,
    risks: params.risks,
    repositoryAudit: params.repositoryAudit,
    runtimeAudit: params.runtimeAudit,
    runTimestamp: now,
    submittedToExecutiveReporting: false,
    executiveReportId: null,
    traceabilityRefs: [
      "q10-14:shared-runtime-certification",
      ...params.runtimeCertificationMatrix.map((row) => `mission:${row.missionId}:component:${row.runtimeComponent}`),
    ],
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    preserveCompleteTraceability: true,
    preserveImmutableCertificationHistory: true,
    preserveCertificationHistory: true,
    preserveAuditHistory: true,
    deterministicCertification: true,
    maskSensitiveValues: true,
    neverFabricateCertificationEvidence: true,
    neverCertifyMissingFunctionality: true,
    neverAssumeImplementation: true,
    neverImplementMissingRuntimes: true,
    neverModifyRuntimeBehaviour: true,
    neverAutomaticallyFixFailures: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1101OrLater: true,
    finalQ10Gate: true,
  };
}

export function buildCatalog(
  workerId: string,
  reports: SharedRuntimeCertificationReport[],
  integrations: IntegrationHandshake[],
): SrcrtCatalog {
  return {
    reportVersion: SHARED_RUNTIME_CERTIFICATION_REPORT_VERSION,
    workerId,
    reports: reports.map((r) => ({ ...r })),
    integrations: integrations.map((i) => ({ ...i })),
    metadataVersion: SRCRT_METADATA_VERSION,
    executiveAuthority: "pillow",
    neverFabricateCertificationEvidence: true,
    neverAssumeImplementation: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1101OrLater: true,
    finalQ10Gate: true,
  };
}
