import type { CreativeAssetReport } from "./types.js";

/** Authoritative in-memory creative asset report store — structural signals only. */
export class CreativeStore {
  private reports = new Map<string, CreativeAssetReport>();
  private latestCreativeAssetId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    creativeAssetId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: CreativeAssetReport[]) {
    this.reports.clear();
    this.latestCreativeAssetId = null;
    this.auditTrail = [];
    for (const report of reports) {
      this.reports.set(report.creativeAssetId, clone(report));
      this.latestCreativeAssetId = report.creativeAssetId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        creativeAssetId: report.creativeAssetId,
        action: "seed",
        details: `seeded creativeAsset=${report.creativeAssetId} script=${report.scriptId}`,
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

  get(creativeAssetId: string) {
    const report = this.reports.get(creativeAssetId);
    return report ? clone(report) : null;
  }

  getByScriptId(scriptId: string) {
    return this.list().find((r) => r.scriptId === scriptId) ?? null;
  }

  getLatestCreativeAssetId() {
    return this.latestCreativeAssetId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  save(report: CreativeAssetReport, action = "save") {
    this.reports.set(report.creativeAssetId, clone(report));
    this.latestCreativeAssetId = report.creativeAssetId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      creativeAssetId: report.creativeAssetId,
      action,
      details: `script=${report.scriptId} generated=${report.generatedAssets.length} variants=${report.variantCount}`,
    });
    return clone(report);
  }

  markSubmitted(creativeAssetId: string, executiveReportId: string) {
    const current = this.reports.get(creativeAssetId);
    if (!current) return null;
    const updated: CreativeAssetReport = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.save(updated, "submit_report");
  }
}

function clone(report: CreativeAssetReport): CreativeAssetReport {
  return {
    ...report,
    sourceAssets: [...report.sourceAssets],
    generatedAssets: [...report.generatedAssets],
    editOperations: report.editOperations.map((e) => ({ ...e })),
    variants: report.variants.map((v) => ({ ...v })),
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
  };
}
