import { ANALYTICS_WORKER_IDENTITY } from "./paths.js";
import { appendAnwLog } from "./anw-logging.js";
import type {
  AnalyticsReport,
  FunnelFixture,
  IntegrationHandshake,
  OpportunityFixture,
  SeoFixture,
} from "./types.js";

export type AnalyticsWorkerDependencies = {
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
    getReports?: () => unknown[];
    getLatestReportId?: () => string | null;
  } | null;
  seoContentWorker?: {
    getReports?: () => SeoFixture[];
    getLatestReportId?: () => string | null;
  } | null;
  emailFunnelWorker?: {
    getReports?: () => FunnelFixture[];
    getLatestReportId?: () => string | null;
    getQ807ConsumableContract?: () => unknown;
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
  private deps: AnalyticsWorkerDependencies = {};

  bind(deps: AnalyticsWorkerDependencies = {}) {
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
      seo_content_worker: this.deps.seoContentWorker,
      email_funnel_worker: this.deps.emailFunnelWorker,
      executive_reporting_runtime: this.deps.executiveReportingRuntime,
      audit_runtime: this.deps.auditRuntime,
      worker_registry: this.deps.workerRegistry,
      worker_lifecycle: this.deps.workerLifecycle,
      worker_recovery_system: this.deps.workerRecoverySystem,
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
    appendAnwLog({ event: "integrations_connected", details: `n=${this.handshakes.length}` });
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

  resolveSeoReport(): SeoFixture | null {
    const reports = this.deps.seoContentWorker?.getReports?.() ?? [];
    return reports.length ? (reports[reports.length - 1] as SeoFixture) : null;
  }

  resolveFunnelReport(): FunnelFixture | null {
    const reports = this.deps.emailFunnelWorker?.getReports?.() ?? [];
    return reports.length ? (reports[reports.length - 1] as FunnelFixture) : null;
  }

  submitReport(report: AnalyticsReport): {
    submitted: boolean;
    executiveReportId: string | null;
  } {
    const runtime = this.deps.executiveReportingRuntime;
    if (!runtime?.submitWorkerReport) {
      return { submitted: false, executiveReportId: null };
    }
    const result = runtime.submitWorkerReport({
      workerId: ANALYTICS_WORKER_IDENTITY.workerId,
      workerName: ANALYTICS_WORKER_IDENTITY.workerName,
      reportType: "analytics_report",
      missionId: "Q8-07",
      report,
    });
    const executiveReportId = result.records?.[0]?.reportId ?? report.reportId;
    appendAnwLog({ event: "err_submit", details: `id=${executiveReportId}` });
    return { submitted: true, executiveReportId };
  }

  private registerIdentity() {
    const identity = {
      workerId: ANALYTICS_WORKER_IDENTITY.workerId,
      workerName: ANALYTICS_WORKER_IDENTITY.workerName,
      workerType: ANALYTICS_WORKER_IDENTITY.workerType,
      department: ANALYTICS_WORKER_IDENTITY.department,
      factory: ANALYTICS_WORKER_IDENTITY.factory,
      role: ANALYTICS_WORKER_IDENTITY.role,
      missionId: "Q8-07",
      doctrine: "PILLOW-ANW-001",
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
