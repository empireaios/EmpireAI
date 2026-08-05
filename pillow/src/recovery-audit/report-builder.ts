import { nextReportId } from "./audit-store.js";
import {
  RECART_METADATA_VERSION,
  RECOVERY_AUDIT_REPORT_VERSION,
  RECOVERY_AUDIT_RUNTIME_VERSION,
} from "./paths.js";
import type {
  AuditStatus,
  DiscoveredRecoveryComponentRecord,
  GovernanceSummary,
  IntegrationHandshake,
  IntegrationVerification,
  Q1107ContractConsumption,
  ReadinessDecision,
  RecartCatalog,
  RecartValidationReport,
  RecoveryAssessment,
  RecoveryAuditReport,
  RecoveryDimensionSummary,
  RecoveryReadinessSummary,
} from "./types.js";

export function computeConfidenceScore(recoveryReadinessSummary: RecoveryReadinessSummary): number {
  return recoveryReadinessSummary.overallReadinessScore;
}

export function buildOutstandingRisks(
  matrix: RecoveryAssessment[],
  governanceSummary: GovernanceSummary,
  integrationVerification: IntegrationVerification,
  recoveryReadinessSummary: RecoveryReadinessSummary,
): string[] {
  const outstandingRisks: string[] = [];

  for (const row of matrix) {
    if (row.resilienceClassification === "missing") {
      outstandingRisks.push(`${row.componentId}: missing structural evidence — ${row.supportingEvidence.join("; ")}`);
    } else if (row.resilienceClassification === "failed") {
      outstandingRisks.push(`${row.componentId}: failed recovery readiness — ${row.supportingEvidence.join("; ")}`);
    } else if (row.resilienceClassification === "partially_certified") {
      outstandingRisks.push(`${row.componentId}: partially certified — ${row.supportingEvidence.join("; ")}`);
    } else if (row.resilienceClassification === "blocked") {
      outstandingRisks.push(`${row.componentId}: blocked — ${row.supportingEvidence.join("; ")}`);
    } else if (row.resilienceClassification === "deferred") {
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
  if (!recoveryReadinessSummary.allCertified) {
    outstandingRisks.push(
      `Recovery readiness incomplete: ${recoveryReadinessSummary.certifiedCount}/${recoveryReadinessSummary.totalComponents} components certified`,
    );
  }

  return outstandingRisks;
}

export function mapDecisionToAuditStatus(
  decision: ReadinessDecision,
  validationDecision: "pass" | "partial" | "fail",
  summary: RecoveryReadinessSummary,
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
  componentInventory: DiscoveredRecoveryComponentRecord[];
  assessments: RecoveryAssessment[];
  governanceSummary: GovernanceSummary;
  recoverySummary: RecoveryReadinessSummary;
  failureDetectionSummary: RecoveryDimensionSummary;
  restartSummary: RecoveryDimensionSummary;
  rollbackSummary: RecoveryDimensionSummary;
  checkpointSummary: RecoveryDimensionSummary;
  escalationSummary: RecoveryDimensionSummary;
  resilienceSummary: RecoveryDimensionSummary;
  integrationVerification: IntegrationVerification;
  q1107ContractConsumed: Q1107ContractConsumption;
  decision: ReadinessDecision;
  outstandingRisks: string[];
  validation: RecartValidationReport;
  workerId: string;
  consumableByQ1108: boolean;
};

export function buildReport(params: BuildReportParams): RecoveryAuditReport {
  const now = new Date().toISOString();
  const confidenceScore = computeConfidenceScore(params.recoverySummary);
  const auditStatus = mapDecisionToAuditStatus(
    params.decision,
    params.validation.decision,
    params.recoverySummary,
  );

  return {
    reportId: params.reportId?.trim() || nextReportId(),
    timestamp: now,
    auditVersion: RECOVERY_AUDIT_RUNTIME_VERSION,
    engineId: "PILLOW-RECART-001",
    missionId: "Q11-07",
    totalRecoveryComponents: params.recoverySummary.totalComponents,
    certifiedComponents: params.recoverySummary.certifiedCount,
    partiallyCertifiedComponents: params.recoverySummary.partiallyCertifiedCount,
    failedComponents: params.recoverySummary.failedCount,
    missingComponents: params.recoverySummary.missingCount,
    blockedComponents: params.recoverySummary.blockedCount,
    deferredComponents: params.recoverySummary.deferredCount,
    recoverySummary: params.recoverySummary,
    failureDetectionSummary: params.failureDetectionSummary,
    restartSummary: params.restartSummary,
    rollbackSummary: params.rollbackSummary,
    checkpointSummary: params.checkpointSummary,
    escalationSummary: params.escalationSummary,
    resilienceSummary: params.resilienceSummary,
    integrationSummary: params.integrationVerification,
    governanceSummary: params.governanceSummary,
    outstandingRisks: params.outstandingRisks,
    supportingEvidence: [
      ...params.recoverySummary.evidence,
      ...params.governanceSummary.evidence,
      ...params.integrationVerification.evidence,
    ],
    confidenceScore,
    metadataVersion: RECART_METADATA_VERSION,
    reportVersion: RECOVERY_AUDIT_REPORT_VERSION,
    workerId: params.workerId,
    findings: params.outstandingRisks,
    assessments: params.assessments,
    decision: params.decision,
    auditStatus,
    validation: params.validation,
    componentInventory: params.componentInventory,
    q1107ContractConsumed: params.q1107ContractConsumed,
    consumableByQ1108: params.consumableByQ1108,
    neverImplementQ1108OrLater: true,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    seventhQ11Gate: true,
    submittedToExecutiveReporting: false,
    executiveReportId: null,
    traceabilityRefs: [
      "q11-07:recovery-audit",
      "q11-06:performance-audit",
      "pillow:recovery-readiness-gate",
    ],
    runTimestamp: now,
    preserveCompleteTraceability: true,
    preserveImmutableRecoveryHistory: true,
    preserveAuditHistory: true,
    deterministicAuditBehaviour: true,
    maskSensitiveValues: true,
    neverFabricateRecoveryEvidence: true,
    neverCertifyUntestedRecovery: true,
    neverMutateProductionViaRecoveryCalls: true,
    neverAssumeImplementation: true,
    neverModifyRecoveryImplementations: true,
    neverRepairFailedRecoveryComponents: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
  };
}

export function buildCatalog(
  workerId: string,
  reports: RecoveryAuditReport[],
  integrations: IntegrationHandshake[],
): RecartCatalog {
  return {
    reportVersion: RECOVERY_AUDIT_REPORT_VERSION,
    workerId,
    reports: reports.map((r) => ({ ...r })),
    integrations: integrations.map((h) => ({ ...h })),
    metadataVersion: RECART_METADATA_VERSION,
    executiveAuthority: "pillow",
    neverFabricateRecoveryEvidence: true,
    neverAssumeImplementation: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1108OrLater: true,
    seventhQ11Gate: true,
  };
}
