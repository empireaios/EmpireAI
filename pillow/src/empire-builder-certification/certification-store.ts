import { EBC_METADATA_VERSION } from "./paths.js";
import type {
  CertificationLevel,
  EmpireBuilderCertificationInput,
  EmpireBuilderCertificationReport,
  ValidationStatus,
} from "./types.js";
import type { EmpireBuilderCertificationEvaluation } from "./factory-certifier.js";

/** Authoritative in-memory Empire Builder Certification store — certify only. */
export class CertificationStore {
  private reports = new Map<string, EmpireBuilderCertificationReport>();

  seed(reports: EmpireBuilderCertificationReport[]) {
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

  save(report: EmpireBuilderCertificationReport) {
    this.reports.set(report.certificationId, clone(report));
    return clone(report);
  }

  buildReport(params: {
    input: EmpireBuilderCertificationInput;
    evaluation: EmpireBuilderCertificationEvaluation;
    validationStatus: ValidationStatus;
    certificationId?: string;
  }): EmpireBuilderCertificationReport {
    reportSequence += 1;
    const certificationId =
      params.certificationId?.trim() ||
      params.input.certificationId?.trim() ||
      `ebc-cr-${Date.now()}-${reportSequence}`;
    const report: EmpireBuilderCertificationReport = {
      certificationId,
      timestamp: new Date().toISOString(),
      empireBuilderFactoryVersion: params.evaluation.empireBuilderFactoryVersion,
      originalGrandKingCommand: params.evaluation.originalGrandKingCommand,
      componentsTested: [...params.evaluation.componentsTested],
      componentsPassed: [...params.evaluation.componentsPassed],
      componentsFailed: [...params.evaluation.componentsFailed],
      integrationStatus: params.evaluation.integrationStatus,
      planningCompleteness: params.evaluation.planningCompleteness,
      governanceCompliance: params.evaluation.governanceCompliance,
      outstandingRisks: [...params.evaluation.outstandingRisks],
      recommendations: [...params.evaluation.recommendations],
      finalCertificationResult: params.evaluation.finalCertificationResult,
      metadataVersion: EBC_METADATA_VERSION,
      certificationTraceId: `ebc-trace-${Date.now()}-${reportSequence}`,
      validationStatus: params.validationStatus,
      componentsWarned: [...params.evaluation.componentsWarned],
      componentVerifications: params.evaluation.componentVerifications.map((v) => ({ ...v })),
      integrationVerifications: params.evaluation.integrationVerifications.map((v) => ({
        ...v,
      })),
      governanceVerifications: params.evaluation.governanceVerifications.map((v) => ({ ...v })),
      traceabilityChain: params.evaluation.traceabilityChain.map((t) => ({ ...t })),
      executiveReportingStatus: params.evaluation.executiveReportingStatus,
      q2ProductionReady: params.evaluation.q2ProductionReady,
      q3ReadinessConfirmed: params.evaluation.q3ReadinessConfirmed,
      neverExecuteBusinessImplementation: true,
      neverModifyFactoryComponents: true,
      neverRepairFailuresAutomatically: true,
      neverBeginQ3Implementation: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      businessImplementationExecuted: false,
      factoryComponentsModified: false,
      failuresRepairedAutomatically: false,
      q3ImplementationBegun: false,
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

function clone(report: EmpireBuilderCertificationReport): EmpireBuilderCertificationReport {
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
