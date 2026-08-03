import type { CommerceAnalyticsReport } from "./types.js";

/** Authoritative in-memory analytics store — intelligence tracking only. */
export class AnalyticsStore {
  private reports = new Map<string, CommerceAnalyticsReport>();
  private latestAnalyticsReportId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    analyticsReportId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: CommerceAnalyticsReport[]) {
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
        details: `seeded report=${report.analyticsReportId} product=${report.productId} classification=${report.productPerformanceClassification}`,
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

  save(report: CommerceAnalyticsReport, action = "save") {
    this.reports.set(report.analyticsReportId, clone(report));
    this.latestAnalyticsReportId = report.analyticsReportId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      analyticsReportId: report.analyticsReportId,
      action,
      details: `product=${report.productId} classification=${report.productPerformanceClassification} confidence=${report.confidenceScore} opportunities=${report.improvementOpportunities.length}`,
    });
    return clone(report);
  }

  markSubmitted(analyticsReportId: string, executiveReportId: string) {
    const current = this.reports.get(analyticsReportId);
    if (!current) return null;
    const updated: CommerceAnalyticsReport = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.save(updated, "submit_findings");
  }
}

function clone(report: CommerceAnalyticsReport): CommerceAnalyticsReport {
  return {
    ...report,
    salesMetrics: {
      ...report.salesMetrics,
      unitsSold: { ...report.salesMetrics.unitsSold },
      revenue: { ...report.salesMetrics.revenue },
      averageOrderValue: { ...report.salesMetrics.averageOrderValue },
    },
    conversionMetrics: {
      sessions: { ...report.conversionMetrics.sessions },
      orders: { ...report.conversionMetrics.orders },
      conversionRate: { ...report.conversionMetrics.conversionRate },
    },
    profitMetrics: {
      grossProfit: { ...report.profitMetrics.grossProfit },
      netProfit: { ...report.profitMetrics.netProfit },
      grossMarginPercent: { ...report.profitMetrics.grossMarginPercent },
      netMarginPercent: { ...report.profitMetrics.netMarginPercent },
    },
    customerIssueMetrics: {
      ...report.customerIssueMetrics,
      issueCount: { ...report.customerIssueMetrics.issueCount },
      issueRate: { ...report.customerIssueMetrics.issueRate },
      topIssueTypes: [...report.customerIssueMetrics.topIssueTypes],
    },
    refundMetrics: {
      refundCount: { ...report.refundMetrics.refundCount },
      refundRate: { ...report.refundMetrics.refundRate },
      refundAmount: { ...report.refundMetrics.refundAmount },
    },
    supplierPerformance: {
      ...report.supplierPerformance,
      onTimeRate: { ...report.supplierPerformance.onTimeRate },
      fulfilmentFailureRate: { ...report.supplierPerformance.fulfilmentFailureRate },
      stockAvailabilityScore: { ...report.supplierPerformance.stockAvailabilityScore },
      overallScore: { ...report.supplierPerformance.overallScore },
    },
    significantChanges: report.significantChanges.map((c) => ({ ...c })),
    improvementOpportunities: report.improvementOpportunities.map((o) => ({ ...o })),
    executiveRecommendations: report.executiveRecommendations.map((r) => ({ ...r })),
    orderReportIds: [...report.orderReportIds],
    refundCaseIds: [...report.refundCaseIds],
    supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
  };
}
