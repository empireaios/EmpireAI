import type { ProductionCertificationReport } from "./types.js";

let reportSeq = 0;

export function nextReportId() {
  reportSeq += 1;
  return `pccrt-rpt-${String(reportSeq).padStart(4, "0")}`;
}

export function resetPccrtSequenceForTesting() {
  reportSeq = 0;
}

function cloneReport(report: ProductionCertificationReport): ProductionCertificationReport {
  return {
    ...report,
    certificationScope: [...report.certificationScope],
    factorySummary: { ...report.factorySummary, evidence: [...report.factorySummary.evidence] },
    workerSummary: { ...report.workerSummary, evidence: [...report.workerSummary.evidence] },
    runtimeSummary: { ...report.runtimeSummary, evidence: [...report.runtimeSummary.evidence] },
    governanceSummary: { ...report.governanceSummary, evidence: [...report.governanceSummary.evidence] },
    readinessSummary: {
      ...report.readinessSummary,
      notes: [...report.readinessSummary.notes],
      evidence: [...report.readinessSummary.evidence],
    },
    evidenceSummary: {
      ...report.evidenceSummary,
      byComponentType: { ...report.evidenceSummary.byComponentType },
      evidence: [...report.evidenceSummary.evidence],
    },
    failedItems: [...report.failedItems],
    outstandingRisks: [...report.outstandingRisks],
    q1101ContractConsumed: { ...report.q1101ContractConsumed, fields: [...report.q1101ContractConsumed.fields] },
    programmeInventory: report.programmeInventory.map((p) => ({ ...p, requiredEvidenceRefs: [...p.requiredEvidenceRefs] })),
    certificationResults: report.certificationResults.map((r) => ({
      ...r,
      evidenceReferences: [...r.evidenceReferences],
      validationResults: [...r.validationResults],
      failedChecks: [...r.failedChecks],
      passedChecks: [...r.passedChecks],
      outstandingIssues: [...r.outstandingIssues],
    })),
    reportingSummary: { ...report.reportingSummary, evidence: [...report.reportingSummary.evidence] },
    integrationSummary: {
      ...report.integrationSummary,
      rows: report.integrationSummary.rows.map((r) => ({ ...r })),
      evidence: [...report.integrationSummary.evidence],
    },
    traceabilityRefs: [...report.traceabilityRefs],
    validation: {
      ...report.validation,
      errors: [...report.validation.errors],
      warnings: [...report.validation.warnings],
    },
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    preserveCompleteTraceability: true,
    preserveImmutableCertificationHistory: true,
    preserveCertificationHistory: true,
    preserveAuditHistory: true,
    deterministicCertification: true,
    maskSensitiveValues: true,
    neverFabricateCertificationEvidence: true,
    neverCertifyMissingCapabilities: true,
    neverAssumeImplementation: true,
    neverImplementMissingCapabilities: true,
    neverModifyProductionLogic: true,
    neverReplaceIndividualAuditProgrammes: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1102OrLater: true,
    finalQ11CoreGate: true,
  };
}

export class CertificationStore {
  private readonly reports = new Map<string, ProductionCertificationReport>();
  private latestReportId: string | null = null;
  private readonly auditTrail: Array<{
    timestamp: string;
    entityId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: ProductionCertificationReport[]) {
    this.reports.clear();
    this.latestReportId = null;
    this.auditTrail.length = 0;
    for (const report of reports) {
      this.reports.set(report.reportId, cloneReport(report));
      this.latestReportId = report.reportId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        entityId: report.reportId,
        action: "seed",
        details: `seeded report decision=${report.certificationDecision}`,
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

  saveReport(report: ProductionCertificationReport, action = "produce_report") {
    this.reports.set(report.reportId, cloneReport(report));
    this.latestReportId = report.reportId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      entityId: report.reportId,
      action,
      details: `decision=${report.certificationDecision} confidence=${report.confidenceScore}`,
    });
    return this.getReport(report.reportId)!;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }
}
