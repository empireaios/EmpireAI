import type { PublishingReport } from "./types.js";

/** Authoritative in-memory publishing report store — structural signals only. */
export class PublishStore {
  private reports = new Map<string, PublishingReport>();
  private latestPublishingReportId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    publishingReportId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: PublishingReport[]) {
    this.reports.clear();
    this.latestPublishingReportId = null;
    this.auditTrail = [];
    for (const report of reports) {
      this.reports.set(report.publishingReportId, clone(report));
      this.latestPublishingReportId = report.publishingReportId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        publishingReportId: report.publishingReportId,
        action: "seed",
        details: `seeded publishingReport=${report.publishingReportId} media=${report.mediaId}`,
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

  get(publishingReportId: string) {
    const report = this.reports.get(publishingReportId);
    return report ? clone(report) : null;
  }

  getByMediaId(mediaId: string) {
    return this.list().find((r) => r.mediaId === mediaId) ?? null;
  }

  getLatestPublishingReportId() {
    return this.latestPublishingReportId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  save(report: PublishingReport, action = "save") {
    this.reports.set(report.publishingReportId, clone(report));
    this.latestPublishingReportId = report.publishingReportId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      publishingReportId: report.publishingReportId,
      action,
      details: `media=${report.mediaId} platform=${report.targetPlatform} readiness=${report.publishingReadiness.status}`,
    });
    return clone(report);
  }

  markSubmitted(publishingReportId: string, executiveReportId: string) {
    const current = this.reports.get(publishingReportId);
    if (!current) return null;
    const updated: PublishingReport = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.save(updated, "submit_report");
  }
}

function clone(report: PublishingReport): PublishingReport {
  return {
    ...report,
    tags: [...report.tags],
    thumbnailReference: { ...report.thumbnailReference, approved: true },
    playlist: { ...report.playlist },
    uploadPackage: {
      ...report.uploadPackage,
      tags: [...report.uploadPackage.tags],
      assetRefs: [...report.uploadPackage.assetRefs],
    },
    publishingReadiness: { ...report.publishingReadiness },
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
  };
}
