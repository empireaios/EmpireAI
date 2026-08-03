import type { SubtitleReport } from "./types.js";

/** Authoritative in-memory subtitle report store — structural signals only. */
export class SubtitleStore {
  private reports = new Map<string, SubtitleReport>();
  private latestSubtitleReportId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    subtitleReportId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: SubtitleReport[]) {
    this.reports.clear();
    this.latestSubtitleReportId = null;
    this.auditTrail = [];
    for (const report of reports) {
      this.reports.set(report.subtitleReportId, clone(report));
      this.latestSubtitleReportId = report.subtitleReportId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        subtitleReportId: report.subtitleReportId,
        action: "seed",
        details: `seeded subtitleReport=${report.subtitleReportId} script=${report.scriptId}`,
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

  get(subtitleReportId: string) {
    const report = this.reports.get(subtitleReportId);
    return report ? clone(report) : null;
  }

  getByScriptId(scriptId: string) {
    return this.list().find((r) => r.scriptId === scriptId) ?? null;
  }

  getLatestSubtitleReportId() {
    return this.latestSubtitleReportId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  save(report: SubtitleReport, action = "save") {
    this.reports.set(report.subtitleReportId, clone(report));
    this.latestSubtitleReportId = report.subtitleReportId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      subtitleReportId: report.subtitleReportId,
      action,
      details: `script=${report.scriptId} cues=${report.captionTimeline.length} exports=${report.exportFormats.length}`,
    });
    return clone(report);
  }

  markSubmitted(subtitleReportId: string, executiveReportId: string) {
    const current = this.reports.get(subtitleReportId);
    if (!current) return null;
    const updated: SubtitleReport = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.save(updated, "submit_report");
  }
}

function clone(report: SubtitleReport): SubtitleReport {
  return {
    ...report,
    captionTimeline: report.captionTimeline.map((c) => ({ ...c })),
    timingAccuracy: { ...report.timingAccuracy },
    exportFormats: report.exportFormats.map((f) => ({ ...f })),
    qualityValidation: { ...report.qualityValidation },
    languages: [...report.languages],
    syncIssues: report.syncIssues.map((i) => ({ ...i })),
    transcriptHistory: report.transcriptHistory.map((t) => ({ ...t })),
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
  };
}
