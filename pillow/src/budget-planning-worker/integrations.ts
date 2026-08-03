import { BUDGET_PLANNING_WORKER_IDENTITY } from "./paths.js";
import { appendBpwLog } from "./bpw-logging.js";
import type {
  BudgetPlanningReport,
  IntegrationHandshake,
  IntegrationTarget,
  InjectedAccountingReport,
  InjectedCashflowReport,
  InjectedCashflowView,
} from "./types.js";

export type BudgetPlanningWorkerDependencies = {
  /** Q9-01 Capital Factory Core — dependency injection only, never reimplemented. */
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
  /** Q9-02 Accounting Worker — dependency injection only. */
  accountingWorker?: {
    getReports?: () => InjectedAccountingReport[];
    getEntries?: () => unknown[];
    getLatestBusinessId?: () => string | null;
    getQ903ConsumableContract?: () => unknown;
  } | null;
  /** Q9-03 Cashflow Worker — dependency injection only. */
  cashflowWorker?: {
    getReports?: () => InjectedCashflowReport[];
    getViews?: () => InjectedCashflowView[];
    getLatestBusinessId?: () => string | null;
    getQ904ConsumableContract?: () => unknown;
  } | null;
  workerRegistry?: {
    registerWorker: (input: Record<string, unknown>) => unknown;
  } | null;
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
  memoryRuntime?: {
    remember?: (input: Record<string, unknown>) => unknown;
    recordMemory?: (input: Record<string, unknown>) => unknown;
  } | null;
};

export class IntegrationCoordinator {
  private handshakes: IntegrationHandshake[] = [];
  private deps: BudgetPlanningWorkerDependencies = {};

  bind(deps: BudgetPlanningWorkerDependencies = {}) {
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
      worker_registry: this.deps.workerRegistry,
      worker_lifecycle: this.deps.workerLifecycle,
      worker_assignment_engine: this.deps.workerAssignmentEngine,
      executive_reporting_runtime: this.deps.executiveReportingRuntime,
      audit_runtime: this.deps.auditRuntime,
      worker_recovery_system: this.deps.workerRecoverySystem,
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
    appendBpwLog({
      event: "integrations_connected",
      details: `handshakes=${this.handshakes.length}`,
    });
    return this.getHandshakes();
  }

  /** Fetch verified Accounting Worker reports from the injected dependency — never fabricated. */
  fetchAccountingReports(): InjectedAccountingReport[] {
    try {
      return this.deps.accountingWorker?.getReports?.() ?? [];
    } catch {
      return [];
    }
  }

  /** Fetch verified Cashflow Worker reports from the injected dependency — never fabricated. */
  fetchCashflowReports(): InjectedCashflowReport[] {
    try {
      return this.deps.cashflowWorker?.getReports?.() ?? [];
    } catch {
      return [];
    }
  }

  fetchCashflowViews(): InjectedCashflowView[] {
    try {
      return this.deps.cashflowWorker?.getViews?.() ?? [];
    } catch {
      return [];
    }
  }

  /** Resolve the capital business scope for a request — never fabricates a business ID. */
  resolveCapitalBusinessId(inputBusinessId?: string | null): string | null {
    if (inputBusinessId?.trim()) return inputBusinessId.trim();
    return (
      this.deps.accountingWorker?.getLatestBusinessId?.() ??
      this.deps.cashflowWorker?.getLatestBusinessId?.() ??
      this.deps.capitalFactoryCore?.getLatestCapitalBusinessId?.() ??
      null
    );
  }

  recordAudit(report: BudgetPlanningReport): { audited: boolean; details: string } {
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
      appendBpwLog({
        event: "record_audit",
        details: `business=${report.capitalBusinessId} accepted=${accepted}`,
      });
      return { audited: accepted, details: accepted ? "audit_recorded" : "audit_rejected" };
    } catch {
      return { audited: false, details: "audit_runtime_failed" };
    }
  }

  recordMemory(report: BudgetPlanningReport): void {
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

  submitReport(report: BudgetPlanningReport): {
    submitted: boolean;
    executiveReportId: string | null;
  } {
    const runtime = this.deps.executiveReportingRuntime;
    if (!runtime?.submitWorkerReport) {
      return { submitted: false, executiveReportId: null };
    }
    const result = runtime.submitWorkerReport({
      workerId: BUDGET_PLANNING_WORKER_IDENTITY.workerId,
      workerName: BUDGET_PLANNING_WORKER_IDENTITY.workerName,
      reportType: "budget_planning_report",
      missionId: "Q9-04",
      businessId: report.capitalBusinessId,
      report,
    });
    const executiveReportId =
      result.records?.[0]?.reportId ?? result.engineRecord?.lastReportType ?? report.reportId;
    appendBpwLog({
      event: "err_submit",
      details: `executiveReportId=${executiveReportId}`,
    });
    return { submitted: true, executiveReportId };
  }

  private registerIdentity() {
    const identity = {
      workerId: BUDGET_PLANNING_WORKER_IDENTITY.workerId,
      workerName: BUDGET_PLANNING_WORKER_IDENTITY.workerName,
      workerType: BUDGET_PLANNING_WORKER_IDENTITY.workerType,
      department: BUDGET_PLANNING_WORKER_IDENTITY.department,
      factory: BUDGET_PLANNING_WORKER_IDENTITY.factory,
      role: BUDGET_PLANNING_WORKER_IDENTITY.role,
      reportingLine: [...BUDGET_PLANNING_WORKER_IDENTITY.reportingLine],
      skillProfile: [...BUDGET_PLANNING_WORKER_IDENTITY.skillProfile],
      approvedTools: [...BUDGET_PLANNING_WORKER_IDENTITY.approvedTools],
      authorityLevel: BUDGET_PLANNING_WORKER_IDENTITY.authorityLevel,
      missionId: "Q9-04",
      doctrine: "PILLOW-BPW-001",
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
