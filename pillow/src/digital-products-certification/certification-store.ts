import { DPC_METADATA_VERSION, DPC_REPORT_VERSION } from "./paths.js";
import type {
  CertificationStatus,
  DigitalProductsCertificationInput,
  DigitalProductsCertificationReport,
  ValidationStatus,
} from "./types.js";
import type { DigitalProductsCertificationEvaluation } from "./factory-certifier.js";

/** Authoritative in-memory Digital Products Certification store — certify only. */
export class CertificationStore {
  private reports = new Map<string, DigitalProductsCertificationReport>();

  seed(reports: DigitalProductsCertificationReport[]) {
    this.reports.clear();
    for (const report of reports) {
      this.reports.set(report.certificationId, clone(report));
    }
  }

  count() {
    return this.reports.size;
  }

  countByStatus(status: CertificationStatus | string) {
    return this.list().filter((r) => r.certificationStatus === status).length;
  }

  failedCount() {
    return this.list().filter((r) => r.certificationStatus === "Failed").length;
  }

  list() {
    return [...this.reports.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(clone);
  }

  get(certificationId: string) {
    const report = this.reports.get(certificationId);
    return report ? clone(report) : null;
  }

  save(report: DigitalProductsCertificationReport) {
    this.reports.set(report.certificationId, clone(report));
    return clone(report);
  }

  buildReport(params: {
    input: DigitalProductsCertificationInput;
    evaluation: DigitalProductsCertificationEvaluation;
    validationStatus: ValidationStatus;
    certificationId?: string;
    submittedToExecutiveReporting?: boolean;
    executiveReportId?: string | null;
  }): DigitalProductsCertificationReport {
    reportSequence += 1;
    const certificationId =
      params.certificationId?.trim() ||
      params.input.certificationId?.trim() ||
      `dpc-crt-${Date.now()}-${reportSequence}`;
    const report: DigitalProductsCertificationReport = {
      certificationId,
      timestamp: new Date().toISOString(),
      reportVersion: DPC_REPORT_VERSION,
      factoryVersion: params.evaluation.factoryVersion,
      factoryStatus: params.evaluation.factoryStatus,
      digitalProductsTested: [...params.evaluation.digitalProductsTested],
      missionVerificationMatrix: params.evaluation.missionVerificationMatrix.map((m) => ({
        ...m,
      })),
      workerVerificationMatrix: params.evaluation.workerVerificationMatrix.map((w) => ({
        ...w,
      })),
      integrationResults: params.evaluation.integrationVerifications.map((v) => ({ ...v })),
      endToEndWorkflowResults: params.evaluation.endToEndWorkflowResults.map((w) => ({ ...w })),
      failureRecoveryResults: { ...params.evaluation.failureRecoveryResults },
      governanceResults: params.evaluation.governanceResults.map((v) => ({ ...v })),
      outstandingIssues: params.evaluation.outstandingIssues.map((i) => ({ ...i })),
      certificationStatus: params.evaluation.certificationStatus,
      executiveSummary: params.evaluation.executiveSummary,
      metadataVersion: DPC_METADATA_VERSION,
      certificationTraceId: `dpc-trace-${Date.now()}-${reportSequence}`,
      validationStatus: params.validationStatus,
      componentVerifications: params.evaluation.componentVerifications.map((v) => ({ ...v })),
      integrationVerifications: params.evaluation.integrationVerifications.map((v) => ({ ...v })),
      governanceVerifications: params.evaluation.governanceVerifications.map((v) => ({ ...v })),
      traceabilityChain: params.evaluation.traceabilityChain.map((t) => ({ ...t })),
      recommendations: [...params.evaluation.recommendations],
      q5ProductionReady: params.evaluation.q5ProductionReady,
      q6ReadinessConfirmed: false,
      executiveReportingStatus: params.evaluation.executiveReportingStatus,
      failureRecoveryStatus: params.evaluation.failureRecoveryStatus,
      submittedToExecutiveReporting: params.submittedToExecutiveReporting ?? false,
      executiveReportId: params.executiveReportId ?? null,
      neverAutomaticallyFixFailures: true,
      neverAutomaticallyCertifyIncompleteWork: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverBeginQ6Implementation: true,
      neverAssumeImplementation: true,
      failuresFixedAutomatically: false,
      incompleteWorkAutoCertified: false,
      q6ImplementationBegun: false,
      implementationAssumed: false,
      pillowOverridden: false,
      grandKingOverridden: false,
      preserveCompleteTraceability: true,
      preserveAuditHistory: true,
      reportEveryDeviationHonestly: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
    return this.save(report);
  }
}

let reportSequence = 0;

export function resetCertificationSequenceForTesting() {
  reportSequence = 0;
}

function clone(report: DigitalProductsCertificationReport): DigitalProductsCertificationReport {
  return {
    ...report,
    digitalProductsTested: [...report.digitalProductsTested],
    missionVerificationMatrix: report.missionVerificationMatrix.map((m) => ({ ...m })),
    workerVerificationMatrix: report.workerVerificationMatrix.map((w) => ({ ...w })),
    integrationResults: report.integrationResults.map((v) => ({ ...v })),
    endToEndWorkflowResults: report.endToEndWorkflowResults.map((w) => ({ ...w })),
    governanceResults: report.governanceResults.map((v) => ({ ...v })),
    outstandingIssues: report.outstandingIssues.map((i) => ({ ...i })),
    recommendations: [...report.recommendations],
    componentVerifications: report.componentVerifications.map((v) => ({ ...v })),
    integrationVerifications: report.integrationVerifications.map((v) => ({ ...v })),
    governanceVerifications: report.governanceVerifications.map((v) => ({ ...v })),
    traceabilityChain: report.traceabilityChain.map((t) => ({ ...t })),
    failureRecoveryResults: { ...report.failureRecoveryResults },
  };
}
