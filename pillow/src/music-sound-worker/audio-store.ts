import type { MusicSoundReport } from "./types.js";

/** Authoritative in-memory music & sound report store — structural signals only. */
export class AudioStore {
  private reports = new Map<string, MusicSoundReport>();
  private latestAudioReportId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    audioReportId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: MusicSoundReport[]) {
    this.reports.clear();
    this.latestAudioReportId = null;
    this.auditTrail = [];
    for (const report of reports) {
      this.reports.set(report.audioReportId, clone(report));
      this.latestAudioReportId = report.audioReportId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        audioReportId: report.audioReportId,
        action: "seed",
        details: `seeded audioReport=${report.audioReportId} script=${report.scriptId}`,
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

  get(audioReportId: string) {
    const report = this.reports.get(audioReportId);
    return report ? clone(report) : null;
  }

  getByScriptId(scriptId: string) {
    return this.list().find((r) => r.scriptId === scriptId) ?? null;
  }

  getLatestAudioReportId() {
    return this.latestAudioReportId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  save(report: MusicSoundReport, action = "save") {
    this.reports.set(report.audioReportId, clone(report));
    this.latestAudioReportId = report.audioReportId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      audioReportId: report.audioReportId,
      action,
      details: `script=${report.scriptId} music=${report.backgroundMusicAssets.length} sfx=${report.soundEffectAssets.length}`,
    });
    return clone(report);
  }

  markSubmitted(audioReportId: string, executiveReportId: string) {
    const current = this.reports.get(audioReportId);
    if (!current) return null;
    const updated: MusicSoundReport = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.save(updated, "submit_report");
  }
}

function clone(report: MusicSoundReport): MusicSoundReport {
  return {
    ...report,
    backgroundMusicAssets: report.backgroundMusicAssets.map((a) => ({ ...a })),
    soundEffectAssets: report.soundEffectAssets.map((a) => ({ ...a })),
    sceneTimeline: report.sceneTimeline.map((s) => ({
      ...s,
      soundEffectAssetIds: [...s.soundEffectAssetIds],
    })),
    audioPlacement: report.audioPlacement.map((p) => ({ ...p })),
    qualityValidation: { ...report.qualityValidation },
    requiredSoundEffects: [...report.requiredSoundEffects],
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
  };
}
