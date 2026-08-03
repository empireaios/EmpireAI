import type { MarketResearchReport } from "./types.js";

/** Authoritative in-memory Market Research Report store — research only. */
export class ResearchStore {
  private reports = new Map<string, MarketResearchReport>();
  private latestReportId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    reportId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: MarketResearchReport[]) {
    this.reports.clear();
    this.latestReportId = null;
    this.auditTrail = [];
    for (const report of reports) {
      this.reports.set(report.reportId, clone(report));
      this.latestReportId = report.reportId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        reportId: report.reportId,
        action: "seed",
        details: `seeded report for mission=${report.businessBuildMissionId}`,
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

  get(reportId: string) {
    const report = this.reports.get(reportId);
    return report ? clone(report) : null;
  }

  getLatestReportId() {
    return this.latestReportId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  save(report: MarketResearchReport, action = "save") {
    this.reports.set(report.reportId, clone(report));
    this.latestReportId = report.reportId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      reportId: report.reportId,
      action,
      details: `confidence=${report.confidenceScore} type=${report.businessType}`,
    });
    return clone(report);
  }

  markSubmitted(reportId: string, executiveReportId: string) {
    const current = this.reports.get(reportId);
    if (!current) return null;
    const updated: MarketResearchReport = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.save(updated, "submit_findings");
  }
}

function clone(report: MarketResearchReport): MarketResearchReport {
  return {
    ...report,
    customerProblems: [...report.customerProblems],
    customerSegments: [...report.customerSegments],
    industryTrends: [...report.industryTrends],
    barriersToEntry: [...report.barriersToEntry],
    recommendations: [...report.recommendations],
    missingInformation: [...report.missingInformation],
    facts: [...report.facts],
    assumptions: [...report.assumptions],
    supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
    competitorAnalysis: report.competitorAnalysis.map((c) => ({
      ...c,
      strengths: [...c.strengths],
      weaknesses: [...c.weaknesses],
    })),
    risks: report.risks.map((r) => ({ ...r })),
    marketDemand: {
      ...report.marketDemand,
      demandSignals: [...report.marketDemand.demandSignals],
      facts: [...report.marketDemand.facts],
      assumptions: [...report.marketDemand.assumptions],
    },
    marketSize: {
      ...report.marketSize,
      facts: [...report.marketSize.facts],
      assumptions: [...report.marketSize.assumptions],
    },
    opportunitySize: {
      ...report.opportunitySize,
      facts: [...report.opportunitySize.facts],
      assumptions: [...report.opportunitySize.assumptions],
    },
  };
}
