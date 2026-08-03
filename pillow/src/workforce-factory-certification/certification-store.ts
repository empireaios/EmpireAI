import { WFC_METADATA_VERSION } from "./paths.js";
import type {
  CertificationLevel,
  ValidationStatus,
  WorkforceFactoryCertificationInput,
  WorkforceFactoryCertificationReport,
} from "./types.js";
import type { FactoryCertificationEvaluation } from "./factory-certifier.js";

/** Authoritative in-memory Workforce Factory Certification store — certify only. */
export class CertificationStore {
  private reports = new Map<string, WorkforceFactoryCertificationReport>();

  seed(reports: WorkforceFactoryCertificationReport[]) {
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

  save(report: WorkforceFactoryCertificationReport) {
    this.reports.set(report.certificationId, clone(report));
    return clone(report);
  }

  buildReport(params: {
    input: WorkforceFactoryCertificationInput;
    evaluation: FactoryCertificationEvaluation;
    validationStatus: ValidationStatus;
    certificationId?: string;
  }): WorkforceFactoryCertificationReport {
    reportSequence += 1;
    const certificationId =
      params.certificationId?.trim() ||
      params.input.certificationId?.trim() ||
      `wfc-cr-${Date.now()}-${reportSequence}`;
    const report: WorkforceFactoryCertificationReport = {
      certificationId,
      timestamp: new Date().toISOString(),
      workforceFactoryVersion: params.evaluation.workforceFactoryVersion,
      componentsTested: [...params.evaluation.componentsTested],
      componentsPassed: [...params.evaluation.componentsPassed],
      componentsFailed: [...params.evaluation.componentsFailed],
      integrationStatus: params.evaluation.integrationStatus,
      workforceReadiness: params.evaluation.workforceReadiness,
      governanceCompliance: params.evaluation.governanceCompliance,
      remainingRisks: [...params.evaluation.remainingRisks],
      recommendations: [...params.evaluation.recommendations],
      finalCertificationResult: params.evaluation.finalCertificationResult,
      metadataVersion: WFC_METADATA_VERSION,
      certificationTraceId: `wfc-trace-${Date.now()}-${reportSequence}`,
      validationStatus: params.validationStatus,
      componentsWarned: [...params.evaluation.componentsWarned],
      componentVerifications: params.evaluation.componentVerifications.map((v) => ({ ...v })),
      integrationVerifications: params.evaluation.integrationVerifications.map((v) => ({
        ...v,
      })),
      governanceVerifications: params.evaluation.governanceVerifications.map((v) => ({ ...v })),
      q1ProductionReady: params.evaluation.q1ProductionReady,
      q2ReadinessConfirmed: params.evaluation.q2ReadinessConfirmed,
      neverExecuteWorkerTasks: true,
      neverModifyWorkforceComponents: true,
      neverRepairFailuresAutomatically: true,
      neverBeginQ2Implementation: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      workerTasksExecuted: false,
      workforceComponentsModified: false,
      failuresRepairedAutomatically: false,
      q2ImplementationBegun: false,
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

function clone(report: WorkforceFactoryCertificationReport): WorkforceFactoryCertificationReport {
  return {
    ...report,
    componentsTested: [...report.componentsTested],
    componentsPassed: [...report.componentsPassed],
    componentsFailed: [...report.componentsFailed],
    componentsWarned: [...report.componentsWarned],
    remainingRisks: [...report.remainingRisks],
    recommendations: [...report.recommendations],
    componentVerifications: report.componentVerifications.map((v) => ({ ...v })),
    integrationVerifications: report.integrationVerifications.map((v) => ({ ...v })),
    governanceVerifications: report.governanceVerifications.map((v) => ({ ...v })),
  };
}
