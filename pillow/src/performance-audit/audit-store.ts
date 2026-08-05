import type { PerformanceAuditReport } from "./types.js";

let reportSeq = 0;

export function nextReportId() {
  reportSeq += 1;
  return `perfart-rpt-${String(reportSeq).padStart(4, "0")}`;
}

export function resetPerfartSequenceForTesting() {
  reportSeq = 0;
}

function cloneReport(report: PerformanceAuditReport): PerformanceAuditReport {
  return {
    ...report,
    supportingEvidence: [...report.supportingEvidence],
    outstandingIssues: [...report.outstandingIssues],
    benchmarkSummary: { ...report.benchmarkSummary, evidence: [...report.benchmarkSummary.evidence] },
    workerPerformanceSummary: { ...report.workerPerformanceSummary, evidence: [...report.workerPerformanceSummary.evidence] },
    factoryPerformanceSummary: { ...report.factoryPerformanceSummary, evidence: [...report.factoryPerformanceSummary.evidence] },
    runtimePerformanceSummary: { ...report.runtimePerformanceSummary, evidence: [...report.runtimePerformanceSummary.evidence] },
    apiPerformanceSummary: { ...report.apiPerformanceSummary, evidence: [...report.apiPerformanceSummary.evidence] },
    queuePerformanceSummary: report.queuePerformanceSummary
      ? { ...report.queuePerformanceSummary, evidence: [...report.queuePerformanceSummary.evidence] }
      : undefined,
    bottleneckSummary: {
      ...report.bottleneckSummary,
      rows: report.bottleneckSummary.rows.map((r) => ({ ...r, evidence: [...r.evidence] })),
      evidence: [...report.bottleneckSummary.evidence],
    },
    resourceUtilisationSummary: {
      ...report.resourceUtilisationSummary,
      rows: report.resourceUtilisationSummary.rows.map((r) => ({ ...r, evidence: [...r.evidence] })),
      evidence: [...report.resourceUtilisationSummary.evidence],
    },
    sustainedStabilitySummary: {
      ...report.sustainedStabilitySummary,
      rows: report.sustainedStabilitySummary.rows.map((r) => ({ ...r, samples: [...r.samples], evidence: [...r.evidence] })),
      evidence: [...report.sustainedStabilitySummary.evidence],
    },
    governanceSummary: { ...report.governanceSummary, evidence: [...report.governanceSummary.evidence] },
    performanceReadinessSummary: {
      ...report.performanceReadinessSummary,
      notes: [...report.performanceReadinessSummary.notes],
      evidence: [...report.performanceReadinessSummary.evidence],
    },
    q1106ContractConsumed: { ...report.q1106ContractConsumed, fields: [...report.q1106ContractConsumed.fields] },
    componentInventory: report.componentInventory.map((c) => ({ ...c })),
    assessments: report.assessments.map((r) => ({ ...r, supportingEvidence: [...r.supportingEvidence] })),
    integrationSummary: {
      ...report.integrationSummary,
      rows: report.integrationSummary.rows.map((r) => ({ ...r })),
      evidence: [...report.integrationSummary.evidence],
    },
    findings: [...report.findings],
    traceabilityRefs: [...report.traceabilityRefs],
    validation: {
      ...report.validation,
      errors: [...report.validation.errors],
      warnings: [...report.validation.warnings],
    },
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
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
    neverImplementQ1107OrLater: true,
    sixthQ11Gate: true,
  };
}

export class AuditStore {
  private readonly reports = new Map<string, PerformanceAuditReport>();
  private latestReportId: string | null = null;
  private readonly auditTrail: Array<{
    timestamp: string;
    entityId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: PerformanceAuditReport[]) {
    this.reports.clear();
    this.latestReportId = null;
    this.auditTrail.length = 0;
    for (const report of reports) {
      this.reports.set(report.reportId, cloneReport(report));
      this.latestReportId = report.reportId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        entityId: report.reportId,
        action: "seed",
        details: `seeded report decision=${report.decision}`,
      });
    }
  }

  reportCount() {
    return this.reports.size;
  }

  listReports() {
    return [...this.reports.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(cloneReport);
  }

  getReport(reportId: string) {
    const found = this.reports.get(reportId);
    return found ? cloneReport(found) : null;
  }

  getLatestReportId() {
    return this.latestReportId;
  }

  getLatestReport() {
    return this.latestReportId ? this.getReport(this.latestReportId) : null;
  }

  saveReport(report: PerformanceAuditReport, action = "produce_report") {
    this.reports.set(report.reportId, cloneReport(report));
    this.latestReportId = report.reportId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      entityId: report.reportId,
      action,
      details: `decision=${report.decision} confidence=${report.confidenceScore}`,
    });
    return this.getReport(report.reportId)!;
  }

  /** Preserves immutable benchmark history — the full assessments matrix of every produced report, never mutated in place. */
  getBenchmarkHistory(limit = 100) {
    return this.listReports()
      .slice(-limit)
      .flatMap((report) => report.assessments.map((row) => ({ ...row })));
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }
}
