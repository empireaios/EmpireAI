import type { DigitalProductAnalyticsReport } from "./types.js";

/** Authoritative in-memory analytics store — structural signals only. */
export class DigitalProductAnalyticsStore {
  private reports = new Map<string, DigitalProductAnalyticsReport>();
  private latestAnalyticsReportId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    analyticsReportId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: DigitalProductAnalyticsReport[]) {
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
        details: `seeded analytics=${report.analyticsReportId} title=${report.productTitle} type=${report.analyticsType}`,
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

  getLatestAnalyticsReportId() {
    return this.latestAnalyticsReportId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  save(report: DigitalProductAnalyticsReport, action = "save") {
    this.reports.set(report.analyticsReportId, clone(report));
    this.latestAnalyticsReportId = report.analyticsReportId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      analyticsReportId: report.analyticsReportId,
      action,
      details: `title=${report.productTitle} type=${report.analyticsType} confidence=${report.confidenceScore}`,
    });
    return clone(report);
  }

  markSubmitted(analyticsReportId: string, executiveReportId: string) {
    const current = this.reports.get(analyticsReportId);
    if (!current) return null;
    const updated: DigitalProductAnalyticsReport = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.save(updated, "submit_report");
  }
}

function clone(report: DigitalProductAnalyticsReport): DigitalProductAnalyticsReport {
  return {
    ...report,
    analyticsSteps: report.analyticsSteps.map((s) => ({ ...s })),
    supportedAnalyticsTypes: [...report.supportedAnalyticsTypes],
    improvementRecommendations: report.improvementRecommendations.map((r) => ({
      ...r,
      isRecommendation: true as const,
    })),
    selfReviewFindings: report.selfReviewFindings.map((f) => ({ ...f })),
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
    customerFeedbackSummary: {
      ...report.customerFeedbackSummary,
      themes: [...report.customerFeedbackSummary.themes],
    },
  };
}
