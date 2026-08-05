import type { FinancialReadinessAuditReport } from "./types.js";

let reportSeq = 0;

export function nextReportId() {
  reportSeq += 1;
  return `finart-rpt-${String(reportSeq).padStart(4, "0")}`;
}

export function resetFinartSequenceForTesting() {
  reportSeq = 0;
}

function cloneReport(report: FinancialReadinessAuditReport): FinancialReadinessAuditReport {
  return {
    ...report,
    supportingEvidence: [...report.supportingEvidence],
    outstandingRisks: [...report.outstandingRisks],
    financialReadinessSummary: {
      ...report.financialReadinessSummary,
      notes: [...report.financialReadinessSummary.notes],
      evidence: [...report.financialReadinessSummary.evidence],
    },
    paymentWorkflowSummary: { ...report.paymentWorkflowSummary, evidence: [...report.paymentWorkflowSummary.evidence] },
    revenueRecordingSummary: { ...report.revenueRecordingSummary, evidence: [...report.revenueRecordingSummary.evidence] },
    expenseTrackingSummary: { ...report.expenseTrackingSummary, evidence: [...report.expenseTrackingSummary.evidence] },
    accountingRecordsSummary: { ...report.accountingRecordsSummary, evidence: [...report.accountingRecordsSummary.evidence] },
    financialReportingSummary: { ...report.financialReportingSummary, evidence: [...report.financialReportingSummary.evidence] },
    costControlSummary: { ...report.costControlSummary, evidence: [...report.costControlSummary.evidence] },
    financialGovernanceSummary: { ...report.financialGovernanceSummary, evidence: [...report.financialGovernanceSummary.evidence] },
    auditTraceabilitySummary: { ...report.auditTraceabilitySummary, evidence: [...report.auditTraceabilitySummary.evidence] },
    governanceSummary: { ...report.governanceSummary, evidence: [...report.governanceSummary.evidence] },
    q1108ContractConsumed: { ...report.q1108ContractConsumed, fields: [...report.q1108ContractConsumed.fields] },
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
    neverImplementQ1109OrLater: true,
    eighthQ11Gate: true,
  };
}

export class AuditStore {
  private readonly reports = new Map<string, FinancialReadinessAuditReport>();
  private latestReportId: string | null = null;
  private readonly auditTrail: Array<{
    timestamp: string;
    entityId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: FinancialReadinessAuditReport[]) {
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

  saveReport(report: FinancialReadinessAuditReport, action = "produce_report") {
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

  getFinancialHistory(limit = 100) {
    return this.listReports()
      .slice(-limit)
      .flatMap((report) => report.assessments.map((row) => ({ ...row })));
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }
}
