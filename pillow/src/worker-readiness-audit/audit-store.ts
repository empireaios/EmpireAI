import type { WorkerReadinessAuditReport } from "./types.js";

let reportSeq = 0;

export function nextReportId() {
  reportSeq += 1;
  return `wrart-rpt-${String(reportSeq).padStart(4, "0")}`;
}

export function resetWrartSequenceForTesting() {
  reportSeq = 0;
}

function cloneReport(report: WorkerReadinessAuditReport): WorkerReadinessAuditReport {
  return {
    ...report,
    supportingEvidence: [...report.supportingEvidence],
    outstandingIssues: [...report.outstandingIssues],
    governanceSummary: { ...report.governanceSummary, evidence: [...report.governanceSummary.evidence] },
    runtimeSummary: { ...report.runtimeSummary, evidence: [...report.runtimeSummary.evidence] },
    capabilitySummary: { ...report.capabilitySummary, evidence: [...report.capabilitySummary.evidence] },
    readinessSummary: {
      ...report.readinessSummary,
      notes: [...report.readinessSummary.notes],
      evidence: [...report.readinessSummary.evidence],
    },
    q1102ContractConsumed: { ...report.q1102ContractConsumed, fields: [...report.q1102ContractConsumed.fields] },
    workerInventory: report.workerInventory.map((w) => ({
      ...w,
      reportingLine: [...w.reportingLine],
      skillProfile: [...w.skillProfile],
      approvedTools: [...w.approvedTools],
    })),
    readinessMatrix: report.readinessMatrix.map((r) => ({ ...r, supportingEvidence: [...r.supportingEvidence] })),
    integrationSummary: {
      ...report.integrationSummary,
      rows: report.integrationSummary.rows.map((r) => ({ ...r })),
      evidence: [...report.integrationSummary.evidence],
    },
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
    neverCertifyMissingWorkers: true,
    neverCertifyUnreachableWorkers: true,
    neverAssumeImplementation: true,
    neverModifyWorkerImplementations: true,
    neverRepairFailedWorkers: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1103OrLater: true,
    firstWorkerReadinessGate: true,
  };
}

export class AuditStore {
  private readonly reports = new Map<string, WorkerReadinessAuditReport>();
  private latestReportId: string | null = null;
  private readonly auditTrail: Array<{
    timestamp: string;
    entityId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: WorkerReadinessAuditReport[]) {
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
        details: `seeded report decision=${report.readinessDecision}`,
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

  saveReport(report: WorkerReadinessAuditReport, action = "produce_report") {
    this.reports.set(report.reportId, cloneReport(report));
    this.latestReportId = report.reportId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      entityId: report.reportId,
      action,
      details: `decision=${report.readinessDecision} confidence=${report.confidenceScore}`,
    });
    return this.getReport(report.reportId)!;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }
}
