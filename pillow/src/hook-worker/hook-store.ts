import type { HookReport } from "./types.js";

/** Authoritative in-memory hook report store — hook tracking only. */
export class HookStore {
  private reports = new Map<string, HookReport>();
  private latestHookReportId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    hookReportId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: HookReport[]) {
    this.reports.clear();
    this.latestHookReportId = null;
    this.auditTrail = [];
    for (const report of reports) {
      this.reports.set(report.hookReportId, clone(report));
      this.latestHookReportId = report.hookReportId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        hookReportId: report.hookReportId,
        action: "seed",
        details: `seeded hookReport=${report.hookReportId} script=${report.scriptId}`,
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

  get(hookReportId: string) {
    const report = this.reports.get(hookReportId);
    return report ? clone(report) : null;
  }

  getByScriptId(scriptId: string) {
    return this.list().find((r) => r.scriptId === scriptId) ?? null;
  }

  getLatestHookReportId() {
    return this.latestHookReportId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  save(report: HookReport, action = "save") {
    this.reports.set(report.hookReportId, clone(report));
    this.latestHookReportId = report.hookReportId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      hookReportId: report.hookReportId,
      action,
      details: `script=${report.scriptId} hooks=${1 + report.alternativeHooks.length} confidence=${report.confidenceScore}`,
    });
    return clone(report);
  }

  markSubmitted(hookReportId: string, executiveReportId: string) {
    const current = this.reports.get(hookReportId);
    if (!current) return null;
    const updated: HookReport = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.save(updated, "submit_report");
  }
}

function clone(report: HookReport): HookReport {
  return {
    ...report,
    primaryHook: { ...report.primaryHook },
    alternativeHooks: report.alternativeHooks.map((h) => ({ ...h })),
    curiosityGaps: report.curiosityGaps.map((g) => ({ ...g })),
    retentionLoops: report.retentionLoops.map((l) => ({ ...l })),
    continuationMoments: report.continuationMoments.map((m) => ({ ...m })),
    pacingRecommendations: report.pacingRecommendations.map((p) => ({ ...p })),
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
    selfReviewFindings: report.selfReviewFindings.map((f) => ({ ...f })),
  };
}
