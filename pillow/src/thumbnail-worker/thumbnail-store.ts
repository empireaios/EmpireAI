import type { ThumbnailReport } from "./types.js";

/** Authoritative in-memory thumbnail report store — concept tracking only. */
export class ThumbnailStore {
  private reports = new Map<string, ThumbnailReport>();
  private latestThumbnailReportId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    thumbnailReportId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: ThumbnailReport[]) {
    this.reports.clear();
    this.latestThumbnailReportId = null;
    this.auditTrail = [];
    for (const report of reports) {
      this.reports.set(report.thumbnailReportId, clone(report));
      this.latestThumbnailReportId = report.thumbnailReportId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        thumbnailReportId: report.thumbnailReportId,
        action: "seed",
        details: `seeded thumbnailReport=${report.thumbnailReportId} script=${report.scriptId}`,
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

  get(thumbnailReportId: string) {
    const report = this.reports.get(thumbnailReportId);
    return report ? clone(report) : null;
  }

  getByScriptId(scriptId: string) {
    return this.list().find((r) => r.scriptId === scriptId) ?? null;
  }

  getLatestThumbnailReportId() {
    return this.latestThumbnailReportId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  save(report: ThumbnailReport, action = "save") {
    this.reports.set(report.thumbnailReportId, clone(report));
    this.latestThumbnailReportId = report.thumbnailReportId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      thumbnailReportId: report.thumbnailReportId,
      action,
      details: `script=${report.scriptId} concepts=${report.thumbnailConcepts.length} confidence=${report.confidenceScore}`,
    });
    return clone(report);
  }

  markSubmitted(thumbnailReportId: string, executiveReportId: string) {
    const current = this.reports.get(thumbnailReportId);
    if (!current) return null;
    const updated: ThumbnailReport = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.save(updated, "submit_report");
  }
}

function clone(report: ThumbnailReport): ThumbnailReport {
  return {
    ...report,
    thumbnailConcepts: report.thumbnailConcepts.map((c) => ({ ...c })),
    primaryConcept: { ...report.primaryConcept },
    abVariants: report.abVariants.map((v) => ({ ...v })),
    textOverlays: report.textOverlays.map((t) => ({ ...t })),
    emotionalTriggers: report.emotionalTriggers.map((e) => ({ ...e })),
    compositionGuidance: { ...report.compositionGuidance },
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
    selfReviewFindings: report.selfReviewFindings.map((f) => ({ ...f })),
  };
}
