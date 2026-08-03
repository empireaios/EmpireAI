import type { TrendResearchReport } from "./types.js";

/** Authoritative in-memory trend store — research tracking only. */
export class TrendStore {
  private reports = new Map<string, TrendResearchReport>();
  private latestTrendReportId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    trendReportId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: TrendResearchReport[]) {
    this.reports.clear();
    this.latestTrendReportId = null;
    this.auditTrail = [];
    for (const report of reports) {
      this.reports.set(report.trendReportId, clone(report));
      this.latestTrendReportId = report.trendReportId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        trendReportId: report.trendReportId,
        action: "seed",
        details: `seeded report=${report.trendReportId} topic=${report.trendTopic} direction=${report.trendDirection}`,
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

  get(trendReportId: string) {
    const report = this.reports.get(trendReportId);
    return report ? clone(report) : null;
  }

  getLatestTrendReportId() {
    return this.latestTrendReportId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  save(report: TrendResearchReport, action = "save") {
    this.reports.set(report.trendReportId, clone(report));
    this.latestTrendReportId = report.trendReportId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      trendReportId: report.trendReportId,
      action,
      details: `topic=${report.trendTopic} direction=${report.trendDirection} confidence=${report.confidenceScore} priority=${report.recommendedPriority}`,
    });
    return clone(report);
  }

  markSubmitted(trendReportId: string, executiveReportId: string) {
    const current = this.reports.get(trendReportId);
    if (!current) return null;
    const updated: TrendResearchReport = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.save(updated, "submit_report");
  }
}

function clone(report: TrendResearchReport): TrendResearchReport {
  return {
    ...report,
    searchDemand: { ...report.searchDemand },
    socialSignals: { ...report.socialSignals },
    competitorActivity: { ...report.competitorActivity },
    currentEventRelevance: { ...report.currentEventRelevance },
    audienceBehaviour: report.audienceBehaviour ? { ...report.audienceBehaviour } : undefined,
    supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
    evidenceKinds: [...report.evidenceKinds],
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
  };
}
