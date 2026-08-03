import type { RefundDisputeReport } from "./types.js";

/** Authoritative in-memory case store — workflow tracking only. */
export class CaseStore {
  private cases = new Map<string, RefundDisputeReport>();
  private latestCaseId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    caseId: string;
    action: string;
    details: string;
  }> = [];

  seed(cases: RefundDisputeReport[]) {
    this.cases.clear();
    this.latestCaseId = null;
    this.auditTrail = [];
    for (const report of cases) {
      this.cases.set(report.caseId, clone(report));
      this.latestCaseId = report.caseId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        caseId: report.caseId,
        action: "seed",
        details: `seeded case=${report.caseId} type=${report.caseType} order=${report.orderId}`,
      });
    }
  }

  count() {
    return this.cases.size;
  }

  list() {
    return [...this.cases.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(clone);
  }

  get(caseId: string) {
    const report = this.cases.get(caseId);
    return report ? clone(report) : null;
  }

  getLatestCaseId() {
    return this.latestCaseId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  save(report: RefundDisputeReport, action = "save") {
    this.cases.set(report.caseId, clone(report));
    this.latestCaseId = report.caseId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      caseId: report.caseId,
      action,
      details: `order=${report.orderId} type=${report.caseType} status=${report.currentStatus} decision=${report.policyEvaluation.decision}`,
    });
    return clone(report);
  }

  markSubmitted(caseId: string, executiveReportId: string) {
    const current = this.cases.get(caseId);
    if (!current) return null;
    const updated: RefundDisputeReport = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.save(updated, "submit_findings");
  }
}

function clone(report: RefundDisputeReport): RefundDisputeReport {
  return {
    ...report,
    actionsTaken: report.actionsTaken.map((a) => ({ ...a })),
    customerCommunications: report.customerCommunications.map((c) => ({ ...c })),
    escalations: report.escalations.map((e) => ({ ...e })),
    supplierCoordination: report.supplierCoordination.map((s) => ({ ...s })),
    caseHistory: report.caseHistory.map((h) => ({ ...h })),
    supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
    policyEvaluation: {
      ...report.policyEvaluation,
      marketplaceRuleRefs: [...report.policyEvaluation.marketplaceRuleRefs],
    },
    resolution: { ...report.resolution },
  };
}
