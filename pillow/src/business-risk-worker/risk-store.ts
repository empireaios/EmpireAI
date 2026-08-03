import type { BusinessRiskReport } from "./types.js";

/** Authoritative in-memory Business Risk Report store — assessment only. */
export class RiskStore {
  private reports = new Map<string, BusinessRiskReport>();
  private latestReportId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    riskReportId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: BusinessRiskReport[]) {
    this.reports.clear();
    this.latestReportId = null;
    this.auditTrail = [];
    for (const report of reports) {
      this.reports.set(report.riskReportId, clone(report));
      this.latestReportId = report.riskReportId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        riskReportId: report.riskReportId,
        action: "seed",
        details: `seeded risk report for mission=${report.businessBuildMissionId}`,
      });
    }
  }

  count() {
    return this.reports.size;
  }

  list() {
    return [...this.reports.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(clone);
  }

  get(riskReportId: string) {
    const report = this.reports.get(riskReportId);
    return report ? clone(report) : null;
  }

  getLatestReportId() {
    return this.latestReportId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  saveCanonical(report: BusinessRiskReport, action = "save") {
    for (const [id, existing] of this.reports) {
      if (
        existing.businessBuildMissionId === report.businessBuildMissionId &&
        id !== report.riskReportId
      ) {
        this.reports.delete(id);
        this.auditTrail.push({
          timestamp: new Date().toISOString(),
          riskReportId: id,
          action: "supersede",
          details: `superseded_by=${report.riskReportId}`,
        });
      }
    }
    this.reports.set(report.riskReportId, clone(report));
    this.latestReportId = report.riskReportId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      riskReportId: report.riskReportId,
      action,
      details: `risks=${report.risks.length} portfolio=${report.overallPortfolioRiskRating} high_or_critical=${report.highOrCriticalCount}`,
    });
    return clone(report);
  }

  markSubmitted(riskReportId: string, executiveReportId: string) {
    const current = this.reports.get(riskReportId);
    if (!current) return null;
    const updated: BusinessRiskReport = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.saveCanonical(updated, "submit_risk_report");
  }
}

function clone(report: BusinessRiskReport): BusinessRiskReport {
  return {
    ...report,
    risks: report.risks.map((risk) => ({
      ...risk,
      supportingEvidence: risk.supportingEvidence.map((e) => ({ ...e })),
    })),
    prioritizedRiskIds: [...report.prioritizedRiskIds],
    facts: [...report.facts],
    assumptions: [...report.assumptions],
    missingInformation: [...report.missingInformation],
    preservedDecisions: [...report.preservedDecisions],
    traceabilityRefs: [...report.traceabilityRefs],
  };
}
