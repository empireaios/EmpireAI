import type { VisualResearchReport } from "./types.js";

/** Authoritative in-memory visual research report store — reference tracking only. */
export class VisualStore {
  private reports = new Map<string, VisualResearchReport>();
  private latestVisualResearchId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    visualResearchId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: VisualResearchReport[]) {
    this.reports.clear();
    this.latestVisualResearchId = null;
    this.auditTrail = [];
    for (const report of reports) {
      this.reports.set(report.visualResearchId, clone(report));
      this.latestVisualResearchId = report.visualResearchId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        visualResearchId: report.visualResearchId,
        action: "seed",
        details: `seeded visualResearch=${report.visualResearchId} script=${report.scriptId}`,
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

  get(visualResearchId: string) {
    const report = this.reports.get(visualResearchId);
    return report ? clone(report) : null;
  }

  getByScriptId(scriptId: string) {
    return this.list().find((r) => r.scriptId === scriptId) ?? null;
  }

  getLatestVisualResearchId() {
    return this.latestVisualResearchId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  save(report: VisualResearchReport, action = "save") {
    this.reports.set(report.visualResearchId, clone(report));
    this.latestVisualResearchId = report.visualResearchId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      visualResearchId: report.visualResearchId,
      action,
      details: `script=${report.scriptId} scenes=${report.scenes.length} confidence=${report.confidenceScore}`,
    });
    return clone(report);
  }

  markSubmitted(visualResearchId: string, executiveReportId: string) {
    const current = this.reports.get(visualResearchId);
    if (!current) return null;
    const updated: VisualResearchReport = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.save(updated, "submit_report");
  }
}

function clone(report: VisualResearchReport): VisualResearchReport {
  return {
    ...report,
    scenes: report.scenes.map((s) => ({ ...s })),
    missingAssets: [...report.missingAssets],
    licensingRestrictions: report.licensingRestrictions.map((l) => ({ ...l })),
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
  };
}
