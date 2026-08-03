import { appendDpcLog } from "./dpc-logging.js";
import type { DigitalProductsCertificationReport } from "./types.js";

/** Optional live integrations for Q5-12 Digital Products Certification. */
export type DigitalProductsCertificationDependencies = {
  executiveReportingRuntime?: {
    submitWorkerReport: (input: Record<string, unknown>) => {
      records?: Array<{ reportId?: string }>;
      engineRecord?: { lastReportType?: string | null } | null;
    };
  } | null;
  workerPerformanceReview?: {
    registerPerformanceWorker: (input: Record<string, unknown>) => unknown;
  } | null;
  workerRecoverySystem?: {
    registerRecoverableWorker: (input: Record<string, unknown>) => unknown;
  } | null;
  digitalProductsFactoryCore?: {
    getLatestMissionId?: () => string | null;
    getMissions?: () => Array<{ factoryMissionId?: string; businessId?: string }>;
  } | null;
  auditRuntime?: {
    recordCertificationEvent?: (input: Record<string, unknown>) => unknown;
  } | null;
};

export class IntegrationCoordinator {
  private deps: DigitalProductsCertificationDependencies = {};

  bindIntegrations(deps: DigitalProductsCertificationDependencies = {}) {
    this.deps = { ...deps };
  }

  submitReport(reports: DigitalProductsCertificationReport[]): {
    submitted: boolean;
    executiveReportId: string | null;
    details: string;
  } {
    const runtime = this.deps.executiveReportingRuntime;
    if (!runtime?.submitWorkerReport) {
      return {
        submitted: false,
        executiveReportId: null,
        details: "executive_reporting_runtime_unavailable",
      };
    }
    const primary = reports[reports.length - 1];
    if (!primary) {
      return {
        submitted: false,
        executiveReportId: null,
        details: "no_certification_reports_to_submit",
      };
    }
    const result = runtime.submitWorkerReport({
      reportingEntity: "digital-products-certification",
      entityType: "certification",
      missionId: "Q5-12",
      currentStatus: "digital_products_certification_report_prepared",
      progress: primary.q5ProductionReady ? 100 : 50,
      blockers: primary.outstandingIssues
        .filter((i) => i.status === "Failed" || i.status === "Missing")
        .map((i) => `blocker:${i.issueId}`),
      risks: primary.outstandingIssues
        .filter((i) => i.status === "Conditionally Certified" || i.status === "Partially Implemented")
        .map((i) => `risk:${i.issueId}`),
      evidence: [
        `certification:${primary.certificationStatus}`,
        `factory:${primary.factoryStatus}`,
        `missions:${primary.missionVerificationMatrix.length}`,
        `workers:${primary.workerVerificationMatrix.length}`,
      ],
      nextAction: "await_pillow_review_of_digital_products_certification_no_auto_fix_or_q6",
      completionStatus: "completed",
      reportType: "certification",
      validated: true,
      certificationReportCount: reports.length,
      neverAutomaticallyFixFailures: true,
      neverBeginQ6Implementation: true,
      q6ReadinessConfirmed: false,
    });
    const executiveReportId =
      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-dpc-${Date.now()}`;
    appendDpcLog({
      event: "submit_report",
      details: `reports=${reports.length} executive=${executiveReportId}`,
    });
    try {
      this.deps.auditRuntime?.recordCertificationEvent?.({
        certificationId: primary.certificationId,
        missionId: "Q5-12",
        status: primary.certificationStatus,
      });
    } catch {
      /* audit optional */
    }
    return {
      submitted: true,
      executiveReportId,
      details: "submitted_to_executive_reporting_runtime",
    };
  }
}
