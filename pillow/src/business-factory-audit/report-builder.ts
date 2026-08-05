import { nextReportId } from "./audit-store.js";
import {
  BFART_METADATA_VERSION,
  BUSINESS_FACTORY_AUDIT_REPORT_VERSION,
  BUSINESS_FACTORY_AUDIT_RUNTIME_VERSION,
} from "./paths.js";
import type {
  AuditStatus,
  BfartCatalog,
  BfartValidationReport,
  BusinessFactoryAssessment,
  BusinessFactoryAuditReport,
  DiscoveredFactoryRecord,
  FactoryReadinessSummary,
  GovernanceSummary,
  IntegrationHandshake,
  IntegrationVerification,
  Q1104ContractConsumption,
  ReadinessDecision,
  RuntimeSummary,
  WorkflowSummary,
} from "./types.js";

export function computeConfidenceScore(factoryReadinessSummary: FactoryReadinessSummary): number {
  return factoryReadinessSummary.overallReadinessScore;
}

export function buildOutstandingIssues(
  matrix: BusinessFactoryAssessment[],
  governanceSummary: GovernanceSummary,
  integrationVerification: IntegrationVerification,
  factoryReadinessSummary: FactoryReadinessSummary,
): string[] {
  const outstandingIssues: string[] = [];

  for (const row of matrix) {
    if (row.readinessClassification === "failed") {
      outstandingIssues.push(`${row.factoryId}: failed business factory readiness — ${row.supportingEvidence.join("; ")}`);
    } else if (row.readinessClassification === "missing") {
      outstandingIssues.push(`${row.factoryId}: missing structural evidence — ${row.supportingEvidence.join("; ")}`);
    } else if (row.readinessClassification === "partially_certified") {
      outstandingIssues.push(`${row.factoryId}: partially certified — ${row.supportingEvidence.join("; ")}`);
    } else if (row.readinessClassification === "blocked") {
      outstandingIssues.push(`${row.factoryId}: blocked — ${row.supportingEvidence.join("; ")}`);
    } else if (row.readinessClassification === "deferred") {
      outstandingIssues.push(`${row.factoryId}: deferred — ${row.supportingEvidence.join("; ")}`);
    }
  }

  if (!governanceSummary.compliant) {
    outstandingIssues.push(`Governance: ${governanceSummary.evidence.join("; ")}`);
  }
  if (!integrationVerification.allBound) {
    outstandingIssues.push(
      `Integration incomplete: ${integrationVerification.boundCount}/${integrationVerification.totalTargets} targets bound`,
    );
  }
  if (!factoryReadinessSummary.allCertified) {
    outstandingIssues.push(
      `Business factory readiness incomplete: ${factoryReadinessSummary.certifiedCount}/${factoryReadinessSummary.totalFactories} factories certified`,
    );
  }

  return outstandingIssues;
}

/**
 * Maps the overall readiness decision onto the richer AUDIT_STATUSES
 * catalog using the per-factory classification counts as evidence — a
 * decision alone (certify | withhold | escalate | defer) cannot
 * distinguish "missing" from "partially_certified", so the most severe
 * non-zero classification present in the audited matrix is surfaced.
 */
export function mapDecisionToAuditStatus(
  decision: ReadinessDecision,
  validationDecision: "pass" | "partial" | "fail",
  summary: FactoryReadinessSummary,
): AuditStatus {
  if (validationDecision === "fail") return "rejected";
  if (summary.totalFactories === 0) return "missing";
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
  factoryInventory: DiscoveredFactoryRecord[];
  assessments: BusinessFactoryAssessment[];
  governanceSummary: GovernanceSummary;
  workflowSummary: WorkflowSummary;
  runtimeSummary: RuntimeSummary;
  integrationVerification: IntegrationVerification;
  factoryReadinessSummary: FactoryReadinessSummary;
  q1104ContractConsumed: Q1104ContractConsumption;
  decision: ReadinessDecision;
  outstandingIssues: string[];
  validation: BfartValidationReport;
  workerId: string;
  consumableByQ1105: boolean;
};

export function buildReport(params: BuildReportParams): BusinessFactoryAuditReport {
  const now = new Date().toISOString();
  const confidenceScore = computeConfidenceScore(params.factoryReadinessSummary);
  const auditStatus = mapDecisionToAuditStatus(params.decision, params.validation.decision, params.factoryReadinessSummary);

  return {
    reportId: params.reportId?.trim() || nextReportId(),
    timestamp: now,
    auditVersion: BUSINESS_FACTORY_AUDIT_RUNTIME_VERSION,
    engineId: "PILLOW-BFART-001",
    missionId: "Q11-04",
    totalBusinessFactories: params.factoryReadinessSummary.totalFactories,
    certifiedFactories: params.factoryReadinessSummary.certifiedCount,
    partiallyCertifiedFactories: params.factoryReadinessSummary.partiallyCertifiedCount,
    failedFactories: params.factoryReadinessSummary.failedCount,
    missingFactories: params.factoryReadinessSummary.missingCount,
    blockedFactories: params.factoryReadinessSummary.blockedCount,
    deferredFactories: params.factoryReadinessSummary.deferredCount,
    workflowSummary: params.workflowSummary,
    runtimeSummary: params.runtimeSummary,
    integrationSummary: params.integrationVerification,
    governanceSummary: params.governanceSummary,
    supportingEvidence: params.assessments.flatMap((row) =>
      row.supportingEvidence.map((e) => `${row.factoryId}: ${e}`),
    ),
    outstandingIssues: params.outstandingIssues,
    confidenceScore,
    metadataVersion: BFART_METADATA_VERSION,
    reportVersion: BUSINESS_FACTORY_AUDIT_REPORT_VERSION,
    workerId: params.workerId,
    findings: params.assessments.map(
      (row) => `${row.factoryId}: ${row.readinessClassification}`,
    ),
    assessments: params.assessments,
    decision: params.decision,
    auditStatus,
    validation: params.validation,
    factoryReadinessSummary: params.factoryReadinessSummary,
    factoryInventory: params.factoryInventory,
    q1104ContractConsumed: params.q1104ContractConsumed,
    consumableByQ1105: params.consumableByQ1105,
    neverImplementQ1105OrLater: true,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    fourthQ11Gate: true,
    submittedToExecutiveReporting: false,
    executiveReportId: null,
    traceabilityRefs: [
      "q11-04:business-factory-audit",
      "q11-03:pillow-command-audit",
      ...params.assessments.map(
        (row) => `factory:${row.factoryId}:classification:${row.readinessClassification}`,
      ),
    ],
    runTimestamp: now,
    preserveCompleteTraceability: true,
    preserveImmutableAuditHistory: true,
    preserveAuditHistory: true,
    deterministicAuditBehaviour: true,
    maskSensitiveValues: true,
    neverFabricateAuditEvidence: true,
    neverCertifyIncompleteWorkflows: true,
    neverCertifyMissingIntegrations: true,
    neverAssumeImplementation: true,
    neverModifyFactoryImplementations: true,
    neverRepairFailedFactories: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
  };
}

export function buildCatalog(
  workerId: string,
  reports: BusinessFactoryAuditReport[],
  integrations: IntegrationHandshake[],
): BfartCatalog {
  return {
    reportVersion: BUSINESS_FACTORY_AUDIT_REPORT_VERSION,
    workerId,
    reports: reports.map((r) => ({ ...r })),
    integrations: integrations.map((i) => ({ ...i })),
    metadataVersion: BFART_METADATA_VERSION,
    executiveAuthority: "pillow",
    neverFabricateAuditEvidence: true,
    neverAssumeImplementation: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1105OrLater: true,
    fourthQ11Gate: true,
  };
}
