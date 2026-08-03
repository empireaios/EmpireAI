import { AFFILIATE_OPPORTUNITY_WORKER_IDENTITY } from "./paths.js";
import { appendAowLog } from "./aow-logging.js";
import type {
  AffiliateOpportunityReport,
  IntegrationHandshake,
  IntegrationTarget,
} from "./types.js";

export type AffiliateOpportunityWorkerDependencies = {
  affiliateFactoryCore?: {
    getProjects?: () => Array<{
      affiliateBusinessId?: string;
      factoryProjectId?: string;
      businessName?: string;
      businessCategory?: string;
    }>;
    getLatestAffiliateBusinessId?: () => string | null;
    getQ802ConsumableContract?: () => unknown;
    getReports?: () => unknown[];
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
      engineRecord?: { lastReportType?: string | null } | null;
    };
  } | null;
  workerRecoverySystem?: {
    registerRecoverableWorker: (input: Record<string, unknown>) => unknown;
  } | null;
  auditRuntime?: {
    recordAuditEvent?: (input: Record<string, unknown>) => unknown;
  } | null;
  memoryRuntime?: {
    remember?: (input: Record<string, unknown>) => unknown;
  } | null;
};

export class IntegrationCoordinator {
  private handshakes: IntegrationHandshake[] = [];
  private deps: AffiliateOpportunityWorkerDependencies = {};

  bind(deps: AffiliateOpportunityWorkerDependencies = {}) {
    this.deps = { ...deps };
  }

  getDependencies() {
    return this.deps;
  }

  getHandshakes() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  connect(targets: readonly IntegrationTarget[] = []) {
    this.handshakes = [];
    const now = new Date().toISOString();
    const map: Record<string, unknown> = {
      affiliate_factory_core: this.deps.affiliateFactoryCore,
      worker_registry: this.deps.workerRegistry,
      worker_lifecycle: this.deps.workerLifecycle,
      executive_reporting_runtime: this.deps.executiveReportingRuntime,
      worker_recovery_system: this.deps.workerRecoverySystem,
      audit_runtime: this.deps.auditRuntime,
    };
    for (const target of targets) {
      const handle = map[target];
      const status = handle ? ("bound" as const) : ("unavailable" as const);
      this.handshakes.push({
        target,
        status,
        timestamp: now,
        detail: handle ? `${target} bound` : `${target} not injected`,
      });
    }
    this.registerIdentity();
    appendAowLog({
      event: "integrations_connected",
      details: `handshakes=${this.handshakes.length}`,
    });
    return this.getHandshakes();
  }

  resolveAffiliateBusinessId(inputBusinessId?: string | null): string | null {
    if (inputBusinessId?.trim()) return inputBusinessId.trim();
    return this.deps.affiliateFactoryCore?.getLatestAffiliateBusinessId?.() ?? null;
  }

  submitReport(report: AffiliateOpportunityReport): {
    submitted: boolean;
    executiveReportId: string | null;
  } {
    const runtime = this.deps.executiveReportingRuntime;
    if (!runtime?.submitWorkerReport) {
      return { submitted: false, executiveReportId: null };
    }
    const result = runtime.submitWorkerReport({
      workerId: AFFILIATE_OPPORTUNITY_WORKER_IDENTITY.workerId,
      workerName: AFFILIATE_OPPORTUNITY_WORKER_IDENTITY.workerName,
      reportType: "affiliate_opportunity_report",
      missionId: "Q8-02",
      report,
    });
    const executiveReportId =
      result.records?.[0]?.reportId ??
      result.engineRecord?.lastReportType ??
      report.reportId;
    appendAowLog({
      event: "err_submit",
      details: `executiveReportId=${executiveReportId}`,
    });
    return { submitted: true, executiveReportId };
  }

  private registerIdentity() {
    const identity = {
      workerId: AFFILIATE_OPPORTUNITY_WORKER_IDENTITY.workerId,
      workerName: AFFILIATE_OPPORTUNITY_WORKER_IDENTITY.workerName,
      workerType: AFFILIATE_OPPORTUNITY_WORKER_IDENTITY.workerType,
      department: AFFILIATE_OPPORTUNITY_WORKER_IDENTITY.department,
      factory: AFFILIATE_OPPORTUNITY_WORKER_IDENTITY.factory,
      role: AFFILIATE_OPPORTUNITY_WORKER_IDENTITY.role,
      missionId: "Q8-02",
      doctrine: "PILLOW-AOW-001",
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
