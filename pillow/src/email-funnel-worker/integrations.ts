import { EMAIL_FUNNEL_WORKER_IDENTITY } from "./paths.js";
import { appendEfwLog } from "./efw-logging.js";
import type {
  EmailFunnelReport,
  IntegrationHandshake,
  OpportunityFixture,
  ReviewFixture,
  SeoFixture,
} from "./types.js";

export type EmailFunnelWorkerDependencies = {
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
  reviewContentWorker?: {
    getReports?: () => ReviewFixture[];
    getLatestReportId?: () => string | null;
  } | null;
  seoContentWorker?: {
    getReports?: () => SeoFixture[];
    getLatestReportId?: () => string | null;
    getQ806ConsumableContract?: () => unknown;
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
  private deps: EmailFunnelWorkerDependencies = {};

  bind(deps: EmailFunnelWorkerDependencies = {}) {
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
      review_content_worker: this.deps.reviewContentWorker,
      seo_content_worker: this.deps.seoContentWorker,
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
    appendEfwLog({ event: "integrations_connected", details: `n=${this.handshakes.length}` });
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

  resolveReviewReport(): ReviewFixture | null {
    const reports = this.deps.reviewContentWorker?.getReports?.() ?? [];
    return reports.length ? (reports[reports.length - 1] as ReviewFixture) : null;
  }

  submitReport(report: EmailFunnelReport): {
    submitted: boolean;
    executiveReportId: string | null;
  } {
    const runtime = this.deps.executiveReportingRuntime;
    if (!runtime?.submitWorkerReport) {
      return { submitted: false, executiveReportId: null };
    }
    const result = runtime.submitWorkerReport({
      workerId: EMAIL_FUNNEL_WORKER_IDENTITY.workerId,
      workerName: EMAIL_FUNNEL_WORKER_IDENTITY.workerName,
      reportType: "email_funnel_report",
      missionId: "Q8-06",
      report,
    });
    const executiveReportId = result.records?.[0]?.reportId ?? report.reportId;
    appendEfwLog({ event: "err_submit", details: `id=${executiveReportId}` });
    return { submitted: true, executiveReportId };
  }

  private registerIdentity() {
    const identity = {
      workerId: EMAIL_FUNNEL_WORKER_IDENTITY.workerId,
      workerName: EMAIL_FUNNEL_WORKER_IDENTITY.workerName,
      workerType: EMAIL_FUNNEL_WORKER_IDENTITY.workerType,
      department: EMAIL_FUNNEL_WORKER_IDENTITY.department,
      factory: EMAIL_FUNNEL_WORKER_IDENTITY.factory,
      role: EMAIL_FUNNEL_WORKER_IDENTITY.role,
      missionId: "Q8-06",
      doctrine: "PILLOW-EFW-001",
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
