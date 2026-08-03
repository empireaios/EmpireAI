import type { DigitalProductResearchReport } from "./types.js";

/** Authoritative in-memory digital product research store — research only. */
export class ResearchStore {
  private reports = new Map<string, DigitalProductResearchReport>();
  private latestResearchReportId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    researchReportId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: DigitalProductResearchReport[]) {
    this.reports.clear();
    this.latestResearchReportId = null;
    this.auditTrail = [];
    for (const report of reports) {
      this.reports.set(report.researchReportId, clone(report));
      this.latestResearchReportId = report.researchReportId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        researchReportId: report.researchReportId,
        action: "seed",
        details: `seeded report=${report.researchReportId} topic=${report.researchTopic} score=${report.opportunityScore}`,
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

  get(researchReportId: string) {
    const report = this.reports.get(researchReportId);
    return report ? clone(report) : null;
  }

  getLatestResearchReportId() {
    return this.latestResearchReportId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  save(report: DigitalProductResearchReport, action = "save") {
    this.reports.set(report.researchReportId, clone(report));
    this.latestResearchReportId = report.researchReportId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      researchReportId: report.researchReportId,
      action,
      details: `topic=${report.researchTopic} opportunityScore=${report.opportunityScore} confidence=${report.confidenceScore} priority=${report.recommendedPriority}`,
    });
    return clone(report);
  }

  markSubmitted(researchReportId: string, executiveReportId: string) {
    const current = this.reports.get(researchReportId);
    if (!current) return null;
    const updated: DigitalProductResearchReport = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.save(updated, "submit_report");
  }
}

function clone(report: DigitalProductResearchReport): DigitalProductResearchReport {
  return {
    ...report,
    customerPainPoints: [...report.customerPainPoints],
    supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
    evidenceKinds: [...report.evidenceKinds],
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
  };
}
