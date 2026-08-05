import { nextReportId } from "./audit-store.js";
import {
  SECART_METADATA_VERSION,
  SECURITY_AUDIT_REPORT_VERSION,
  SECURITY_AUDIT_RUNTIME_VERSION,
} from "./paths.js";
import type {
  AuditStatus,
  DiscoveredSecurityComponentRecord,
  GovernanceSummary,
  IntegrationVerification,
  Q1105ContractConsumption,
  ReadinessDecision,
  SecartCatalog,
  SecartValidationReport,
  SecurityAssessment,
  SecurityAuditReport,
  SecurityDimensionSummary,
  SecurityReadinessSummary,
  IntegrationHandshake,
} from "./types.js";

export function computeConfidenceScore(securityReadinessSummary: SecurityReadinessSummary): number {
  return securityReadinessSummary.overallReadinessScore;
}

export function buildCriticalFindings(matrix: SecurityAssessment[]): string[] {
  return matrix
    .filter((row) => row.readinessClassification === "failed")
    .map((row) => `${row.componentId}: failed security readiness — ${row.supportingEvidence.join("; ")}`);
}

export function buildOutstandingRisks(
  matrix: SecurityAssessment[],
  governanceSummary: GovernanceSummary,
  integrationVerification: IntegrationVerification,
  securityReadinessSummary: SecurityReadinessSummary,
): string[] {
  const outstandingRisks: string[] = [];

  for (const row of matrix) {
    if (row.readinessClassification === "missing") {
      outstandingRisks.push(`${row.componentId}: missing structural evidence — ${row.supportingEvidence.join("; ")}`);
    } else if (row.readinessClassification === "partially_certified") {
      outstandingRisks.push(`${row.componentId}: partially certified — ${row.supportingEvidence.join("; ")}`);
    } else if (row.readinessClassification === "blocked") {
      outstandingRisks.push(`${row.componentId}: blocked — ${row.supportingEvidence.join("; ")}`);
    } else if (row.readinessClassification === "deferred") {
      outstandingRisks.push(`${row.componentId}: deferred — ${row.supportingEvidence.join("; ")}`);
    }
  }

  if (!governanceSummary.compliant) {
    outstandingRisks.push(`Governance: ${governanceSummary.evidence.join("; ")}`);
  }
  if (!integrationVerification.allBound) {
    outstandingRisks.push(
      `Integration incomplete: ${integrationVerification.boundCount}/${integrationVerification.totalTargets} targets bound`,
    );
  }
  if (!securityReadinessSummary.allCertified) {
    outstandingRisks.push(
      `Security readiness incomplete: ${securityReadinessSummary.certifiedCount}/${securityReadinessSummary.totalComponents} components certified`,
    );
  }

  return outstandingRisks;
}

/**
 * Maps the overall readiness decision onto the richer AUDIT_STATUSES
 * catalog using the per-component classification counts as evidence — a
 * decision alone (certify | withhold | escalate | defer) cannot
 * distinguish "missing" from "partially_certified", so the most severe
 * non-zero classification present in the audited matrix is surfaced.
 */
export function mapDecisionToAuditStatus(
  decision: ReadinessDecision,
  validationDecision: "pass" | "partial" | "fail",
  summary: SecurityReadinessSummary,
): AuditStatus {
  if (validationDecision === "fail") return "rejected";
  if (summary.totalComponents === 0) return "missing";
  if (summary.missingCount > 0) return "missing";
  if (summary.failedCount > 0) return "failed";
  if (summary.blockedCount > 0) return "blocked";
  if (decision === "certify" && summary.allCertified) return "certified";
  if (summary.partiallyCertifiedCount > 0) return "partially_certified";
  if (decision === "defer" || summary.deferredCount > 0) return "deferred";
  if (decision === "certify") return "certified";
  return "unknown";
}

export type BuildReportParams = {
  reportId?: string | null;
  componentInventory: DiscoveredSecurityComponentRecord[];
  assessments: SecurityAssessment[];
  governanceSummary: GovernanceSummary;
  authenticationSummary: SecurityDimensionSummary;
  authorizationSummary: SecurityDimensionSummary;
  secretManagementSummary: SecurityDimensionSummary;
  apiSecuritySummary: SecurityDimensionSummary;
  dataProtectionSummary: SecurityDimensionSummary;
  runtimeSecuritySummary: SecurityDimensionSummary;
  operationalSecuritySummary: SecurityDimensionSummary;
  integrationVerification: IntegrationVerification;
  securityReadinessSummary: SecurityReadinessSummary;
  q1105ContractConsumed: Q1105ContractConsumption;
  decision: ReadinessDecision;
  criticalFindings: string[];
  outstandingRisks: string[];
  validation: SecartValidationReport;
  workerId: string;
  consumableByQ1106: boolean;
};

export function buildReport(params: BuildReportParams): SecurityAuditReport {
  const now = new Date().toISOString();
  const confidenceScore = computeConfidenceScore(params.securityReadinessSummary);
  const auditStatus = mapDecisionToAuditStatus(
    params.decision,
    params.validation.decision,
    params.securityReadinessSummary,
  );

  return {
    reportId: params.reportId?.trim() || nextReportId(),
    timestamp: now,
    auditVersion: SECURITY_AUDIT_RUNTIME_VERSION,
    engineId: "PILLOW-SECART-001",
    missionId: "Q11-05",
    totalSecurityComponents: params.securityReadinessSummary.totalComponents,
    certifiedComponents: params.securityReadinessSummary.certifiedCount,
    partiallyCertifiedComponents: params.securityReadinessSummary.partiallyCertifiedCount,
    failedComponents: params.securityReadinessSummary.failedCount,
    missingComponents: params.securityReadinessSummary.missingCount,
    blockedComponents: params.securityReadinessSummary.blockedCount,
    deferredComponents: params.securityReadinessSummary.deferredCount,
    authenticationSummary: params.authenticationSummary,
    authorizationSummary: params.authorizationSummary,
    secretManagementSummary: params.secretManagementSummary,
    apiSecuritySummary: params.apiSecuritySummary,
    dataProtectionSummary: params.dataProtectionSummary,
    runtimeSecuritySummary: params.runtimeSecuritySummary,
    operationalSecuritySummary: params.operationalSecuritySummary,
    integrationSummary: params.integrationVerification,
    governanceSummary: params.governanceSummary,
    criticalFindings: params.criticalFindings,
    supportingEvidence: params.assessments.flatMap((row) =>
      row.supportingEvidence.map((e) => `${row.componentId}: ${e}`),
    ),
    outstandingRisks: params.outstandingRisks,
    confidenceScore,
    metadataVersion: SECART_METADATA_VERSION,
    reportVersion: SECURITY_AUDIT_REPORT_VERSION,
    workerId: params.workerId,
    findings: params.assessments.map((row) => `${row.componentId}: ${row.readinessClassification}`),
    assessments: params.assessments,
    decision: params.decision,
    auditStatus,
    validation: params.validation,
    securityReadinessSummary: params.securityReadinessSummary,
    componentInventory: params.componentInventory,
    q1105ContractConsumed: params.q1105ContractConsumed,
    consumableByQ1106: params.consumableByQ1106,
    neverImplementQ1106OrLater: true,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    fifthQ11Gate: true,
    submittedToExecutiveReporting: false,
    executiveReportId: null,
    traceabilityRefs: [
      "q11-05:security-audit",
      "q11-04:business-factory-audit",
      ...params.assessments.map(
        (row) => `component:${row.componentId}:classification:${row.readinessClassification}`,
      ),
    ],
    runTimestamp: now,
    preserveCompleteTraceability: true,
    preserveImmutableAuditHistory: true,
    preserveAuditHistory: true,
    deterministicAuditBehaviour: true,
    maskSensitiveValues: true,
    neverFabricateSecurityEvidence: true,
    neverCertifyInsecureImplementations: true,
    neverExposeSecretsDuringAuditing: true,
    neverAssumeImplementation: true,
    neverModifySecurityImplementations: true,
    neverRepairFailedSecurityComponents: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
  };
}

export function buildCatalog(
  workerId: string,
  reports: SecurityAuditReport[],
  integrations: IntegrationHandshake[],
): SecartCatalog {
  return {
    reportVersion: SECURITY_AUDIT_REPORT_VERSION,
    workerId,
    reports: reports.map((r) => ({ ...r })),
    integrations: integrations.map((i) => ({ ...i })),
    metadataVersion: SECART_METADATA_VERSION,
    executiveAuthority: "pillow",
    neverFabricateSecurityEvidence: true,
    neverAssumeImplementation: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1106OrLater: true,
    fifthQ11Gate: true,
  };
}
