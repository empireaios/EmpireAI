import type { EditorialReport } from "./types.js";



/** Authoritative in-memory editorial store — direction and review only. */

export class EditorialStore {

  private reports = new Map<string, EditorialReport>();

  private latestEditorialReportId: string | null = null;

  private auditTrail: Array<{

    timestamp: string;

    editorialReportId: string;

    action: string;

    details: string;

  }> = [];



  seed(reports: EditorialReport[]) {

    this.reports.clear();

    this.latestEditorialReportId = null;

    this.auditTrail = [];

    for (const report of reports) {

      this.reports.set(report.editorialReportId, clone(report));

      this.latestEditorialReportId = report.editorialReportId;

      this.auditTrail.push({

        timestamp: new Date().toISOString(),

        editorialReportId: report.editorialReportId,

        action: "seed",

        details: `seeded report=${report.editorialReportId} channel=${report.channelId} outcome=${report.reviewOutcome}`,

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



  get(editorialReportId: string) {

    const report = this.reports.get(editorialReportId);

    return report ? clone(report) : null;

  }



  getLatestEditorialReportId() {

    return this.latestEditorialReportId;

  }



  getAuditTrail(limit = 100) {

    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));

  }



  save(report: EditorialReport, action = "save") {

    this.reports.set(report.editorialReportId, clone(report));

    this.latestEditorialReportId = report.editorialReportId;

    this.auditTrail.push({

      timestamp: new Date().toISOString(),

      editorialReportId: report.editorialReportId,

      action,

      details: `channel=${report.channelId} outcome=${report.reviewOutcome} approval=${report.approvalStatus}`,

    });

    return clone(report);

  }



  markSubmitted(editorialReportId: string, executiveReportId: string) {

    const current = this.reports.get(editorialReportId);

    if (!current) return null;

    const updated: EditorialReport = {

      ...clone(current),

      submittedToExecutiveReporting: true,

      executiveReportId,

    };

    return this.save(updated, "submit_report");

  }

}



function clone(report: EditorialReport): EditorialReport {

  return {

    ...report,

    qualityStandards: report.qualityStandards.map((s) => ({ ...s })),

    contentPriorities: [...report.contentPriorities],

    executiveRecommendations: report.executiveRecommendations.map((r) => ({ ...r })),

    traceabilityRefs: [...report.traceabilityRefs],

    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),

  };

}


