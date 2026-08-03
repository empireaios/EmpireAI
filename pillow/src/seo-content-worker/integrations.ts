import { SEO_CONTENT_WORKER_IDENTITY } from "./paths.js";
import { appendSeowLog } from "./seow-logging.js";
import type {
  IntegrationHandshake,
  OpportunityFixture,
  ReviewFixture,
  SeoContentReport,
} from "./types.js";

export type SeoContentWorkerDependencies = {
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
  } | null;
  comparisonSiteWorker?: {
    getReports?: () => unknown[];
    getLatestReportId?: () => string | null;
  } | null;
  reviewContentWorker?: {
    getReports?: () => ReviewFixture[];
    getLatestReportId?: () => string | null;
    getQ805ConsumableContract?: () => unknown;
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
  private deps: SeoContentWorkerDependencies = {};

  bind(deps: SeoContentWorkerDependencies = {}) {
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
      review_content_worker: this.deps.reviewContentWorker,
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
    appendSeowLog({ event: "integrations_connected", details: `n=${this.handshakes.length}` });
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

  resolveReviewReport(): ReviewFixture | null {
    const reports = this.deps.reviewContentWorker?.getReports?.() ?? [];
    return reports.length ? (reports[reports.length - 1] as ReviewFixture) : null;
  }

  submitReport(report: SeoContentReport): {
    submitted: boolean;
    executiveReportId: string | null;
  } {
    const runtime = this.deps.executiveReportingRuntime;
    if (!runtime?.submitWorkerReport) {
      return { submitted: false, executiveReportId: null };
    }
    const result = runtime.submitWorkerReport({
      workerId: SEO_CONTENT_WORKER_IDENTITY.workerId,
      workerName: SEO_CONTENT_WORKER_IDENTITY.workerName,
      reportType: "seo_content_report",
      missionId: "Q8-05",
      report,
    });
    const executiveReportId = result.records?.[0]?.reportId ?? report.reportId;
    appendSeowLog({ event: "err_submit", details: `id=${executiveReportId}` });
    return { submitted: true, executiveReportId };
  }

  private registerIdentity() {
    const identity = {
      workerId: SEO_CONTENT_WORKER_IDENTITY.workerId,
      workerName: SEO_CONTENT_WORKER_IDENTITY.workerName,
      workerType: SEO_CONTENT_WORKER_IDENTITY.workerType,
      department: SEO_CONTENT_WORKER_IDENTITY.department,
      factory: SEO_CONTENT_WORKER_IDENTITY.factory,
      role: SEO_CONTENT_WORKER_IDENTITY.role,
      missionId: "Q8-05",
      doctrine: "PILLOW-SEOW-001",
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
