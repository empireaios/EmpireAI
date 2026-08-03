import type { VideoAssemblyReport } from "./types.js";

/** Authoritative in-memory assembly report store — structural signals only. */
export class AssemblyStore {
  private reports = new Map<string, VideoAssemblyReport>();
  private latestAssemblyId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    assemblyId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: VideoAssemblyReport[]) {
    this.reports.clear();
    this.latestAssemblyId = null;
    this.auditTrail = [];
    for (const report of reports) {
      this.reports.set(report.assemblyId, clone(report));
      this.latestAssemblyId = report.assemblyId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        assemblyId: report.assemblyId,
        action: "seed",
        details: `seeded assembly=${report.assemblyId} script=${report.scriptId}`,
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

  get(assemblyId: string) {
    const report = this.reports.get(assemblyId);
    return report ? clone(report) : null;
  }

  getByScriptId(scriptId: string) {
    return this.list().find((r) => r.scriptId === scriptId) ?? null;
  }

  getLatestAssemblyId() {
    return this.latestAssemblyId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  save(report: VideoAssemblyReport, action = "save") {
    this.reports.set(report.assemblyId, clone(report));
    this.latestAssemblyId = report.assemblyId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      assemblyId: report.assemblyId,
      action,
      details: `script=${report.scriptId} scenes=${report.sceneTimeline.length} formats=${report.outputFormats.length}`,
    });
    return clone(report);
  }

  markSubmitted(assemblyId: string, executiveReportId: string) {
    const current = this.reports.get(assemblyId);
    if (!current) return null;
    const updated: VideoAssemblyReport = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.save(updated, "submit_report");
  }
}

function clone(report: VideoAssemblyReport): VideoAssemblyReport {
  return {
    ...report,
    visualAssetIds: [...report.visualAssetIds],
    creativeAssetIds: [...report.creativeAssetIds],
    sceneTimeline: report.sceneTimeline.map((s) => ({
      ...s,
      visualAssetIds: [...s.visualAssetIds],
      creativeAssetIds: [...s.creativeAssetIds],
    })),
    renderSettings: {
      ...report.renderSettings,
      aspects: [...report.renderSettings.aspects],
      resolutions: [...report.renderSettings.resolutions],
    },
    outputFormats: report.outputFormats.map((f) => ({ ...f })),
    qualityValidation: { ...report.qualityValidation },
    finalVideoReference: {
      ...report.finalVideoReference,
      formats: report.finalVideoReference.formats.map((f) => ({ ...f })),
    },
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
  };
}
