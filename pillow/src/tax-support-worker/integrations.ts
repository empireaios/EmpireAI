import { TAX_SUPPORT_WORKER_IDENTITY } from "./paths.js";
import { appendTswLog } from "./tsw-logging.js";
import type {
  InjectedAccountingEntry,
  InjectedCashflowReport,
  InjectedForecastingReport,
  InjectedProfitabilityReport,
  IntegrationHandshake,
  IntegrationTarget,
  TaxSupportReport,
} from "./types.js";

export type TaxSupportWorkerDependencies = {
  capitalFactoryCore?: {
    getProjects?: () => Array<{
      capitalBusinessId?: string;
      factoryProjectId?: string;
      capitalProjectName?: string;
    }>;
    getLatestCapitalBusinessId?: () => string | null;
    getQ902ConsumableContract?: () => unknown;
  } | null;
  accountingWorker?: {
    getEntries?: () => InjectedAccountingEntry[];
    getLatestBusinessId?: () => string | null;
    getQ903ConsumableContract?: () => unknown;
  } | null;
  cashflowWorker?: {
    getReports?: () => InjectedCashflowReport[];
    getLatestBusinessId?: () => string | null;
    getQ904ConsumableContract?: () => unknown;
  } | null;
  profitabilityWorker?: {
    getReports?: () => InjectedProfitabilityReport[];
    getLatestBusinessId?: () => string | null;
    getQ906ConsumableContract?: () => unknown;
  } | null;
  forecastingWorker?: {
    getReports?: () => InjectedForecastingReport[];
    getLatestBusinessId?: () => string | null;
    getQ907ConsumableContract?: () => unknown;
  } | null;
  workerRegistry?: { registerWorker: (input: Record<string, unknown>) => unknown } | null;
  workerLifecycle?: {
    createWorker?: (input: Record<string, unknown>) => unknown;
    registerWorker?: (input: Record<string, unknown>) => unknown;
    activateWorker?: (input: Record<string, unknown>) => unknown;
  } | null;
  workerAssignmentEngine?: {
    discoverEligibleWorkers?(input?: object): unknown;
    assignWorker?: (input: Record<string, unknown>) => unknown;
    registerAssignable?: (input: Record<string, unknown>) => unknown;
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
};

export class IntegrationCoordinator {
  private handshakes: IntegrationHandshake[] = [];
  private deps: TaxSupportWorkerDependencies = {};

  bind(deps: TaxSupportWorkerDependencies = {}) {
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
      accounting_worker: this.deps.accountingWorker,
      cashflow_worker: this.deps.cashflowWorker,
      profitability_worker: this.deps.profitabilityWorker,
      forecasting_worker: this.deps.forecastingWorker,
      worker_registry: this.deps.workerRegistry,
      worker_lifecycle: this.deps.workerLifecycle,
      worker_assignment_engine: this.deps.workerAssignmentEngine,
      executive_reporting_runtime: this.deps.executiveReportingRuntime,
      audit_runtime: this.deps.auditRuntime,
      worker_recovery_system: this.deps.workerRecoverySystem,
    };
    for (const target of targets) {
      const handle = map[target];
      this.handshakes.push({
        target,
        status: handle ? "bound" : "unavailable",
        timestamp: now,
        details: handle ? `${target} bound` : `${target} not injected`,
      });
    }
    this.registerIdentity();
    appendTswLog({ event: "integrations_connected", details: `handshakes=${this.handshakes.length}` });
    return this.getHandshakes();
  }

  fetchAccountingEntries(): InjectedAccountingEntry[] {
    try {
      return this.deps.accountingWorker?.getEntries?.() ?? [];
    } catch {
      return [];
    }
  }

  fetchCashflowReports(): InjectedCashflowReport[] {
    try {
      return this.deps.cashflowWorker?.getReports?.() ?? [];
    } catch {
      return [];
    }
  }

  fetchProfitabilityReports(): InjectedProfitabilityReport[] {
    try {
      return this.deps.profitabilityWorker?.getReports?.() ?? [];
    } catch {
      return [];
    }
  }

  fetchForecastingReports(): InjectedForecastingReport[] {
    try {
      return this.deps.forecastingWorker?.getReports?.() ?? [];
    } catch {
      return [];
    }
  }

  resolveCapitalBusinessId(inputBusinessId?: string | null): string | null {
    if (inputBusinessId?.trim()) return inputBusinessId.trim();
    return (
      this.deps.accountingWorker?.getLatestBusinessId?.() ??
      this.deps.cashflowWorker?.getLatestBusinessId?.() ??
      this.deps.profitabilityWorker?.getLatestBusinessId?.() ??
      this.deps.forecastingWorker?.getLatestBusinessId?.() ??
      this.deps.capitalFactoryCore?.getLatestCapitalBusinessId?.() ??
      null
    );
  }

  recordAudit(report: TaxSupportReport): { audited: boolean; details: string } {
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
      return { audited: accepted, details: accepted ? "audit_recorded" : "audit_rejected" };
    } catch {
      return { audited: false, details: "audit_runtime_failed" };
    }
  }

  submitReport(report: TaxSupportReport): { submitted: boolean; executiveReportId: string | null } {
    const runtime = this.deps.executiveReportingRuntime;
    if (!runtime?.submitWorkerReport) {
      return { submitted: false, executiveReportId: null };
    }
    const result = runtime.submitWorkerReport({
      workerId: TAX_SUPPORT_WORKER_IDENTITY.workerId,
      workerName: TAX_SUPPORT_WORKER_IDENTITY.workerName,
      reportType: "tax_support_report",
      missionId: "Q9-07",
      businessId: report.capitalBusinessId,
      report,
    });
    const executiveReportId =
      result.records?.[0]?.reportId ?? result.engineRecord?.lastReportType ?? report.reportId;
    appendTswLog({ event: "err_submit", details: `executiveReportId=${executiveReportId}` });
    return { submitted: true, executiveReportId };
  }

  private registerIdentity() {
    const identity = {
      workerId: TAX_SUPPORT_WORKER_IDENTITY.workerId,
      workerName: TAX_SUPPORT_WORKER_IDENTITY.workerName,
      workerType: TAX_SUPPORT_WORKER_IDENTITY.workerType,
      department: TAX_SUPPORT_WORKER_IDENTITY.department,
      factory: TAX_SUPPORT_WORKER_IDENTITY.factory,
      role: TAX_SUPPORT_WORKER_IDENTITY.role,
      reportingLine: [...TAX_SUPPORT_WORKER_IDENTITY.reportingLine],
      skillProfile: [...TAX_SUPPORT_WORKER_IDENTITY.skillProfile],
      approvedTools: [...TAX_SUPPORT_WORKER_IDENTITY.approvedTools],
      authorityLevel: TAX_SUPPORT_WORKER_IDENTITY.authorityLevel,
      missionId: "Q9-07",
      doctrine: "PILLOW-TSW-001",
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
      this.deps.workerAssignmentEngine?.registerAssignable?.(identity);
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
