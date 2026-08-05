import { CAPITAL_RISK_WORKER_IDENTITY } from "./paths.js";
import { appendCaprwLog } from "./caprw-logging.js";
import type {
  CapitalRiskReport,
  InjectedAccountingEntry,
  InjectedFinancialReport,
  IntegrationHandshake,
  IntegrationTarget,
} from "./types.js";

export type CapitalRiskWorkerDependencies = {
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
    getReports?: () => Array<{ reportId?: string | null; [key: string]: unknown }>;
    getLatestBusinessId?: () => string | null;
    getQ904ConsumableContract?: () => unknown;
  } | null;
  budgetPlanningWorker?: {
    getReports?: () => Array<{ reportId?: string | null; [key: string]: unknown }>;
    getLatestBusinessId?: () => string | null;
    getQ905ConsumableContract?: () => unknown;
  } | null;
  profitabilityWorker?: {
    getReports?: () => Array<{ reportId?: string | null; [key: string]: unknown }>;
    getLatestBusinessId?: () => string | null;
    getQ906ConsumableContract?: () => unknown;
  } | null;
  forecastingWorker?: {
    getReports?: () => Array<{ reportId?: string | null; [key: string]: unknown }>;
    getLatestBusinessId?: () => string | null;
    getQ907ConsumableContract?: () => unknown;
  } | null;
  taxSupportWorker?: {
    getReports?: () => Array<{ reportId?: string | null; [key: string]: unknown }>;
    getLatestBusinessId?: () => string | null;
    getQ908ConsumableContract?: () => unknown;
  } | null;
  investmentPlanningWorker?: {
    getReports?: () => Array<{ reportId?: string | null; [key: string]: unknown }>;
    getLatestBusinessId?: () => string | null;
    getQ909ConsumableContract?: () => unknown;
  } | null;
  financialReportingWorker?: {
    getReports?: () => InjectedFinancialReport[];
    getLatestBusinessId?: () => string | null;
    getQ910ConsumableContract?: () => unknown;
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
  private deps: CapitalRiskWorkerDependencies = {};

  bind(deps: CapitalRiskWorkerDependencies = {}) {
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
      budget_planning_worker: this.deps.budgetPlanningWorker,
      profitability_worker: this.deps.profitabilityWorker,
      forecasting_worker: this.deps.forecastingWorker,
      tax_support_worker: this.deps.taxSupportWorker,
      investment_planning_worker: this.deps.investmentPlanningWorker,
      financial_reporting_worker: this.deps.financialReportingWorker,
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
    appendCaprwLog({ event: "integrations_connected", details: `handshakes=${this.handshakes.length}` });
    return this.getHandshakes();
  }

  fetchAccountingEntries(): InjectedAccountingEntry[] {
    try {
      return this.deps.accountingWorker?.getEntries?.() ?? [];
    } catch {
      return [];
    }
  }

  fetchCashflowReports() {
    try {
      return this.deps.cashflowWorker?.getReports?.() ?? [];
    } catch {
      return [];
    }
  }

  fetchBudgetReports() {
    try {
      return this.deps.budgetPlanningWorker?.getReports?.() ?? [];
    } catch {
      return [];
    }
  }

  fetchProfitabilityReports() {
    try {
      return this.deps.profitabilityWorker?.getReports?.() ?? [];
    } catch {
      return [];
    }
  }

  fetchForecastingReports() {
    try {
      return this.deps.forecastingWorker?.getReports?.() ?? [];
    } catch {
      return [];
    }
  }

  fetchTaxSupportReports() {
    try {
      return this.deps.taxSupportWorker?.getReports?.() ?? [];
    } catch {
      return [];
    }
  }

  fetchInvestmentPlanningReports() {
    try {
      return this.deps.investmentPlanningWorker?.getReports?.() ?? [];
    } catch {
      return [];
    }
  }

  fetchFinancialReportingReports(): InjectedFinancialReport[] {
    try {
      return this.deps.financialReportingWorker?.getReports?.() ?? [];
    } catch {
      return [];
    }
  }

  getQ910ConsumableContract() {
    try {
      return this.deps.financialReportingWorker?.getQ910ConsumableContract?.() ?? null;
    } catch {
      return null;
    }
  }

  resolveCapitalBusinessId(inputBusinessId?: string | null): string | null {
    if (inputBusinessId?.trim()) return inputBusinessId.trim();
    return (
      this.deps.accountingWorker?.getLatestBusinessId?.() ??
      this.deps.cashflowWorker?.getLatestBusinessId?.() ??
      this.deps.budgetPlanningWorker?.getLatestBusinessId?.() ??
      this.deps.profitabilityWorker?.getLatestBusinessId?.() ??
      this.deps.forecastingWorker?.getLatestBusinessId?.() ??
      this.deps.taxSupportWorker?.getLatestBusinessId?.() ??
      this.deps.investmentPlanningWorker?.getLatestBusinessId?.() ??
      this.deps.financialReportingWorker?.getLatestBusinessId?.() ??
      this.deps.capitalFactoryCore?.getLatestCapitalBusinessId?.() ??
      null
    );
  }

  recordAudit(report: CapitalRiskReport): { audited: boolean; details: string } {
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

  submitReport(report: CapitalRiskReport): { submitted: boolean; executiveReportId: string | null } {
    const runtime = this.deps.executiveReportingRuntime;
    if (!runtime?.submitWorkerReport) {
      return { submitted: false, executiveReportId: null };
    }
    const result = runtime.submitWorkerReport({
      workerId: CAPITAL_RISK_WORKER_IDENTITY.workerId,
      workerName: CAPITAL_RISK_WORKER_IDENTITY.workerName,
      reportType: "capital_risk_report",
      missionId: "Q9-10",
      businessId: report.capitalBusinessId,
      report,
    });
    const executiveReportId =
      result.records?.[0]?.reportId ?? result.engineRecord?.lastReportType ?? report.reportId;
    appendCaprwLog({ event: "err_submit", details: `executiveReportId=${executiveReportId}` });
    return { submitted: true, executiveReportId };
  }

  private registerIdentity() {
    const identity = {
      workerId: CAPITAL_RISK_WORKER_IDENTITY.workerId,
      workerName: CAPITAL_RISK_WORKER_IDENTITY.workerName,
      workerType: CAPITAL_RISK_WORKER_IDENTITY.workerType,
      department: CAPITAL_RISK_WORKER_IDENTITY.department,
      factory: CAPITAL_RISK_WORKER_IDENTITY.factory,
      role: CAPITAL_RISK_WORKER_IDENTITY.role,
      reportingLine: [...CAPITAL_RISK_WORKER_IDENTITY.reportingLine],
      skillProfile: [...CAPITAL_RISK_WORKER_IDENTITY.skillProfile],
      approvedTools: [...CAPITAL_RISK_WORKER_IDENTITY.approvedTools],
      authorityLevel: CAPITAL_RISK_WORKER_IDENTITY.authorityLevel,
      missionId: "Q9-10",
      doctrine: "PILLOW-CAPRW-001",
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
