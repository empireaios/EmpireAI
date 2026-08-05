import type { CapitalCertificationReport } from "./types.js";

let reportSeq = 0;

export function nextReportId() {
  reportSeq += 1;
  return `capcrt-rpt-${String(reportSeq).padStart(4, "0")}`;
}

export function resetCapcrtSequenceForTesting() {
  reportSeq = 0;
}

function cloneReport(report: CapitalCertificationReport): CapitalCertificationReport {
  return {
    ...report,
    certificationScope: [...report.certificationScope],
    workerCertificationMatrix: report.workerCertificationMatrix.map((row) => ({ ...row })),
    repositoryAudit: {
      ...report.repositoryAudit,
      evidence: [...report.repositoryAudit.evidence],
    },
    runtimeAudit: {
      ...report.runtimeAudit,
      probes: report.runtimeAudit.probes.map((p) => ({ ...p })),
      notes: [...report.runtimeAudit.notes],
    },
    workerInventory: {
      ...report.workerInventory,
      items: report.workerInventory.items.map((i) => ({ ...i })),
    },
    integrationResults: {
      ...report.integrationResults,
      rows: report.integrationResults.rows.map((row) => ({
        ...row,
        expectedBinds: [...row.expectedBinds],
        observedBinds: [...row.observedBinds],
        missingBinds: [...row.missingBinds],
      })),
      evidence: [...report.integrationResults.evidence],
    },
    endToEndWorkflowResults: {
      ...report.endToEndWorkflowResults,
      stages: report.endToEndWorkflowResults.stages.map((s) => ({ ...s })),
      evidence: [...report.endToEndWorkflowResults.evidence],
    },
    executiveReportingResults: {
      ...report.executiveReportingResults,
      evidence: [...report.executiveReportingResults.evidence],
    },
    governanceResults: {
      ...report.governanceResults,
      checks: report.governanceResults.checks.map((c) => ({ ...c })),
      missingDocs: [...report.governanceResults.missingDocs],
      evidence: [...report.governanceResults.evidence],
    },
    financialTraceabilityResults: {
      ...report.financialTraceabilityResults,
      notes: [...report.financialTraceabilityResults.notes],
      evidence: [...report.financialTraceabilityResults.evidence],
    },
    productionReadinessAssessment: {
      ...report.productionReadinessAssessment,
      notes: [...report.productionReadinessAssessment.notes],
      evidence: [...report.productionReadinessAssessment.evidence],
    },
    q911ContractConsumed: {
      ...report.q911ContractConsumed,
      fields: [...report.q911ContractConsumed.fields],
    },
    risks: [...report.risks],
    openIssues: [...report.openIssues],
    supportingEvidence: [...report.supportingEvidence],
    validation: {
      ...report.validation,
      errors: [...report.validation.errors],
      warnings: [...report.validation.warnings],
    },
    traceabilityRefs: [...report.traceabilityRefs],
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    preserveCompleteTraceability: true,
    preserveCertificationHistory: true,
    preserveAuditHistory: true,
    neverFabricateSuccessfulTests: true,
    neverAssumeImplementation: true,
    neverImplementMissingWorkers: true,
    neverModifyFinancialRecords: true,
    neverAutomaticallyFixFailures: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ10OrLater: true,
    neverExposeCredentials: true,
    finalQ9Gate: true,
    consumableByFutureSeries: false,
  };
}

export class CertificationStore {
  private readonly reports = new Map<string, CapitalCertificationReport>();
  private latestReportId: string | null = null;
  private readonly auditTrail: Array<{
    timestamp: string;
    entityId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: CapitalCertificationReport[]) {
    this.reports.clear();
    this.latestReportId = null;
    this.auditTrail.length = 0;
    for (const report of reports) {
      this.reports.set(report.certificationId, cloneReport(report));
      this.latestReportId = report.certificationId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        entityId: report.certificationId,
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

  saveReport(report: CapitalCertificationReport, action = "produce_report") {
    this.reports.set(report.certificationId, cloneReport(report));
    this.latestReportId = report.certificationId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      entityId: report.certificationId,
      action,
      details: `decision=${report.certificationDecision} confidence=${report.confidenceScore}`,
    });
    return this.getReport(report.certificationId)!;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }
}
