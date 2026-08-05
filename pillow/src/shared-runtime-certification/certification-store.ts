import type { SharedRuntimeCertificationReport } from "./types.js";

let reportSeq = 0;

export function nextReportId() {
  reportSeq += 1;
  return `srcrt-rpt-${String(reportSeq).padStart(4, "0")}`;
}

export function resetSrcrtSequenceForTesting() {
  reportSeq = 0;
}

function cloneReport(
  report: SharedRuntimeCertificationReport,
): SharedRuntimeCertificationReport {
  return {
    ...report,
    runtimeInventory: {
      ...report.runtimeInventory,
      items: report.runtimeInventory.items.map((i) => ({ ...i })),
    },
    integrationSummary: {
      ...report.integrationSummary,
      rows: report.integrationSummary.rows.map((row) => ({ ...row })),
      evidence: [...report.integrationSummary.evidence],
    },
    certificationSummary: {
      ...report.certificationSummary,
      notes: [...report.certificationSummary.notes],
      evidence: [...report.certificationSummary.evidence],
    },
    runtimeCertificationMatrix: report.runtimeCertificationMatrix.map((row) => ({
      ...row,
      supportingEvidence: [...row.supportingEvidence],
    })),
    passedComponents: [...report.passedComponents],
    failedComponents: [...report.failedComponents],
    missingComponents: [...report.missingComponents],
    supportingEvidence: [...report.supportingEvidence],
    outstandingIssues: [...report.outstandingIssues],
    risks: [...report.risks],
    governanceResults: {
      ...report.governanceResults,
      checks: report.governanceResults.checks.map((c) => ({ ...c })),
      missingDocs: [...report.governanceResults.missingDocs],
      evidence: [...report.governanceResults.evidence],
    },
    monitoringVerification: {
      ...report.monitoringVerification,
      evidence: [...report.monitoringVerification.evidence],
    },
    recoveryVerification: {
      ...report.recoveryVerification,
      evidence: [...report.recoveryVerification.evidence],
    },
    auditabilityVerification: {
      ...report.auditabilityVerification,
      evidence: [...report.auditabilityVerification.evidence],
    },
    reportingVerification: {
      ...report.reportingVerification,
      evidence: [...report.reportingVerification.evidence],
    },
    q1014ContractConsumed: {
      ...report.q1014ContractConsumed,
      fields: [...report.q1014ContractConsumed.fields],
    },
    repositoryAudit: {
      ...report.repositoryAudit,
      evidence: [...report.repositoryAudit.evidence],
    },
    runtimeAudit: {
      ...report.runtimeAudit,
      probes: report.runtimeAudit.probes.map((p) => ({ ...p })),
      notes: [...report.runtimeAudit.notes],
    },
    validation: {
      ...report.validation,
      errors: [...report.validation.errors],
      warnings: [...report.validation.warnings],
    },
    traceabilityRefs: [...report.traceabilityRefs],
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    preserveCompleteTraceability: true,
    preserveImmutableCertificationHistory: true,
    preserveCertificationHistory: true,
    preserveAuditHistory: true,
    deterministicCertification: true,
    maskSensitiveValues: true,
    neverFabricateCertificationEvidence: true,
    neverCertifyMissingFunctionality: true,
    neverAssumeImplementation: true,
    neverImplementMissingRuntimes: true,
    neverModifyRuntimeBehaviour: true,
    neverAutomaticallyFixFailures: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1101OrLater: true,
    finalQ10Gate: true,
  };
}

export class CertificationStore {
  private readonly reports = new Map<string, SharedRuntimeCertificationReport>();
  private latestReportId: string | null = null;
  private readonly auditTrail: Array<{
    timestamp: string;
    entityId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: SharedRuntimeCertificationReport[]) {
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

  saveReport(report: SharedRuntimeCertificationReport, action = "produce_report") {
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
