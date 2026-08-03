import type { VoiceReport } from "./types.js";

/** Authoritative in-memory voice report store — structural signals only. */
export class VoiceStore {
  private reports = new Map<string, VoiceReport>();
  private latestVoiceReportId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    voiceReportId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: VoiceReport[]) {
    this.reports.clear();
    this.latestVoiceReportId = null;
    this.auditTrail = [];
    for (const report of reports) {
      this.reports.set(report.voiceReportId, clone(report));
      this.latestVoiceReportId = report.voiceReportId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        voiceReportId: report.voiceReportId,
        action: "seed",
        details: `seeded voiceReport=${report.voiceReportId} script=${report.scriptId}`,
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

  get(voiceReportId: string) {
    const report = this.reports.get(voiceReportId);
    return report ? clone(report) : null;
  }

  getByScriptId(scriptId: string) {
    return this.list().find((r) => r.scriptId === scriptId) ?? null;
  }

  getLatestVoiceReportId() {
    return this.latestVoiceReportId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  save(report: VoiceReport, action = "save") {
    this.reports.set(report.voiceReportId, clone(report));
    this.latestVoiceReportId = report.voiceReportId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      voiceReportId: report.voiceReportId,
      action,
      details: `script=${report.scriptId} assets=${report.voiceAssetReferences.length} variants=${report.variantCount}`,
    });
    return clone(report);
  }

  markSubmitted(voiceReportId: string, executiveReportId: string) {
    const current = this.reports.get(voiceReportId);
    if (!current) return null;
    const updated: VoiceReport = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.save(updated, "submit_report");
  }
}

function clone(report: VoiceReport): VoiceReport {
  return {
    ...report,
    narrationSegments: report.narrationSegments.map((s) => ({
      ...s,
      pronunciationHints: [...s.pronunciationHints],
    })),
    voiceGenerationSettings: {
      ...report.voiceGenerationSettings,
      pronunciationControls: [...report.voiceGenerationSettings.pronunciationControls],
    },
    voiceAssetReferences: report.voiceAssetReferences.map((a) => ({ ...a })),
    variants: report.variants.map((v) => ({ ...v })),
    configurationHistory: report.configurationHistory.map((c) => ({ ...c })),
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
  };
}
