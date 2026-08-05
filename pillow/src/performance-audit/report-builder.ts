import { nextReportId } from "./audit-store.js";
import {
  PERFART_METADATA_VERSION,
  PERFORMANCE_AUDIT_REPORT_VERSION,
  PERFORMANCE_AUDIT_RUNTIME_VERSION,
} from "./paths.js";
import type {
  AuditStatus,
  BenchmarkResult,
  BenchmarkSummary,
  BottleneckSummary,
  DiscoveredPerformanceComponentRecord,
  GovernanceSummary,
  IntegrationHandshake,
  IntegrationVerification,
  PerfartCatalog,
  PerfartValidationReport,
  PerformanceAuditReport,
  PerformanceReadinessSummary,
  Q1106ContractConsumption,
  ReadinessDecision,
  ResourceUtilisationSummary,
  SegmentPerformanceSummary,
  SustainedStabilitySummary,
} from "./types.js";

export function computeConfidenceScore(performanceReadinessSummary: PerformanceReadinessSummary): number {
  return performanceReadinessSummary.overallReadinessScore;
}

export function buildOutstandingIssues(
  matrix: BenchmarkResult[],
  governanceSummary: GovernanceSummary,
  integrationVerification: IntegrationVerification,
  performanceReadinessSummary: PerformanceReadinessSummary,
  bottleneckSummary: BottleneckSummary,
): string[] {
  const outstandingIssues: string[] = [];

  for (const row of matrix) {
    if (row.performanceClassification === "missing") {
      outstandingIssues.push(`${row.componentId}: missing structural evidence — ${row.supportingEvidence.join("; ")}`);
    } else if (row.performanceClassification === "failed") {
      outstandingIssues.push(`${row.componentId}: failed performance benchmark — ${row.supportingEvidence.join("; ")}`);
    } else if (row.performanceClassification === "partially_certified") {
      outstandingIssues.push(`${row.componentId}: partially certified — ${row.supportingEvidence.join("; ")}`);
    } else if (row.performanceClassification === "blocked") {
      outstandingIssues.push(`${row.componentId}: blocked — ${row.supportingEvidence.join("; ")}`);
    } else if (row.performanceClassification === "deferred") {
      outstandingIssues.push(`${row.componentId}: deferred — ${row.supportingEvidence.join("; ")}`);
    }
  }

  if (bottleneckSummary.totalBottlenecks > 0) {
    outstandingIssues.push(`Bottlenecks detected: ${bottleneckSummary.totalBottlenecks} — ${bottleneckSummary.evidence.join("; ")}`);
  }
  if (!governanceSummary.compliant) {
    outstandingIssues.push(`Governance: ${governanceSummary.evidence.join("; ")}`);
  }
  if (!integrationVerification.allBound) {
    outstandingIssues.push(
      `Integration incomplete: ${integrationVerification.boundCount}/${integrationVerification.totalTargets} targets bound`,
    );
  }
  if (!performanceReadinessSummary.allCertified) {
    outstandingIssues.push(
      `Performance readiness incomplete: ${performanceReadinessSummary.certifiedCount}/${performanceReadinessSummary.totalComponents} components certified`,
    );
  }

  return outstandingIssues;
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
  summary: PerformanceReadinessSummary,
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
  componentInventory: DiscoveredPerformanceComponentRecord[];
  assessments: BenchmarkResult[];
  governanceSummary: GovernanceSummary;
  benchmarkSummary: BenchmarkSummary;
  workerPerformanceSummary: SegmentPerformanceSummary;
  factoryPerformanceSummary: SegmentPerformanceSummary;
  runtimePerformanceSummary: SegmentPerformanceSummary;
  apiPerformanceSummary: SegmentPerformanceSummary;
  queuePerformanceSummary: SegmentPerformanceSummary;
  bottleneckSummary: BottleneckSummary;
  resourceUtilisationSummary: ResourceUtilisationSummary;
  sustainedStabilitySummary: SustainedStabilitySummary;
  integrationVerification: IntegrationVerification;
  performanceReadinessSummary: PerformanceReadinessSummary;
  q1106ContractConsumed: Q1106ContractConsumption;
  decision: ReadinessDecision;
  outstandingIssues: string[];
  validation: PerfartValidationReport;
  workerId: string;
  consumableByQ1107: boolean;
};

export function buildReport(params: BuildReportParams): PerformanceAuditReport {
  const now = new Date().toISOString();
  const confidenceScore = computeConfidenceScore(params.performanceReadinessSummary);
  const auditStatus = mapDecisionToAuditStatus(
    params.decision,
    params.validation.decision,
    params.performanceReadinessSummary,
  );

  return {
    reportId: params.reportId?.trim() || nextReportId(),
    timestamp: now,
    auditVersion: PERFORMANCE_AUDIT_RUNTIME_VERSION,
    engineId: "PILLOW-PERFART-001",
    missionId: "Q11-06",
    totalPerformanceComponents: params.performanceReadinessSummary.totalComponents,
    certifiedComponents: params.performanceReadinessSummary.certifiedCount,
    partiallyCertifiedComponents: params.performanceReadinessSummary.partiallyCertifiedCount,
    failedComponents: params.performanceReadinessSummary.failedCount,
    missingComponents: params.performanceReadinessSummary.missingCount,
    blockedComponents: params.performanceReadinessSummary.blockedCount,
    deferredComponents: params.performanceReadinessSummary.deferredCount,
    benchmarkSummary: params.benchmarkSummary,
    workerPerformanceSummary: params.workerPerformanceSummary,
    factoryPerformanceSummary: params.factoryPerformanceSummary,
    runtimePerformanceSummary: params.runtimePerformanceSummary,
    apiPerformanceSummary: params.apiPerformanceSummary,
    queuePerformanceSummary: params.queuePerformanceSummary,
    bottleneckSummary: params.bottleneckSummary,
    resourceUtilisationSummary: params.resourceUtilisationSummary,
    sustainedStabilitySummary: params.sustainedStabilitySummary,
    integrationSummary: params.integrationVerification,
    governanceSummary: params.governanceSummary,
    outstandingIssues: params.outstandingIssues,
    supportingEvidence: params.assessments.flatMap((row) =>
      row.supportingEvidence.map((e) => `${row.componentId}: ${e}`),
    ),
    confidenceScore,
    metadataVersion: PERFART_METADATA_VERSION,
    reportVersion: PERFORMANCE_AUDIT_REPORT_VERSION,
    workerId: params.workerId,
    findings: params.assessments.map((row) => `${row.componentId}: ${row.performanceClassification}`),
    assessments: params.assessments,
    decision: params.decision,
    auditStatus,
    validation: params.validation,
    performanceReadinessSummary: params.performanceReadinessSummary,
    componentInventory: params.componentInventory,
    q1106ContractConsumed: params.q1106ContractConsumed,
    consumableByQ1107: params.consumableByQ1107,
    neverImplementQ1107OrLater: true,
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    sixthQ11Gate: true,
    submittedToExecutiveReporting: false,
    executiveReportId: null,
    traceabilityRefs: [
      "q11-06:performance-audit",
      "q11-05:security-audit",
      ...params.assessments.map(
        (row) => `component:${row.componentId}:classification:${row.performanceClassification}`,
      ),
    ],
    runTimestamp: now,
    preserveCompleteTraceability: true,
    preserveImmutableBenchmarkHistory: true,
    preserveAuditHistory: true,
    deterministicAuditBehaviour: true,
    maskSensitiveValues: true,
    neverFabricatePerformanceEvidence: true,
    neverCertifyUntestedPerformance: true,
    neverOptimizeOrModifyProductionSystems: true,
    neverAssumeImplementation: true,
    neverModifyPerformanceImplementations: true,
    neverRepairFailedPerformanceComponents: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
  };
}

export function buildCatalog(
  workerId: string,
  reports: PerformanceAuditReport[],
  integrations: IntegrationHandshake[],
): PerfartCatalog {
  return {
    reportVersion: PERFORMANCE_AUDIT_REPORT_VERSION,
    workerId,
    reports: reports.map((r) => ({ ...r })),
    integrations: integrations.map((i) => ({ ...i })),
    metadataVersion: PERFART_METADATA_VERSION,
    executiveAuthority: "pillow",
    neverFabricatePerformanceEvidence: true,
    neverAssumeImplementation: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1107OrLater: true,
    sixthQ11Gate: true,
  };
}
