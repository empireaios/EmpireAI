import { REVIEW_CONTENT_WORKER_IDENTITY } from "./paths.js";
import { appendRcwLog } from "./rcw-logging.js";
import type {
  ComparisonFixture,
  IntegrationHandshake,
  OpportunityFixture,
  ReviewContentReport,
} from "./types.js";

export type ReviewContentWorkerDependencies = {
  affiliateFactoryCore?: {
    getProjects?: () => Array<{
      affiliateBusinessId?: string;
      factoryProjectId?: string;
      businessName?: string;
    }>;
    getLatestAffiliateBusinessId?: () => string | null;
  } | null;
  affiliateOpportunityWorker?: {
    getReports?: () => OpportunityFixture[];
    getLatestReportId?: () => string | null;
    getQ803ConsumableContract?: () => unknown;
  } | null;
  comparisonSiteWorker?: {
    getReports?: () => ComparisonFixture[];
    getLatestReportId?: () => string | null;
    getQ804ConsumableContract?: () => unknown;
  } | null;
  workerRegistry?: {
    registerWorker: (input: Record<string, unknown>) => unknown;
  } | null;
  workerLifecycle?: {
    createWorker: (input: Record<string, unknown>) => unknown;
    activateWorker: (input: Record<string, unknown>) => unknown;
  } | null;
  executiveReportingRuntime?: {
    submitWorkerReport: (input: Record<string, unknown>) => {
      records?: Array<{ reportId?: string }>;
    };
  } | null;
  workerRecoverySystem?: {
    registerRecoverableWorker: (input: Record<string, unknown>) => unknown;
  } | null;
  auditRuntime?: {
    recordAuditEvent?: (input: Record<string, unknown>) => unknown;
  } | null;
};

export class IntegrationCoordinator {
  private handshakes: IntegrationHandshake[] = [];
  private deps: ReviewContentWorkerDependencies = {};

  bind(deps: ReviewContentWorkerDependencies = {}) {
    this.deps = { ...deps };
  }

  getDependencies() {
    return this.deps;
  }

  getHandshakes() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  connect(targets: readonly string[] = []) {
    this.handshakes = [];
    const now = new Date().toISOString();
    const map: Record<string, unknown> = {
      affiliate_factory_core: this.deps.affiliateFactoryCore,
      affiliate_opportunity_worker: this.deps.affiliateOpportunityWorker,
      comparison_site_worker: this.deps.comparisonSiteWorker,
      worker_registry: this.deps.workerRegistry,
      worker_lifecycle: this.deps.workerLifecycle,
      executive_reporting_runtime: this.deps.executiveReportingRuntime,
      worker_recovery_system: this.deps.workerRecoverySystem,
      audit_runtime: this.deps.auditRuntime,
    };
    for (const target of targets) {
      const handle = map[target];
      this.handshakes.push({
        target,
        status: handle ? "bound" : "unavailable",
        timestamp: now,
        detail: handle ? `${target} bound` : `${target} not injected`,
      });
    }
    this.registerIdentity();
    appendRcwLog({ event: "integrations_connected", details: `n=${this.handshakes.length}` });
    return this.getHandshakes();
  }

  resolveAffiliateBusinessId(inputId?: string | null): string | null {
    if (inputId?.trim()) return inputId.trim();
    return this.deps.affiliateFactoryCore?.getLatestAffiliateBusinessId?.() ?? null;
  }

  resolveOpportunityReport(): OpportunityFixture | null {
    const reports = this.deps.affiliateOpportunityWorker?.getReports?.() ?? [];
    return reports.length ? (reports[reports.length - 1] as OpportunityFixture) : null;
  }

  resolveComparisonReport(): ComparisonFixture | null {
    const reports = this.deps.comparisonSiteWorker?.getReports?.() ?? [];
    return reports.length ? (reports[reports.length - 1] as ComparisonFixture) : null;
  }

  submitReport(report: ReviewContentReport): {
    submitted: boolean;
    executiveReportId: string | null;
  } {
    const runtime = this.deps.executiveReportingRuntime;
    if (!runtime?.submitWorkerReport) {
      return { submitted: false, executiveReportId: null };
    }
    const result = runtime.submitWorkerReport({
      workerId: REVIEW_CONTENT_WORKER_IDENTITY.workerId,
      workerName: REVIEW_CONTENT_WORKER_IDENTITY.workerName,
      reportType: "review_content_report",
      missionId: "Q8-04",
      report,
    });
    const executiveReportId = result.records?.[0]?.reportId ?? report.reportId;
    appendRcwLog({ event: "err_submit", details: `id=${executiveReportId}` });
    return { submitted: true, executiveReportId };
  }

  private registerIdentity() {
    const identity = {
      workerId: REVIEW_CONTENT_WORKER_IDENTITY.workerId,
      workerName: REVIEW_CONTENT_WORKER_IDENTITY.workerName,
      workerType: REVIEW_CONTENT_WORKER_IDENTITY.workerType,
      department: REVIEW_CONTENT_WORKER_IDENTITY.department,
      factory: REVIEW_CONTENT_WORKER_IDENTITY.factory,
      role: REVIEW_CONTENT_WORKER_IDENTITY.role,
      missionId: "Q8-04",
      doctrine: "PILLOW-RCW-001",
    };
    try {
      this.deps.workerRegistry?.registerWorker?.(identity);
    } catch {
      /* optional */
    }
    try {
      this.deps.workerLifecycle?.createWorker?.(identity);
      this.deps.workerLifecycle?.activateWorker?.({ workerId: identity.workerId });
    } catch {
      /* optional */
    }
    try {
      this.deps.workerRecoverySystem?.registerRecoverableWorker?.(identity);
    } catch {
      /* optional */
    }
  }
}
