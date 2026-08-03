import { ACCOUNTING_WORKER_IDENTITY } from "./paths.js";
import { appendAccwLog } from "./accw-logging.js";
import type { AccountingReport, IntegrationHandshake, IntegrationTarget } from "./types.js";

export type AccountingWorkerDependencies = {
  capitalFactoryCore?: {
    getProjects?: () => Array<{
      capitalBusinessId?: string;
      factoryProjectId?: string;
      capitalProjectName?: string;
      capitalCategory?: string;
    }>;
    getLatestCapitalBusinessId?: () => string | null;
    getQ902ConsumableContract?: () => unknown;
    getReports?: () => unknown[];
  } | null;
  workerRegistry?: {
    registerWorker: (input: Record<string, unknown>) => unknown;
  } | null;
  workerLifecycle?: {
    createWorker?: (input: Record<string, unknown>) => unknown;
    registerWorker?: (input: Record<string, unknown>) => unknown;
    activateWorker?: (input: Record<string, unknown>) => unknown;
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
    recordAuditEntry?: (input: Record<string, unknown>) => { accepted?: boolean } | void;
  } | null;
  memoryRuntime?: {
    remember?: (input: Record<string, unknown>) => unknown;
    recordMemory?: (input: Record<string, unknown>) => unknown;
  } | null;
};

export class IntegrationCoordinator {
  private handshakes: IntegrationHandshake[] = [];
  private deps: AccountingWorkerDependencies = {};

  bind(deps: AccountingWorkerDependencies = {}) {
    this.deps = { ...deps };
  }

  getDependencies() {
    return this.deps;
  }

  getHandshakes() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  connect(targets: readonly IntegrationTarget[] = []): IntegrationHandshake[] {
    this.handshakes = [];
    const now = new Date().toISOString();
    const map: Record<string, unknown> = {
      capital_factory_core: this.deps.capitalFactoryCore,
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
        details: handle ? `${target} bound` : `${target} not injected`,
      });
    }
    this.registerIdentity();
    appendAccwLog({
      event: "integrations_connected",
      details: `handshakes=${this.handshakes.length}`,
    });
    return this.getHandshakes();
  }

  /** Resolve the capital business scope for a request — never fabricates a business ID. */
  resolveCapitalBusinessId(inputBusinessId?: string | null): string | null {
    if (inputBusinessId?.trim()) return inputBusinessId.trim();
    return this.deps.capitalFactoryCore?.getLatestCapitalBusinessId?.() ?? null;
  }

  recordAudit(report: AccountingReport): { audited: boolean; details: string } {
    const runtime = this.deps.auditRuntime;
    if (!runtime) return { audited: false, details: "audit_runtime_unavailable" };
    try {
      let accepted = true;
      if (runtime.recordAuditEntry) {
        const result = runtime.recordAuditEntry({
          reportId: report.reportId,
          capitalBusinessId: report.capitalBusinessId,
          traceabilityRefs: [...report.traceabilityRefs],
          validated: true,
        });
        accepted = typeof result === "object" && result !== null ? result.accepted !== false : true;
      } else if (runtime.recordAuditEvent) {
        runtime.recordAuditEvent({
          reportId: report.reportId,
          capitalBusinessId: report.capitalBusinessId,
          validated: true,
        });
      }
      appendAccwLog({
        event: "record_audit",
        details: `business=${report.capitalBusinessId} accepted=${accepted}`,
      });
      return { audited: accepted, details: accepted ? "audit_recorded" : "audit_rejected" };
    } catch {
      return { audited: false, details: "audit_runtime_failed" };
    }
  }

  recordMemory(report: AccountingReport): void {
    try {
      this.deps.memoryRuntime?.recordMemory?.({
        capitalBusinessId: report.capitalBusinessId,
        confidenceScore: report.confidenceScore,
        validated: true,
      });
      this.deps.memoryRuntime?.remember?.({
        capitalBusinessId: report.capitalBusinessId,
        confidenceScore: report.confidenceScore,
        validated: true,
      });
    } catch {
      /* optional */
    }
  }

  submitReport(report: AccountingReport): {
    submitted: boolean;
    executiveReportId: string | null;
  } {
    const runtime = this.deps.executiveReportingRuntime;
    if (!runtime?.submitWorkerReport) {
      return { submitted: false, executiveReportId: null };
    }
    const result = runtime.submitWorkerReport({
      workerId: ACCOUNTING_WORKER_IDENTITY.workerId,
      workerName: ACCOUNTING_WORKER_IDENTITY.workerName,
      reportType: "accounting_report",
      missionId: "Q9-02",
      businessId: report.capitalBusinessId,
      report,
    });
    const executiveReportId =
      result.records?.[0]?.reportId ?? result.engineRecord?.lastReportType ?? report.reportId;
    appendAccwLog({
      event: "err_submit",
      details: `executiveReportId=${executiveReportId}`,
    });
    return { submitted: true, executiveReportId };
  }

  private registerIdentity() {
    const identity = {
      workerId: ACCOUNTING_WORKER_IDENTITY.workerId,
      workerName: ACCOUNTING_WORKER_IDENTITY.workerName,
      workerType: ACCOUNTING_WORKER_IDENTITY.workerType,
      department: ACCOUNTING_WORKER_IDENTITY.department,
      factory: ACCOUNTING_WORKER_IDENTITY.factory,
      role: ACCOUNTING_WORKER_IDENTITY.role,
      reportingLine: [...ACCOUNTING_WORKER_IDENTITY.reportingLine],
      skillProfile: [...ACCOUNTING_WORKER_IDENTITY.skillProfile],
      approvedTools: [...ACCOUNTING_WORKER_IDENTITY.approvedTools],
      authorityLevel: ACCOUNTING_WORKER_IDENTITY.authorityLevel,
      missionId: "Q9-02",
      doctrine: "PILLOW-ACCW-001",
    };
    try {
      this.deps.workerRegistry?.registerWorker?.(identity);
    } catch {
      /* optional */
    }
    try {
      this.deps.workerLifecycle?.createWorker?.(identity);
      this.deps.workerLifecycle?.registerWorker?.(identity);
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
