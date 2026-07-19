import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { FinancialFrameworkEngine } from "../financial-framework/engine.js";
import type { RevenueEngine } from "../revenue-engine/engine.js";
import type { ExpenseEngine } from "../expense-engine/engine.js";
import type { ProfitCalculationEngine } from "../profit-calculation-engine/engine.js";
import type { CashFlowMonitorEngine } from "../cash-flow-monitor/engine.js";
import type { FinancialForecastEngine } from "../financial-forecast-engine/engine.js";
import {
  buildBudgetManagementEngineConfiguration,
  type BudgetManagementEngineConfiguration,
} from "./configuration.js";
import { appendBmgLog, getBmgLogs, resetBmgLogsForTesting } from "./bmg-logging.js";
import { BUDGET_MANAGEMENT_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  AllocateBudgetInput,
  BudgetCockpitSnapshot,
  BudgetManagementRunReport,
  BudgetManagementEngineState,
  CompareActualVsBudgetInput,
  ConnectBudgetManagementEngineInput,
  CreateBudgetInput,
  DetectBudgetOverrunsInput,
  DetectBudgetVariancesInput,
  GenerateBudgetRecommendationsInput,
  TrackBudgetUtilizationInput,
} from "./types.js";
import { BudgetManagementController } from "./budget-management-controller.js";
import { BudgetManagementManager } from "./budget-management-manager.js";

export interface BudgetManagementEngineOptions {
  configuration?: Partial<BudgetManagementEngineConfiguration>;
}

/**
 * Budget Management Engine (PILLOW-BMG-001 / R3-14).
 * Centralized budget planning and monitoring consuming R3-04, R3-05, R3-06, R3-07 and R3-13.
 */
export class BudgetManagementEngine {
  private initializedAt: string | null = null;
  private readonly controller: BudgetManagementController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    financialFramework: FinancialFrameworkEngine,
    revenueEngine: RevenueEngine,
    expenseEngine: ExpenseEngine,
    profitCalculationEngine: ProfitCalculationEngine,
    cashFlowMonitor: CashFlowMonitorEngine,
    financialForecastEngine: FinancialForecastEngine,
    options: BudgetManagementEngineOptions = {},
  ) {
    const config = buildBudgetManagementEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new BudgetManagementManager(
      financialFramework,
      revenueEngine,
      expenseEngine,
      profitCalculationEngine,
      cashFlowMonitor,
      financialForecastEngine,
    );
    this.controller = new BudgetManagementController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<BudgetManagementEngineState> {
    const doc = await this.reader.readText(BUDGET_MANAGEMENT_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Budget Management Engine")) {
      throw new Error(
        `${BUDGET_MANAGEMENT_ENGINE_SYSTEM_PATH} missing — Budget Management Engine requires R3-14 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendBmgLog({
      event: "engine_initialization",
      level: "info",
      details: "R3-14 Budget Management Engine initialized",
    });
    return this.getState();
  }

  getState(): BudgetManagementEngineState {
    if (!this.initializedAt) {
      throw new Error("Budget Management Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const budgetRecords = this.controller.getManager().getBudgetRecords();
    const latestRecord = budgetRecords[budgetRecords.length - 1];

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalBudgetRecords: budgetRecords.length,
      lastUtilizationPercentage: latestRecord?.budgetUtilizationPercentage ?? null,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-BMG-001",
      missionId: "R3-14",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectBudgetManagementEngine(
    input: ConnectBudgetManagementEngineInput = {},
  ): BudgetManagementRunReport {
    return this.controller.connectBudgetManagementEngine(input);
  }

  createBudget(input: CreateBudgetInput): BudgetManagementRunReport {
    return this.controller.createBudget(input);
  }

  allocateBudget(input: AllocateBudgetInput): BudgetManagementRunReport {
    return this.controller.allocateBudget(input);
  }

  trackBudgetUtilization(
    input: TrackBudgetUtilizationInput = {},
  ): BudgetManagementRunReport {
    return this.controller.trackBudgetUtilization(input);
  }

  compareActualVsBudget(
    input: CompareActualVsBudgetInput = {},
  ): BudgetManagementRunReport {
    return this.controller.compareActualVsBudget(input);
  }

  detectBudgetOverruns(
    input: DetectBudgetOverrunsInput = {},
  ): BudgetManagementRunReport {
    return this.controller.detectBudgetOverruns(input);
  }

  detectBudgetVariances(
    input: DetectBudgetVariancesInput = {},
  ): BudgetManagementRunReport {
    return this.controller.detectBudgetVariances(input);
  }

  generateBudgetRecommendations(
    input: GenerateBudgetRecommendationsInput = {},
  ): BudgetManagementRunReport {
    return this.controller.generateBudgetRecommendations(input);
  }

  getLatestReport(): BudgetManagementRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getBudgetRecords() {
    return this.controller.getManager().getBudgetRecords();
  }

  updateConfiguration(
    overrides: Partial<BudgetManagementEngineConfiguration>,
  ): BudgetManagementEngineState {
    const next = buildBudgetManagementEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Budget management status: ${state.status}`,
        `Last utilization: ${state.health.lastUtilizationPercentage ?? "unknown"}%`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No budget operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): BudgetCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalBudgetRecords: state.health.totalBudgetRecords,
      lastUtilizationPercentage: state.health.lastUtilizationPercentage,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      recentLogs: getBmgLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createBudgetManagementEngine(
  bootstrap: EmpireBootstrapContext,
  financialFramework: FinancialFrameworkEngine,
  revenueEngine: RevenueEngine,
  expenseEngine: ExpenseEngine,
  profitCalculationEngine: ProfitCalculationEngine,
  cashFlowMonitor: CashFlowMonitorEngine,
  financialForecastEngine: FinancialForecastEngine,
  options?: BudgetManagementEngineOptions,
): BudgetManagementEngine {
  return new BudgetManagementEngine(
    bootstrap,
    financialFramework,
    revenueEngine,
    expenseEngine,
    profitCalculationEngine,
    cashFlowMonitor,
    financialForecastEngine,
    options,
  );
}

export function resetBudgetManagementEngineForTesting(): void {
  resetBmgLogsForTesting();
  new BudgetManagementManager(null, null, null, null, null, null).resetForTesting();
}
