import { UWC_METADATA_VERSION } from "./paths.js";
import type {
  CertificationLevel,
  UnifiedCertificationReport,
  UnifiedWorkforceCertificationInput,
  ValidationStatus,
} from "./types.js";
import type { FactoryCertificationEvaluation } from "./factory-certifier.js";

/** Authoritative in-memory Unified Workforce Certification store — certify only. */
export class CertificationStore {
  private reports = new Map<string, UnifiedCertificationReport>();

  seed(reports: UnifiedCertificationReport[]) {
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

  save(report: UnifiedCertificationReport) {
    this.reports.set(report.certificationId, clone(report));
    return clone(report);
  }

  buildReport(params: {
    input: UnifiedWorkforceCertificationInput;
    evaluation: FactoryCertificationEvaluation;
    validationStatus: ValidationStatus;
    certificationId?: string;
  }): UnifiedCertificationReport {
    reportSequence += 1;
    const certificationId =
      params.certificationId?.trim() ||
      params.input.certificationId?.trim() ||
      `uwc-cr-${Date.now()}-${reportSequence}`;
    const report: UnifiedCertificationReport = {
      certificationId,
      timestamp: new Date().toISOString(),
      executiveFactoryVersion: params.evaluation.executiveFactoryVersion,
      executiveComponentsTested: [...params.evaluation.executiveComponentsTested],
      componentsPassed: [...params.evaluation.componentsPassed],
      componentsFailed: [...params.evaluation.componentsFailed],
      integrationStatus: params.evaluation.integrationStatus,
      readinessAssessment: params.evaluation.readinessAssessment,
      executiveHealth: params.evaluation.executiveHealth,
      remainingRisks: [...params.evaluation.remainingRisks],
      recommendations: [...params.evaluation.recommendations],
      finalCertificationResult: params.evaluation.finalCertificationResult,
      metadataVersion: UWC_METADATA_VERSION,
      certificationTraceId: `uwc-trace-${Date.now()}-${reportSequence}`,
      validationStatus: params.validationStatus,
      componentsWarned: [...params.evaluation.componentsWarned],
      componentVerifications: params.evaluation.componentVerifications.map((v) => ({ ...v })),
      integrationVerifications: params.evaluation.integrationVerifications.map((v) => ({
        ...v,
      })),
      q0ProductionReady: params.evaluation.q0ProductionReady,
      neverExecuteWorkerTasks: true,
      neverModifyExecutiveComponents: true,
      neverRepairFailuresAutomatically: true,
      neverBeginQ1Implementation: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      workerTasksExecuted: false,
      executiveComponentsModified: false,
      failuresRepairedAutomatically: false,
      q1ImplementationBegun: false,
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

function clone(report: UnifiedCertificationReport): UnifiedCertificationReport {
  return {
    ...report,
    executiveComponentsTested: [...report.executiveComponentsTested],
    componentsPassed: [...report.componentsPassed],
    componentsFailed: [...report.componentsFailed],
    componentsWarned: [...report.componentsWarned],
    remainingRisks: [...report.remainingRisks],
    recommendations: [...report.recommendations],
    componentVerifications: report.componentVerifications.map((v) => ({ ...v })),
    integrationVerifications: report.integrationVerifications.map((v) => ({ ...v })),
  };
}
