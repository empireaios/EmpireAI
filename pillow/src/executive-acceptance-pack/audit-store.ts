import type { ExecutiveAcceptancePackReport } from "./types.js";

let reportSeq = 0;
let packSeq = 0;

export function nextReportId() {
  reportSeq += 1;
  return `eaprt-rpt-${String(reportSeq).padStart(4, "0")}`;
}

export function nextAcceptancePackId() {
  packSeq += 1;
  return `eaprt-pack-${String(packSeq).padStart(4, "0")}`;
}

export function resetEaprtSequenceForTesting() {
  reportSeq = 0;
  packSeq = 0;
}

function cloneReport(report: ExecutiveAcceptancePackReport): ExecutiveAcceptancePackReport {
  return {
    ...report,
    supportingEvidence: [...report.supportingEvidence],
    outstandingIssues: [...report.outstandingIssues],
    executiveChecklist: report.executiveChecklist.map((item) => ({
      ...item,
      evidence: [...item.evidence],
    })),
    certificationSummary: {
      ...report.certificationSummary,
      reports: report.certificationSummary.reports.map((r) => ({ ...r, evidence: [...r.evidence] })),
      evidence: [...report.certificationSummary.evidence],
    },
    auditSummary: {
      ...report.auditSummary,
      reports: report.auditSummary.reports.map((r) => ({ ...r, evidence: [...r.evidence] })),
      evidence: [...report.auditSummary.evidence],
    },
    productionReadinessSummary: {
      ...report.productionReadinessSummary,
      sources: report.productionReadinessSummary.sources.map((s) => ({
        ...s,
        evidence: [...s.evidence],
      })),
      evidence: [...report.productionReadinessSummary.evidence],
    },
    riskSummary: {
      ...report.riskSummary,
      criticalRisks: [...report.riskSummary.criticalRisks],
      moderateRisks: [...report.riskSummary.moderateRisks],
      lowRisks: [...report.riskSummary.lowRisks],
      evidence: [...report.riskSummary.evidence],
    },
    deploymentRecommendation: {
      ...report.deploymentRecommendation,
      rationale: [...report.deploymentRecommendation.rationale],
      evidence: [...report.deploymentRecommendation.evidence],
    },
    acceptancePack: {
      ...report.acceptancePack,
      outstandingIssues: [...report.acceptancePack.outstandingIssues],
      supportingEvidence: [...report.acceptancePack.supportingEvidence],
      executiveChecklist: report.acceptancePack.executiveChecklist.map((item) => ({
        ...item,
        evidence: [...item.evidence],
      })),
    },
    q1109ContractConsumed: {
      ...report.q1109ContractConsumed,
      fields: [...report.q1109ContractConsumed.fields],
    },
    integrationSummary: {
      ...report.integrationSummary,
      rows: report.integrationSummary.rows.map((r) => ({ ...r })),
      evidence: [...report.integrationSummary.evidence],
    },
    governanceSummary: {
      ...report.governanceSummary,
      evidence: [...report.governanceSummary.evidence],
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
    preserveImmutablePackHistory: true,
    preserveAuditHistory: true,
    deterministicPackBehaviour: true,
    maskSensitiveValues: true,
    neverFabricateAcceptanceEvidence: true,
    neverHideFailedAudits: true,
    neverApproveProductionDeployment: true,
    neverOverrideFailedCertifications: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1110OrLater: true,
    ninthQ11Gate: true,
  };
}

export class AuditStore {
  private readonly reports = new Map<string, ExecutiveAcceptancePackReport>();
  private latestReportId: string | null = null;
  private readonly auditTrail: Array<{
    timestamp: string;
    entityId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: ExecutiveAcceptancePackReport[]) {
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

  saveReport(report: ExecutiveAcceptancePackReport, action = "produce_report") {
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

  getPackHistory(limit = 100) {
    return this.listReports().slice(-limit).map((report) => ({ ...report.acceptancePack }));
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }
}
