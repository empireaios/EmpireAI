import type { PillowCommandAuditReport } from "./types.js";

let reportSeq = 0;

export function nextReportId() {
  reportSeq += 1;
  return `pcart-rpt-${String(reportSeq).padStart(4, "0")}`;
}

export function resetPcartSequenceForTesting() {
  reportSeq = 0;
}

function cloneReport(report: PillowCommandAuditReport): PillowCommandAuditReport {
  return {
    ...report,
    supportingEvidence: [...report.supportingEvidence],
    outstandingIssues: [...report.outstandingIssues],
    communicationSummary: { ...report.communicationSummary, evidence: [...report.communicationSummary.evidence] },
    assignmentSummary: { ...report.assignmentSummary, evidence: [...report.assignmentSummary.evidence] },
    supervisionSummary: { ...report.supervisionSummary, evidence: [...report.supervisionSummary.evidence] },
    governanceSummary: { ...report.governanceSummary, evidence: [...report.governanceSummary.evidence] },
    commandReadinessSummary: {
      ...report.commandReadinessSummary,
      notes: [...report.commandReadinessSummary.notes],
      evidence: [...report.commandReadinessSummary.evidence],
    },
    q1103ContractConsumed: { ...report.q1103ContractConsumed, fields: [...report.q1103ContractConsumed.fields] },
    workerInventory: report.workerInventory.map((w) => ({
      ...w,
      reportingLine: [...w.reportingLine],
      skillProfile: [...w.skillProfile],
      approvedTools: [...w.approvedTools],
    })),
    commandMatrix: report.commandMatrix.map((r) => ({ ...r, supportingEvidence: [...r.supportingEvidence] })),
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
    neverCertifyUnverifiedCommandCapability: true,
    neverAssumeImplementation: true,
    neverModifyWorkerImplementations: true,
    neverRepairFailedWorkers: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1104OrLater: true,
    firstPillowCommandGate: true,
  };
}

export class AuditStore {
  private readonly reports = new Map<string, PillowCommandAuditReport>();
  private latestReportId: string | null = null;
  private readonly auditTrail: Array<{
    timestamp: string;
    entityId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: PillowCommandAuditReport[]) {
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
        details: `seeded report decision=${report.commandReadinessDecision}`,
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

  saveReport(report: PillowCommandAuditReport, action = "produce_report") {
    this.reports.set(report.reportId, cloneReport(report));
    this.latestReportId = report.reportId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      entityId: report.reportId,
      action,
      details: `decision=${report.commandReadinessDecision} confidence=${report.confidenceScore}`,
    });
    return this.getReport(report.reportId)!;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }
}
