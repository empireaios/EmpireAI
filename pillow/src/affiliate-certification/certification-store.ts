import type { AffiliateCertificationReport } from "./types.js";

let reportSeq = 0;

export function nextReportId() {
  reportSeq += 1;
  return `afcrt-rpt-${String(reportSeq).padStart(4, "0")}`;
}

export function resetAfcrtSequenceForTesting() {
  reportSeq = 0;
}

function cloneReport(
  report: AffiliateCertificationReport,
): AffiliateCertificationReport {
  return {
    ...report,
    certificationScope: [...report.certificationScope],
    componentStatusMatrix: report.componentStatusMatrix.map((row) => ({ ...row })),
    deliverableVerification: {
      ...report.deliverableVerification,
      items: report.deliverableVerification.items.map((item) => ({
        ...item,
        evidenceRefs: [...item.evidenceRefs],
      })),
      missingItems: [...report.deliverableVerification.missingItems],
      criticalItemsMissing: [...report.deliverableVerification.criticalItemsMissing],
    },
    integrationVerification: {
      ...report.integrationVerification,
      rows: report.integrationVerification.rows.map((row) => ({
        ...row,
        expectedBinds: [...row.expectedBinds],
        observedBinds: [...row.observedBinds],
        missingBinds: [...row.missingBinds],
      })),
      evidence: [...report.integrationVerification.evidence],
    },
    productionReadiness: {
      ...report.productionReadiness,
      notes: [...report.productionReadiness.notes],
      evidence: [...report.productionReadiness.evidence],
    },
    governanceCompliance: {
      ...report.governanceCompliance,
      checks: report.governanceCompliance.checks.map((c) => ({ ...c })),
      missingDocs: [...report.governanceCompliance.missingDocs],
      evidence: [...report.governanceCompliance.evidence],
    },
    operationalReadiness: {
      ...report.operationalReadiness,
      probes: report.operationalReadiness.probes.map((p) => ({ ...p })),
      notes: [...report.operationalReadiness.notes],
    },
    workflowCompleteness: {
      ...report.workflowCompleteness,
      stages: report.workflowCompleteness.stages.map((s) => ({
        ...s,
        dependsOn: [...s.dependsOn],
      })),
      evidence: [...report.workflowCompleteness.evidence],
    },
    reportingCapability: {
      ...report.reportingCapability,
      evidence: [...report.reportingCapability.evidence],
    },
    launchPackContractConsumed: { ...report.launchPackContractConsumed, fields: [...report.launchPackContractConsumed.fields] },
    risks: [...report.risks],
    outstandingFindings: [...report.outstandingFindings],
    validation: {
      ...report.validation,
      errors: [...report.validation.errors],
      warnings: [...report.validation.warnings],
    },
    traceabilityRefs: [...report.traceabilityRefs],
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    preserveCompleteTraceability: true,
    preserveCertificationAuditHistory: true,
    neverFabricateVerificationResults: true,
    neverCertifyUnsupportedFunctionality: true,
    neverImplementMissingFunctionality: true,
    neverAutoCorrectFailedImplementations: true,
    neverOverrideGovernance: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ901OrLater: true,
    finalQ8Gate: true,
    consumableByFutureSeries: false,
  };
}

/** Authoritative append-only in-memory report history — callers receive defensive copies. */
export class CertificationStore {
  private readonly reports = new Map<string, AffiliateCertificationReport>();
  private latestReportId: string | null = null;
  private readonly auditTrail: Array<{
    timestamp: string;
    entityId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: AffiliateCertificationReport[]) {
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
    return [...this.reports.values()].sort((a, b) => a.timestamp.localeCompare(b.timestamp)).map(cloneReport);
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

  saveReport(report: AffiliateCertificationReport, action = "produce_report") {
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
