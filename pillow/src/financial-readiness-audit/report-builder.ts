import { nextReportId } from "./audit-store.js";
import {
  FINART_METADATA_VERSION,
  FINANCIAL_READINESS_AUDIT_REPORT_VERSION,
  FINANCIAL_READINESS_AUDIT_RUNTIME_VERSION,
} from "./paths.js";
import type {
  AuditStatus,
  DiscoveredFinancialComponentRecord,
  GovernanceSummary,
  IntegrationHandshake,
  IntegrationVerification,
  Q1108ContractConsumption,
  ReadinessDecision,
  FinartCatalog,
  FinartValidationReport,
  FinancialAssessment,
  FinancialReadinessAuditReport,
  FinancialDimensionSummary,
  FinancialReadinessSummary,
} from "./types.js";

export function computeConfidenceScore(financialReadinessSummary: FinancialReadinessSummary): number {
  return financialReadinessSummary.overallReadinessScore;
}

export function buildOutstandingRisks(
  matrix: FinancialAssessment[],
  governanceSummary: GovernanceSummary,
  integrationVerification: IntegrationVerification,
  financialReadinessSummary: FinancialReadinessSummary,
): string[] {
  const outstandingRisks: string[] = [];

  for (const row of matrix) {
    if (row.readinessClassification === "missing") {
      outstandingRisks.push(`${row.componentId}: missing structural evidence — ${row.supportingEvidence.join("; ")}`);
    } else if (row.readinessClassification === "failed") {
      outstandingRisks.push(`${row.componentId}: failed financial readiness — ${row.supportingEvidence.join("; ")}`);
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
  if (!financialReadinessSummary.allCertified) {
    outstandingRisks.push(
      `Financial readiness incomplete: ${financialReadinessSummary.certifiedCount}/${financialReadinessSummary.totalComponents} components certified`,
    );
  }

  return outstandingRisks;
}

export function mapDecisionToAuditStatus(
  decision: ReadinessDecision,
  validationDecision: "pass" | "partial" | "fail",
  summary: FinancialReadinessSummary,
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
  componentInventory: DiscoveredFinancialComponentRecord[];
  assessments: FinancialAssessment[];
  governanceSummary: GovernanceSummary;
  financialReadinessSummary: FinancialReadinessSummary;
  paymentWorkflowSummary: FinancialDimensionSummary;
  revenueRecordingSummary: FinancialDimensionSummary;
  expenseTrackingSummary: FinancialDimensionSummary;
  accountingRecordsSummary: FinancialDimensionSummary;
  financialReportingSummary: FinancialDimensionSummary;
  costControlSummary: FinancialDimensionSummary;
  financialGovernanceSummary: FinancialDimensionSummary;
  auditTraceabilitySummary: FinancialDimensionSummary;
  integrationVerification: IntegrationVerification;
  q1108ContractConsumed: Q1108ContractConsumption;
  decision: ReadinessDecision;
  outstandingRisks: string[];
  validation: FinartValidationReport;
  workerId: string;
  consumableByQ1109: boolean;
};

export function buildReport(params: BuildReportParams): FinancialReadinessAuditReport {
  const now = new Date().toISOString();
  const confidenceScore = computeConfidenceScore(params.financialReadinessSummary);
  const auditStatus = mapDecisionToAuditStatus(
    params.decision,
    params.validation.decision,
    params.financialReadinessSummary,
  );

  return {
    reportId: params.reportId?.trim() || nextReportId(),
    timestamp: now,
    auditVersion: FINANCIAL_READINESS_AUDIT_RUNTIME_VERSION,
    engineId: "PILLOW-FINART-001",
    missionId: "Q11-08",
    totalFinancialComponents: params.financialReadinessSummary.totalComponents,
    certifiedComponents: params.financialReadinessSummary.certifiedCount,
    partiallyCertifiedComponents: params.financialReadinessSummary.partiallyCertifiedCount,
    failedComponents: params.financialReadinessSummary.failedCount,
    missingComponents: params.financialReadinessSummary.missingCount,
    blockedComponents: params.financialReadinessSummary.blockedCount,
    deferredComponents: params.financialReadinessSummary.deferredCount,
    financialReadinessSummary: params.financialReadinessSummary,
    paymentWorkflowSummary: params.paymentWorkflowSummary,
    revenueRecordingSummary: params.revenueRecordingSummary,
    expenseTrackingSummary: params.expenseTrackingSummary,
    accountingRecordsSummary: params.accountingRecordsSummary,
    financialReportingSummary: params.financialReportingSummary,
    costControlSummary: params.costControlSummary,
    financialGovernanceSummary: params.financialGovernanceSummary,
    auditTraceabilitySummary: params.auditTraceabilitySummary,
    integrationSummary: params.integrationVerification,
    governanceSummary: params.governanceSummary,
    outstandingRisks: params.outstandingRisks,
    supportingEvidence: [
      ...params.financialReadinessSummary.evidence,
      ...params.governanceSummary.evidence,
      ...params.integrationVerification.evidence,
    ],
    confidenceScore,
    metadataVersion: FINART_METADATA_VERSION,
    reportVersion: FINANCIAL_READINESS_AUDIT_REPORT_VERSION,
    workerId: params.workerId,
    findings: params.outstandingRisks,
    assessments: params.assessments,
    decision: params.decision,
    auditStatus,
    validation: params.validation,
    componentInventory: params.componentInventory,
    q1108ContractConsumed: params.q1108ContractConsumed,
    consumableByQ1109: params.consumableByQ1109,
    neverImplementQ1109OrLater: true,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    eighthQ11Gate: true,
    submittedToExecutiveReporting: false,
    executiveReportId: null,
    traceabilityRefs: [
      "q11-08:financial-readiness-audit",
      "q11-07:recovery-audit",
      "pillow:financial-readiness-gate",
    ],
    runTimestamp: now,
    preserveCompleteTraceability: true,
    preserveImmutableFinancialHistory: true,
    preserveAuditHistory: true,
    deterministicAuditBehaviour: true,
    maskSensitiveValues: true,
    neverFabricateFinancialEvidence: true,
    neverCertifyUnverifiedFinancialCapability: true,
    neverExecuteFinancialTransactions: true,
    neverModifyAccountingRecords: true,
    neverAssumeImplementation: true,
    neverRepairFailedFinancialComponents: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
  };
}

export function buildCatalog(
  workerId: string,
  reports: FinancialReadinessAuditReport[],
  integrations: IntegrationHandshake[],
): FinartCatalog {
  return {
    reportVersion: FINANCIAL_READINESS_AUDIT_REPORT_VERSION,
    workerId,
    reports: reports.map((r) => ({ ...r })),
    integrations: integrations.map((h) => ({ ...h })),
    metadataVersion: FINART_METADATA_VERSION,
    executiveAuthority: "pillow",
    neverFabricateFinancialEvidence: true,
    neverAssumeImplementation: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1109OrLater: true,
    eighthQ11Gate: true,
  };
}
