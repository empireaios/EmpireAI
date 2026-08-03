import type { RequirementsReport } from "./types.js";

/** Authoritative in-memory requirements store — structural signals only. */
export class RequirementsStore {
  private reports = new Map<string, RequirementsReport>();
  private latestRequirementsReportId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    requirementsId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: RequirementsReport[]) {
    this.reports.clear();
    this.latestRequirementsReportId = null;
    this.auditTrail = [];
    for (const report of reports) {
      this.reports.set(report.requirementsId, clone(report));
      this.latestRequirementsReportId = report.requirementsId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        requirementsId: report.requirementsId,
        action: "seed",
        details: `seeded requirements=${report.requirementsId} platform=${report.platformName}`,
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

  get(requirementsId: string) {
    const report = this.reports.get(requirementsId);
    return report ? clone(report) : null;
  }

  getLatestRequirementsReportId() {
    return this.latestRequirementsReportId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  save(report: RequirementsReport, action = "save") {
    this.reports.set(report.requirementsId, clone(report));
    this.latestRequirementsReportId = report.requirementsId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      requirementsId: report.requirementsId,
      action,
      details: `platform=${report.platformName} confidence=${report.confidenceScore}`,
    });
    return clone(report);
  }

  markSubmitted(requirementsId: string, executiveReportId: string) {
    const current = this.reports.get(requirementsId);
    if (!current) return null;
    const updated: RequirementsReport = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.save(updated, "submit_report");
  }
}

function clone(report: RequirementsReport): RequirementsReport {
  return {
    ...report,
    requirementsSteps: report.requirementsSteps.map((s) => ({ ...s })),
    supportedRequirementTypes: [...report.supportedRequirementTypes],
    functionalRequirements: report.functionalRequirements.map((r) => ({ ...r })),
    nonFunctionalRequirements: report.nonFunctionalRequirements.map((r) => ({ ...r })),
    userStories: report.userStories.map((s) => ({ ...s })),
    useCases: report.useCases.map((u) => ({ ...u })),
    acceptanceCriteria: report.acceptanceCriteria.map((a) => ({ ...a })),
    assumptions: [...report.assumptions],
    constraints: [...report.constraints],
    technicalConstraints: [...report.technicalConstraints],
    regulatoryConstraints: [...report.regulatoryConstraints],
    risks: report.risks.map((r) => ({ ...r })),
    businessRules: report.businessRules.map((b) => ({ ...b })),
    stakeholders: [...report.stakeholders],
    selfReviewFindings: report.selfReviewFindings.map((f) => ({ ...f })),
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
  };
}
