import type { GrandKingAcceptanceReport, DecisionHistoryEntry } from "./types.js";



let reportSeq = 0;

let acceptanceSeq = 0;

let authorisationSeq = 0;

let historySeq = 0;



export function nextReportId() {

  reportSeq += 1;

  return `gkagt-rpt-${String(reportSeq).padStart(4, "0")}`;

}



export function nextAcceptanceId() {

  acceptanceSeq += 1;

  return `gkagt-acc-${String(acceptanceSeq).padStart(4, "0")}`;

}



export function nextAuthorisationId() {

  authorisationSeq += 1;

  return `gkagt-auth-${String(authorisationSeq).padStart(4, "0")}`;

}



export function nextHistoryEntryId() {

  historySeq += 1;

  return `gkagt-hist-${String(historySeq).padStart(4, "0")}`;

}



export function resetGkagtSequenceForTesting() {

  reportSeq = 0;

  acceptanceSeq = 0;

  authorisationSeq = 0;

  historySeq = 0;

}



function cloneReport(report: GrandKingAcceptanceReport): GrandKingAcceptanceReport {

  return {

    ...report,

    supportingEvidence: [...report.supportingEvidence],

    outstandingIssues: [...report.outstandingIssues],

    traceabilityRefs: [...report.traceabilityRefs],

    decisionHistoryRefs: [...report.decisionHistoryRefs],

    acceptance: {

      ...report.acceptance,

      supportingEvidence: [...report.acceptance.supportingEvidence],

    },

    validation: {

      ...report.validation,

      errors: [...report.validation.errors],

      warnings: [...report.validation.warnings],

    },

    q1110ContractConsumed: {

      ...report.q1110ContractConsumed,

      fields: [...report.q1110ContractConsumed.fields],

    },

    deploymentAuthorisation: report.deploymentAuthorisation

      ? { ...report.deploymentAuthorisation, evidence: [...report.deploymentAuthorisation.evidence] }

      : null,

    structuralSignalOnly: true,

    evidenceBasedOnly: true,

    preserveCompleteTraceability: true,

    preserveImmutableApprovalHistory: true,

    preserveAuditHistory: true,

    deterministicGateBehaviour: true,

    maskSensitiveValues: true,

    neverFabricateApprovalEvidence: true,

    neverBypassGrandKingApproval: true,

    neverAuthoriseWithoutApproval: true,

    neverOverrideFailedCertifications: true,

    neverOverridePillow: true,

    neverOverrideGrandKing: true,

    neverImplementQ1201OrLater: true,

    finalQ11Gate: true,

  };

}



function cloneHistoryEntry(entry: DecisionHistoryEntry): DecisionHistoryEntry {

  return { ...entry, evidence: [...entry.evidence] };

}



export class AuditStore {

  private readonly reports = new Map<string, GrandKingAcceptanceReport>();

  private latestReportId: string | null = null;

  private readonly approvalHistory: DecisionHistoryEntry[] = [];

  private readonly auditTrail: Array<{

    timestamp: string;

    entityId: string;

    action: string;

    details: string;

  }> = [];



  seed(reports: GrandKingAcceptanceReport[]) {

    this.reports.clear();

    this.latestReportId = null;

    this.approvalHistory.length = 0;

    this.auditTrail.length = 0;

    for (const report of reports) {

      this.reports.set(report.reportId, cloneReport(report));

      this.latestReportId = report.reportId;

      this.auditTrail.push({

        timestamp: new Date().toISOString(),

        entityId: report.reportId,

        action: "seed",

        details: `seeded report decision=${report.grandKingDecision}`,

      });

    }

  }



  reportCount() {

    return this.reports.size;

  }



  listReports() {

    return [...this.reports.values()]

      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))

      .map(cloneReport);

  }



  getReport(reportId: string) {

    const found = this.reports.get(reportId);

    return found ? cloneReport(found) : null;

  }



  getLatestReportId() {

    return this.latestReportId;

  }



  getLatestReport() {

    return this.latestReportId ? this.getReport(this.latestReportId) : null;

  }



  saveReport(report: GrandKingAcceptanceReport, action = "produce_report") {

    this.reports.set(report.reportId, cloneReport(report));

    this.latestReportId = report.reportId;

    this.auditTrail.push({

      timestamp: new Date().toISOString(),

      entityId: report.reportId,

      action,

      details: `decision=${report.grandKingDecision} auth=${report.deploymentAuthorisationStatus}`,

    });

    return this.getReport(report.reportId)!;

  }



  appendDecisionHistory(entry: DecisionHistoryEntry) {

    this.approvalHistory.push(cloneHistoryEntry(entry));

    this.auditTrail.push({

      timestamp: entry.timestamp,

      entityId: entry.entryId,

      action: "record_decision",

      details: `decision=${entry.grandKingDecision} auth=${entry.deploymentAuthorisationStatus}`,

    });

    return cloneHistoryEntry(entry);

  }



  getApprovalHistory(limit = 100) {

    return this.approvalHistory.slice(-limit).map(cloneHistoryEntry);

  }



  getAuditTrail(limit = 100) {

    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));

  }

}

