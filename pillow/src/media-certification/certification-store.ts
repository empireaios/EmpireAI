import { MDC_METADATA_VERSION } from "./paths.js";
import type {
  CertificationLevel,
  MediaCertificationInput,
  MediaCertificationReport,
  ValidationStatus,
} from "./types.js";
import type { MediaCertificationEvaluation } from "./factory-certifier.js";

/** Authoritative in-memory Media Certification store — certify only. */
export class CertificationStore {
  private reports = new Map<string, MediaCertificationReport>();

  seed(reports: MediaCertificationReport[]) {
    this.reports.clear();
    for (const report of reports) {
      this.reports.set(report.certificationId, clone(report));
    }
  }

  count() {
    return this.reports.size;
  }

  countByResult(result: CertificationLevel | string) {
    return this.list().filter((r) => r.finalCertificationResult === result).length;
  }

  failedCount() {
    return this.list().filter((r) => r.finalCertificationResult === "failed_certification")
      .length;
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

  save(report: MediaCertificationReport) {
    this.reports.set(report.certificationId, clone(report));
    return clone(report);
  }

  buildReport(params: {
    input: MediaCertificationInput;
    evaluation: MediaCertificationEvaluation;
    validationStatus: ValidationStatus;
    certificationId?: string;
  }): MediaCertificationReport {
    reportSequence += 1;
    const certificationId =
      params.certificationId?.trim() ||
      params.input.certificationId?.trim() ||
      `mdc-crt-${Date.now()}-${reportSequence}`;
    const report: MediaCertificationReport = {
      certificationId,
      timestamp: new Date().toISOString(),
      mediaFactoryVersion: params.evaluation.mediaFactoryVersion,
      mediaBusinessesTested: [...params.evaluation.mediaBusinessesTested],
      componentsTested: [...params.evaluation.componentsTested],
      componentsPassed: [...params.evaluation.componentsPassed],
      componentsFailed: [...params.evaluation.componentsFailed],
      integrationStatus: params.evaluation.integrationStatus,
      autonomousOperationStatus: params.evaluation.autonomousOperationStatus,
      governanceCompliance: params.evaluation.governanceCompliance,
      outstandingRisks: [...params.evaluation.outstandingRisks],
      recommendations: [...params.evaluation.recommendations],
      finalCertificationResult: params.evaluation.finalCertificationResult,
      metadataVersion: MDC_METADATA_VERSION,
      certificationTraceId: `mdc-trace-${Date.now()}-${reportSequence}`,
      validationStatus: params.validationStatus,
      componentsWarned: [...params.evaluation.componentsWarned],
      componentVerifications: params.evaluation.componentVerifications.map((v) => ({ ...v })),
      integrationVerifications: params.evaluation.integrationVerifications.map((v) => ({
        ...v,
      })),
      governanceVerifications: params.evaluation.governanceVerifications.map((v) => ({ ...v })),
      traceabilityChain: params.evaluation.traceabilityChain.map((t) => ({ ...t })),
      executiveReportingStatus: params.evaluation.executiveReportingStatus,
      q4ProductionReady: params.evaluation.q4ProductionReady,
      q5ReadinessConfirmed: params.evaluation.q5ReadinessConfirmed,
      neverPublishMedia: true,
      neverModifyMediaFactoryComponents: true,
      neverRepairFailuresAutomatically: true,
      neverBeginQ5Implementation: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      mediaPublished: false,
      mediaFactoryComponentsModified: false,
      failuresRepairedAutomatically: false,
      q5ImplementationBegun: false,
      pillowOverridden: false,
      grandKingOverridden: false,
      preserveCertificationTraceability: true,
      preserveAuditability: true,
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

function clone(report: MediaCertificationReport): MediaCertificationReport {
  return {
    ...report,
    mediaBusinessesTested: [...report.mediaBusinessesTested],
    componentsTested: [...report.componentsTested],
    componentsPassed: [...report.componentsPassed],
    componentsFailed: [...report.componentsFailed],
    componentsWarned: [...report.componentsWarned],
    outstandingRisks: [...report.outstandingRisks],
    recommendations: [...report.recommendations],
    componentVerifications: report.componentVerifications.map((v) => ({ ...v })),
    integrationVerifications: report.integrationVerifications.map((v) => ({ ...v })),
    governanceVerifications: report.governanceVerifications.map((v) => ({ ...v })),
    traceabilityChain: report.traceabilityChain.map((t) => ({ ...t })),
  };
}
