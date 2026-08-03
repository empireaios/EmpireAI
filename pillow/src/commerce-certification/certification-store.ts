import { CMC_METADATA_VERSION } from "./paths.js";
import type {
  CertificationLevel,
  CommerceCertificationInput,
  CommerceCertificationReport,
  ValidationStatus,
} from "./types.js";
import type { CommerceCertificationEvaluation } from "./factory-certifier.js";

/** Authoritative in-memory Commerce Certification store — certify only. */
export class CertificationStore {
  private reports = new Map<string, CommerceCertificationReport>();

  seed(reports: CommerceCertificationReport[]) {
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

  save(report: CommerceCertificationReport) {
    this.reports.set(report.certificationId, clone(report));
    return clone(report);
  }

  buildReport(params: {
    input: CommerceCertificationInput;
    evaluation: CommerceCertificationEvaluation;
    validationStatus: ValidationStatus;
    certificationId?: string;
  }): CommerceCertificationReport {
    reportSequence += 1;
    const certificationId =
      params.certificationId?.trim() ||
      params.input.certificationId?.trim() ||
      `cmc-crt-${Date.now()}-${reportSequence}`;
    const report: CommerceCertificationReport = {
      certificationId,
      timestamp: new Date().toISOString(),
      commerceFactoryVersion: params.evaluation.commerceFactoryVersion,
      componentsTested: [...params.evaluation.componentsTested],
      componentsPassed: [...params.evaluation.componentsPassed],
      componentsFailed: [...params.evaluation.componentsFailed],
      integrationStatus: params.evaluation.integrationStatus,
      operationalReadiness: params.evaluation.operationalReadiness,
      governanceCompliance: params.evaluation.governanceCompliance,
      outstandingRisks: [...params.evaluation.outstandingRisks],
      recommendations: [...params.evaluation.recommendations],
      finalCertificationResult: params.evaluation.finalCertificationResult,
      metadataVersion: CMC_METADATA_VERSION,
      certificationTraceId: `cmc-trace-${Date.now()}-${reportSequence}`,
      validationStatus: params.validationStatus,
      componentsWarned: [...params.evaluation.componentsWarned],
      componentVerifications: params.evaluation.componentVerifications.map((v) => ({ ...v })),
      integrationVerifications: params.evaluation.integrationVerifications.map((v) => ({
        ...v,
      })),
      governanceVerifications: params.evaluation.governanceVerifications.map((v) => ({ ...v })),
      traceabilityChain: params.evaluation.traceabilityChain.map((t) => ({ ...t })),
      executiveReportingStatus: params.evaluation.executiveReportingStatus,
      q3ProductionReady: params.evaluation.q3ProductionReady,
      q4ReadinessConfirmed: params.evaluation.q4ReadinessConfirmed,
      neverOperateLiveCommerceBusiness: true,
      neverModifyCommerceFactoryComponents: true,
      neverRepairFailuresAutomatically: true,
      neverBeginQ4Implementation: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      liveCommerceBusinessOperated: false,
      commerceFactoryComponentsModified: false,
      failuresRepairedAutomatically: false,
      q4ImplementationBegun: false,
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

function clone(report: CommerceCertificationReport): CommerceCertificationReport {
  return {
    ...report,
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
