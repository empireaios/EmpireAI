import type { MediaLearningReport } from "./types.js";

/** Authoritative in-memory media learning report store — structural signals only. */
export class LearningStore {
  private reports = new Map<string, MediaLearningReport>();
  private latestLearningReportId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    learningReportId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: MediaLearningReport[]) {
    this.reports.clear();
    this.latestLearningReportId = null;
    this.auditTrail = [];
    for (const report of reports) {
      this.reports.set(report.learningReportId, clone(report));
      this.latestLearningReportId = report.learningReportId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        learningReportId: report.learningReportId,
        action: "seed",
        details: `seeded learningReport=${report.learningReportId} channel=${report.channelId}`,
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

  get(learningReportId: string) {
    const report = this.reports.get(learningReportId);
    return report ? clone(report) : null;
  }

  getByChannelId(channelId: string) {
    return this.list().find((r) => r.channelId === channelId) ?? null;
  }

  getLatestLearningReportId() {
    return this.latestLearningReportId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  save(report: MediaLearningReport, action = "save") {
    // never overwrite historical learning: append new record; keep prior IDs immutable
    if (this.reports.has(report.learningReportId)) {
      const existing = this.reports.get(report.learningReportId)!;
      const merged: MediaLearningReport = {
        ...clone(report),
        historicalLearningRecordIds: unique([
          ...existing.historicalLearningRecordIds,
          ...report.historicalLearningRecordIds,
          existing.learningReportId,
        ]),
        neverOverwriteHistoricalLearning: true,
      };
      this.reports.set(report.learningReportId, merged);
      this.latestLearningReportId = report.learningReportId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        learningReportId: report.learningReportId,
        action,
        details: `updated-without-overwrite channel=${report.channelId} confidence=${report.confidenceScore}`,
      });
      return clone(merged);
    }
    this.reports.set(report.learningReportId, clone(report));
    this.latestLearningReportId = report.learningReportId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      learningReportId: report.learningReportId,
      action,
      details: `channel=${report.channelId} mediaCount=${report.mediaIdsAnalysed.length} confidence=${report.confidenceScore}`,
    });
    return clone(report);
  }

  markSubmitted(learningReportId: string, executiveReportId: string) {
    const current = this.reports.get(learningReportId);
    if (!current) return null;
    const updated: MediaLearningReport = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.save(updated, "submit_report");
  }
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function clone(report: MediaLearningReport): MediaLearningReport {
  return {
    ...report,
    mediaIdsAnalysed: [...report.mediaIdsAnalysed],
    successfulPatterns: report.successfulPatterns.map((p) => ({
      ...p,
      evidenceRefs: [...p.evidenceRefs],
    })),
    failedPatterns: report.failedPatterns.map((p) => ({
      ...p,
      evidenceRefs: [...p.evidenceRefs],
    })),
    topicInsights: report.topicInsights.map((i) => ({
      ...i,
      measuredSignals: [...i.measuredSignals],
      assumptions: [...i.assumptions],
    })),
    hookInsights: report.hookInsights.map((i) => ({
      ...i,
      measuredSignals: [...i.measuredSignals],
      assumptions: [...i.assumptions],
    })),
    thumbnailInsights: report.thumbnailInsights.map((i) => ({
      ...i,
      measuredSignals: [...i.measuredSignals],
      assumptions: [...i.assumptions],
    })),
    retentionInsights: report.retentionInsights.map((i) => ({
      ...i,
      measuredSignals: [...i.measuredSignals],
      assumptions: [...i.assumptions],
    })),
    publishingInsights: report.publishingInsights.map((i) => ({
      ...i,
      measuredSignals: [...i.measuredSignals],
      assumptions: [...i.assumptions],
    })),
    recommendedImprovements: report.recommendedImprovements.map((r) => ({ ...r })),
    playbookRecommendationUpdates: report.playbookRecommendationUpdates.map((u) => ({
      ...u,
      neverOverwroteHistoricalLearning: true as const,
    })),
    analyticsReportIds: [...report.analyticsReportIds],
    learningTraceabilityRefs: [...report.learningTraceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
    historicalLearningRecordIds: [...report.historicalLearningRecordIds],
  };
}
