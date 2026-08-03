import type { DesignWorkerReport } from "./types.js";

/** Authoritative in-memory design report store — structural visual assets only. */
export class DesignStore {
  private reports = new Map<string, DesignWorkerReport>();
  private latestDesignReportId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    designReportId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: DesignWorkerReport[]) {
    this.reports.clear();
    this.latestDesignReportId = null;
    this.auditTrail = [];
    for (const report of reports) {
      this.reports.set(report.designReportId, clone(report));
      this.latestDesignReportId = report.designReportId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        designReportId: report.designReportId,
        action: "seed",
        details: `seeded designReport=${report.designReportId} title=${report.productTitle} type=${report.productType}`,
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

  get(designReportId: string) {
    const report = this.reports.get(designReportId);
    return report ? clone(report) : null;
  }

  getLatestDesignReportId() {
    return this.latestDesignReportId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  save(report: DesignWorkerReport, action = "save") {
    this.reports.set(report.designReportId, clone(report));
    this.latestDesignReportId = report.designReportId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      designReportId: report.designReportId,
      action,
      details: `title=${report.productTitle} type=${report.productType} assets=${report.allAssets.length} confidence=${report.confidenceScore}`,
    });
    return clone(report);
  }

  markSubmitted(designReportId: string, executiveReportId: string) {
    const current = this.reports.get(designReportId);
    if (!current) return null;
    const updated: DesignWorkerReport = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.save(updated, "submit_report");
  }
}

function clone(report: DesignWorkerReport): DesignWorkerReport {
  return {
    ...report,
    assetTypesCreated: [...report.assetTypesCreated],
    exportFormats: [...report.exportFormats],
    previewAssets: report.previewAssets.map((a) => ({ ...a })),
    mockupAssets: report.mockupAssets.map((a) => ({ ...a })),
    ebookCovers: report.ebookCovers.map((a) => ({ ...a })),
    courseCovers: report.courseCovers.map((a) => ({ ...a })),
    brandingAssets: report.brandingAssets.map((a) => ({ ...a })),
    promotionalGraphics: report.promotionalGraphics.map((a) => ({ ...a })),
    allAssets: report.allAssets.map((a) => ({ ...a })),
    brandingThemeDetails: { ...report.brandingThemeDetails },
    selfReviewFindings: report.selfReviewFindings.map((f) => ({ ...f })),
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
  };
}
