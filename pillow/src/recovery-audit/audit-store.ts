import type { RecoveryAuditReport } from "./types.js";

let reportSeq = 0;

export function nextReportId() {
  reportSeq += 1;
  return `recart-rpt-${String(reportSeq).padStart(4, "0")}`;
}

export function resetRecartSequenceForTesting() {
  reportSeq = 0;
}

function cloneReport(report: RecoveryAuditReport): RecoveryAuditReport {
  return {
    ...report,
    supportingEvidence: [...report.supportingEvidence],
    outstandingRisks: [...report.outstandingRisks],
    recoverySummary: {
      ...report.recoverySummary,
      notes: [...report.recoverySummary.notes],
      evidence: [...report.recoverySummary.evidence],
    },
    failureDetectionSummary: { ...report.failureDetectionSummary, evidence: [...report.failureDetectionSummary.evidence] },
    restartSummary: { ...report.restartSummary, evidence: [...report.restartSummary.evidence] },
    rollbackSummary: { ...report.rollbackSummary, evidence: [...report.rollbackSummary.evidence] },
    checkpointSummary: { ...report.checkpointSummary, evidence: [...report.checkpointSummary.evidence] },
    escalationSummary: { ...report.escalationSummary, evidence: [...report.escalationSummary.evidence] },
    resilienceSummary: { ...report.resilienceSummary, evidence: [...report.resilienceSummary.evidence] },
    governanceSummary: { ...report.governanceSummary, evidence: [...report.governanceSummary.evidence] },
    q1107ContractConsumed: { ...report.q1107ContractConsumed, fields: [...report.q1107ContractConsumed.fields] },
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
    neverImplementQ1108OrLater: true,
    seventhQ11Gate: true,
  };
}

export class AuditStore {
  private readonly reports = new Map<string, RecoveryAuditReport>();
  private latestReportId: string | null = null;
  private readonly auditTrail: Array<{
    timestamp: string;
    entityId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: RecoveryAuditReport[]) {
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

  saveReport(report: RecoveryAuditReport, action = "produce_report") {
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

  getRecoveryHistory(limit = 100) {
    return this.listReports()
      .slice(-limit)
      .flatMap((report) => report.assessments.map((row) => ({ ...row })));
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }
}
