import type { BusinessFactoryAuditReport } from "./types.js";

let reportSeq = 0;

export function nextReportId() {
  reportSeq += 1;
  return `bfart-rpt-${String(reportSeq).padStart(4, "0")}`;
}

export function resetBfartSequenceForTesting() {
  reportSeq = 0;
}

function cloneReport(report: BusinessFactoryAuditReport): BusinessFactoryAuditReport {
  return {
    ...report,
    supportingEvidence: [...report.supportingEvidence],
    outstandingIssues: [...report.outstandingIssues],
    workflowSummary: { ...report.workflowSummary, evidence: [...report.workflowSummary.evidence] },
    runtimeSummary: { ...report.runtimeSummary, evidence: [...report.runtimeSummary.evidence] },
    governanceSummary: { ...report.governanceSummary, evidence: [...report.governanceSummary.evidence] },
    factoryReadinessSummary: {
      ...report.factoryReadinessSummary,
      notes: [...report.factoryReadinessSummary.notes],
      evidence: [...report.factoryReadinessSummary.evidence],
    },
    q1104ContractConsumed: { ...report.q1104ContractConsumed, fields: [...report.q1104ContractConsumed.fields] },
    factoryInventory: report.factoryInventory.map((f) => ({ ...f })),
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
    neverImplementQ1105OrLater: true,
    fourthQ11Gate: true,
  };
}

export class AuditStore {
  private readonly reports = new Map<string, BusinessFactoryAuditReport>();
  private latestReportId: string | null = null;
  private readonly auditTrail: Array<{
    timestamp: string;
    entityId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: BusinessFactoryAuditReport[]) {
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

  saveReport(report: BusinessFactoryAuditReport, action = "produce_report") {
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

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }
}
