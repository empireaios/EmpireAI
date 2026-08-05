import type { SecurityAuditReport } from "./types.js";

let reportSeq = 0;

export function nextReportId() {
  reportSeq += 1;
  return `secart-rpt-${String(reportSeq).padStart(4, "0")}`;
}

export function resetSecartSequenceForTesting() {
  reportSeq = 0;
}

function cloneReport(report: SecurityAuditReport): SecurityAuditReport {
  return {
    ...report,
    supportingEvidence: [...report.supportingEvidence],
    outstandingRisks: [...report.outstandingRisks],
    criticalFindings: [...report.criticalFindings],
    authenticationSummary: { ...report.authenticationSummary, evidence: [...report.authenticationSummary.evidence] },
    authorizationSummary: { ...report.authorizationSummary, evidence: [...report.authorizationSummary.evidence] },
    secretManagementSummary: {
      ...report.secretManagementSummary,
      evidence: [...report.secretManagementSummary.evidence],
    },
    apiSecuritySummary: { ...report.apiSecuritySummary, evidence: [...report.apiSecuritySummary.evidence] },
    dataProtectionSummary: { ...report.dataProtectionSummary, evidence: [...report.dataProtectionSummary.evidence] },
    runtimeSecuritySummary: {
      ...report.runtimeSecuritySummary,
      evidence: [...report.runtimeSecuritySummary.evidence],
    },
    operationalSecuritySummary: {
      ...report.operationalSecuritySummary,
      evidence: [...report.operationalSecuritySummary.evidence],
    },
    governanceSummary: { ...report.governanceSummary, evidence: [...report.governanceSummary.evidence] },
    securityReadinessSummary: {
      ...report.securityReadinessSummary,
      notes: [...report.securityReadinessSummary.notes],
      evidence: [...report.securityReadinessSummary.evidence],
    },
    q1105ContractConsumed: { ...report.q1105ContractConsumed, fields: [...report.q1105ContractConsumed.fields] },
    componentInventory: report.componentInventory.map((c) => ({ ...c })),
    assessments: report.assessments.map((r) => ({ ...r, supportingEvidence: [...r.supportingEvidence] })),
    integrationSummary: {
      ...report.integrationSummary,
      rows: report.integrationSummary.rows.map((r) => ({ ...r })),
      evidence: [...report.integrationSummary.evidence],
    },
    findings: [...report.findings],
    traceabilityRefs: [...report.traceabilityRefs],
    validation: {
      ...report.validation,
      errors: [...report.validation.errors],
      warnings: [...report.validation.warnings],
    },
    structuralSignalOnly: true,
    evidenceBasedOnly: true,
    preserveCompleteTraceability: true,
    preserveImmutableAuditHistory: true,
    preserveAuditHistory: true,
    deterministicAuditBehaviour: true,
    maskSensitiveValues: true,
    neverFabricateSecurityEvidence: true,
    neverCertifyInsecureImplementations: true,
    neverExposeSecretsDuringAuditing: true,
    neverAssumeImplementation: true,
    neverModifySecurityImplementations: true,
    neverRepairFailedSecurityComponents: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1106OrLater: true,
    fifthQ11Gate: true,
  };
}

export class AuditStore {
  private readonly reports = new Map<string, SecurityAuditReport>();
  private latestReportId: string | null = null;
  private readonly auditTrail: Array<{
    timestamp: string;
    entityId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: SecurityAuditReport[]) {
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
        details: `seeded report decision=${report.decision}`,
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

  saveReport(report: SecurityAuditReport, action = "produce_report") {
    this.reports.set(report.reportId, cloneReport(report));
    this.latestReportId = report.reportId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      entityId: report.reportId,
      action,
      details: `decision=${report.decision} confidence=${report.confidenceScore}`,
    });
    return this.getReport(report.reportId)!;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }
}
