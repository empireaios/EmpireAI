import type { MediaAnalyticsReport } from "./types.js";

/** Authoritative in-memory media analytics report store — structural signals only. */
export class AnalyticsStore {
  private reports = new Map<string, MediaAnalyticsReport>();
  private latestAnalyticsReportId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    analyticsReportId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: MediaAnalyticsReport[]) {
    this.reports.clear();
    this.latestAnalyticsReportId = null;
    this.auditTrail = [];
    for (const report of reports) {
      this.reports.set(report.analyticsReportId, clone(report));
      this.latestAnalyticsReportId = report.analyticsReportId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        analyticsReportId: report.analyticsReportId,
        action: "seed",
        details: `seeded analyticsReport=${report.analyticsReportId} media=${report.mediaId}`,
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

  get(analyticsReportId: string) {
    const report = this.reports.get(analyticsReportId);
    return report ? clone(report) : null;
  }

  getByMediaId(mediaId: string) {
    return this.list().find((r) => r.mediaId === mediaId) ?? null;
  }

  getLatestAnalyticsReportId() {
    return this.latestAnalyticsReportId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  save(report: MediaAnalyticsReport, action = "save") {
    this.reports.set(report.analyticsReportId, clone(report));
    this.latestAnalyticsReportId = report.analyticsReportId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      analyticsReportId: report.analyticsReportId,
      action,
      details: `media=${report.mediaId} platform=${report.platform} confidence=${report.confidenceScore}`,
    });
    return clone(report);
  }

  markSubmitted(analyticsReportId: string, executiveReportId: string) {
    const current = this.reports.get(analyticsReportId);
    if (!current) return null;
    const updated: MediaAnalyticsReport = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.save(updated, "submit_report");
  }
}

function clone(report: MediaAnalyticsReport): MediaAnalyticsReport {
  return {
    ...report,
    views: { ...report.views },
    impressions: { ...report.impressions },
    clickThroughRate: { ...report.clickThroughRate },
    watchTime: { ...report.watchTime },
    retentionMetrics: { ...report.retentionMetrics },
    subscriberImpact: { ...report.subscriberImpact },
    engagementMetrics: { ...report.engagementMetrics },
    revenueMetrics: { ...report.revenueMetrics },
    performancePatterns: report.performancePatterns.map((p) => ({
      ...p,
      evidenceRefs: [...p.evidenceRefs],
    })),
    comparisons: report.comparisons.map((c) => ({
      ...c,
      metricsCompared: [...c.metricsCompared],
    })),
    metricTraceabilityRefs: [...report.metricTraceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
    historicalSnapshotIds: [...report.historicalSnapshotIds],
  };
}
