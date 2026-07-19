import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { FinancialFrameworkEngine } from "../financial-framework/engine.js";
import type { RevenueEngine } from "../revenue-engine/engine.js";
import type { ExpenseEngine } from "../expense-engine/engine.js";
import type { ProfitCalculationEngine } from "../profit-calculation-engine/engine.js";
import type { CashFlowMonitorEngine } from "../cash-flow-monitor/engine.js";
import type { FinancialForecastEngine } from "../financial-forecast-engine/engine.js";
import type { BudgetManagementEngine } from "../budget-management-engine/engine.js";
import type { FinancialRiskMonitor } from "../financial-risk-monitor/engine.js";
import {
  buildExecutiveFinancialDashboardConfiguration,
  type ExecutiveFinancialDashboardConfiguration,
} from "./configuration.js";
import { appendEfdLog, getEfdLogs, resetEfdLogsForTesting } from "./efd-logging.js";
import { EXECUTIVE_FINANCIAL_DASHBOARD_SYSTEM_PATH } from "./paths.js";
import type {
  AggregateFinancialKpisInput,
  ConnectExecutiveFinancialDashboardInput,
  DashboardCockpitSnapshot,
  ExecutiveDashboardRunReport,
  ExecutiveFinancialDashboardState,
  GenerateExecutiveSummaryInput,
  GetDashboardWidgetsInput,
  RefreshExecutiveDashboardInput,
} from "./types.js";
import { ExecutiveFinancialDashboardController } from "./executive-financial-dashboard-controller.js";
import { ExecutiveFinancialDashboardManager } from "./executive-financial-dashboard-manager.js";

export interface ExecutiveFinancialDashboardOptions {
  configuration?: Partial<ExecutiveFinancialDashboardConfiguration>;
}

/**
 * Executive Financial Dashboard (PILLOW-EFD-001 / R3-16).
 * Unified executive financial intelligence cockpit consuming R3-04 through R3-15.
 */
export class ExecutiveFinancialDashboard {
  private initializedAt: string | null = null;
  private readonly controller: ExecutiveFinancialDashboardController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    financialFramework: FinancialFrameworkEngine,
    revenueEngine: RevenueEngine,
    expenseEngine: ExpenseEngine,
    profitCalculationEngine: ProfitCalculationEngine,
    cashFlowMonitor: CashFlowMonitorEngine,
    financialForecastEngine: FinancialForecastEngine,
    budgetManagementEngine: BudgetManagementEngine,
    financialRiskMonitor: FinancialRiskMonitor,
    options: ExecutiveFinancialDashboardOptions = {},
  ) {
    const config = buildExecutiveFinancialDashboardConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new ExecutiveFinancialDashboardManager(
      financialFramework,
      revenueEngine,
      expenseEngine,
      profitCalculationEngine,
      cashFlowMonitor,
      financialForecastEngine,
      budgetManagementEngine,
      financialRiskMonitor,
    );
    this.controller = new ExecutiveFinancialDashboardController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<ExecutiveFinancialDashboardState> {
    const doc = await this.reader.readText(EXECUTIVE_FINANCIAL_DASHBOARD_SYSTEM_PATH);
    if (!doc?.includes("Executive Financial Dashboard")) {
      throw new Error(
        `${EXECUTIVE_FINANCIAL_DASHBOARD_SYSTEM_PATH} missing — Executive Financial Dashboard requires R3-16 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendEfdLog({
      event: "engine_initialization",
      level: "info",
      details: "R3-16 Executive Financial Dashboard initialized",
    });
    return this.getState();
  }

  getState(): ExecutiveFinancialDashboardState {
    if (!this.initializedAt) {
      throw new Error("Executive Financial Dashboard not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const snapshots = this.controller.getManager().getSnapshots();
    const latestSnapshot = snapshots[snapshots.length - 1];

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalSnapshots: snapshots.length,
      lastRefreshAt: latestSnapshot?.timestamp ?? null,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-EFD-001",
      missionId: "R3-16",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectExecutiveFinancialDashboard(
    input: ConnectExecutiveFinancialDashboardInput = {},
  ): ExecutiveDashboardRunReport {
    return this.controller.connectExecutiveFinancialDashboard(input);
  }

  refreshExecutiveDashboard(
    input: RefreshExecutiveDashboardInput = {},
  ): ExecutiveDashboardRunReport {
    return this.controller.refreshExecutiveDashboard(input);
  }

  generateExecutiveSummary(
    input: GenerateExecutiveSummaryInput = {},
  ): ExecutiveDashboardRunReport {
    return this.controller.generateExecutiveSummary(input);
  }

  aggregateFinancialKpis(input: AggregateFinancialKpisInput = {}): ExecutiveDashboardRunReport {
    return this.controller.aggregateFinancialKpis(input);
  }

  getDashboardWidgets(input: GetDashboardWidgetsInput = {}): ExecutiveDashboardRunReport {
    return this.controller.getDashboardWidgets(input);
  }

  getLatestReport(): ExecutiveDashboardRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getSnapshots() {
    return this.controller.getManager().getSnapshots();
  }

  updateConfiguration(
    overrides: Partial<ExecutiveFinancialDashboardConfiguration>,
  ): ExecutiveFinancialDashboardState {
    const next = buildExecutiveFinancialDashboardConfiguration(this.bootstrap.repositoryRoot, {
      ...this.controller.getConfiguration(),
      ...overrides,
    });
    this.controller.updateConfiguration(next);
    return this.getState();
  }

  validateForSupervisorSync(): {
    valid: boolean;
    health: "healthy" | "degraded" | "blocked";
    readinessScore: number;
    notes: string[];
  } {
    const state = this.getState();
    const report = state.latestReport;
    const score = report
      ? report.validation.decision === "pass"
        ? 100
        : report.validation.decision === "partial"
          ? 70
          : 40
      : state.health.healthScore;

    return {
      valid: state.health.status !== "failed",
      health: score >= 75 ? "healthy" : score >= 50 ? "degraded" : "blocked",
      readinessScore: score,
      notes: [
        `Executive dashboard status: ${state.status}`,
        `Last refresh: ${state.health.lastRefreshAt ?? "never"}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No dashboard operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): DashboardCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalSnapshots: state.health.totalSnapshots,
      lastRefreshAt: state.health.lastRefreshAt,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      recentLogs: getEfdLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createExecutiveFinancialDashboard(
  bootstrap: EmpireBootstrapContext,
  financialFramework: FinancialFrameworkEngine,
  revenueEngine: RevenueEngine,
  expenseEngine: ExpenseEngine,
  profitCalculationEngine: ProfitCalculationEngine,
  cashFlowMonitor: CashFlowMonitorEngine,
  financialForecastEngine: FinancialForecastEngine,
  budgetManagementEngine: BudgetManagementEngine,
  financialRiskMonitor: FinancialRiskMonitor,
  options?: ExecutiveFinancialDashboardOptions,
): ExecutiveFinancialDashboard {
  return new ExecutiveFinancialDashboard(
    bootstrap,
    financialFramework,
    revenueEngine,
    expenseEngine,
    profitCalculationEngine,
    cashFlowMonitor,
    financialForecastEngine,
    budgetManagementEngine,
    financialRiskMonitor,
    options,
  );
}

export function resetExecutiveFinancialDashboardForTesting(): void {
  resetEfdLogsForTesting();
  new ExecutiveFinancialDashboardManager(null, null, null, null, null, null, null, null).resetForTesting();
}
