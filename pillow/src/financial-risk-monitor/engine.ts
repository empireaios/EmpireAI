import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { FinancialFrameworkEngine } from "../financial-framework/engine.js";
import type { RevenueEngine } from "../revenue-engine/engine.js";
import type { ExpenseEngine } from "../expense-engine/engine.js";
import type { ProfitCalculationEngine } from "../profit-calculation-engine/engine.js";
import type { CashFlowMonitorEngine } from "../cash-flow-monitor/engine.js";
import type { FinancialForecastEngine } from "../financial-forecast-engine/engine.js";
import type { BudgetManagementEngine } from "../budget-management-engine/engine.js";
import {
  buildFinancialRiskMonitorConfiguration,
  type FinancialRiskMonitorConfiguration,
} from "./configuration.js";
import { appendFrmLog, getFrmLogs, resetFrmLogsForTesting } from "./frm-logging.js";
import { FINANCIAL_RISK_MONITOR_SYSTEM_PATH } from "./paths.js";
import type {
  CalculateFinancialRiskScoreInput,
  ConnectFinancialRiskMonitorInput,
  DetectFinancialAnomaliesInput,
  DetectThresholdBreachesInput,
  FinancialRiskRunReport,
  FinancialRiskMonitorState,
  GenerateFinancialRiskAlertsInput,
  MonitorFinancialHealthInput,
  RiskCockpitSnapshot,
} from "./types.js";
import { FinancialRiskMonitorController } from "./financial-risk-monitor-controller.js";
import { FinancialRiskMonitorManager } from "./financial-risk-monitor-manager.js";

export interface FinancialRiskMonitorOptions {
  configuration?: Partial<FinancialRiskMonitorConfiguration>;
}

/**
 * Financial Risk Monitor (PILLOW-FRM-001 / R3-15).
 * Continuous financial risk monitoring consuming R3-04, R3-05, R3-06, R3-07, R3-13 and R3-14.
 */
export class FinancialRiskMonitor {
  private initializedAt: string | null = null;
  private readonly controller: FinancialRiskMonitorController;
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
    options: FinancialRiskMonitorOptions = {},
  ) {
    const config = buildFinancialRiskMonitorConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new FinancialRiskMonitorManager(
      financialFramework,
      revenueEngine,
      expenseEngine,
      profitCalculationEngine,
      cashFlowMonitor,
      financialForecastEngine,
      budgetManagementEngine,
    );
    this.controller = new FinancialRiskMonitorController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<FinancialRiskMonitorState> {
    const doc = await this.reader.readText(FINANCIAL_RISK_MONITOR_SYSTEM_PATH);
    if (!doc?.includes("Financial Risk Monitor")) {
      throw new Error(
        `${FINANCIAL_RISK_MONITOR_SYSTEM_PATH} missing — Financial Risk Monitor requires R3-15 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendFrmLog({
      event: "engine_initialization",
      level: "info",
      details: "R3-15 Financial Risk Monitor initialized",
    });
    return this.getState();
  }

  getState(): FinancialRiskMonitorState {
    if (!this.initializedAt) {
      throw new Error("Financial Risk Monitor not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const riskRecords = this.controller.getManager().getRiskRecords();
    const latestRecord = riskRecords[riskRecords.length - 1];

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalRiskRecords: riskRecords.length,
      lastRiskScore: latestRecord?.riskScore ?? null,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-FRM-001",
      missionId: "R3-15",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectFinancialRiskMonitor(
    input: ConnectFinancialRiskMonitorInput = {},
  ): FinancialRiskRunReport {
    return this.controller.connectFinancialRiskMonitor(input);
  }

  monitorFinancialHealth(
    input: MonitorFinancialHealthInput = {},
  ): FinancialRiskRunReport {
    return this.controller.monitorFinancialHealth(input);
  }

  calculateFinancialRiskScore(
    input: CalculateFinancialRiskScoreInput = {},
  ): FinancialRiskRunReport {
    return this.controller.calculateFinancialRiskScore(input);
  }

  detectFinancialAnomalies(
    input: DetectFinancialAnomaliesInput = {},
  ): FinancialRiskRunReport {
    return this.controller.detectFinancialAnomalies(input);
  }

  detectThresholdBreaches(
    input: DetectThresholdBreachesInput = {},
  ): FinancialRiskRunReport {
    return this.controller.detectThresholdBreaches(input);
  }

  generateFinancialRiskAlerts(
    input: GenerateFinancialRiskAlertsInput = {},
  ): FinancialRiskRunReport {
    return this.controller.generateFinancialRiskAlerts(input);
  }

  getLatestReport(): FinancialRiskRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getRiskRecords() {
    return this.controller.getManager().getRiskRecords();
  }

  updateConfiguration(
    overrides: Partial<FinancialRiskMonitorConfiguration>,
  ): FinancialRiskMonitorState {
    const next = buildFinancialRiskMonitorConfiguration(this.bootstrap.repositoryRoot, {
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
        `Financial risk monitor status: ${state.status}`,
        `Last risk score: ${state.health.lastRiskScore ?? "unknown"}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No risk monitoring operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): RiskCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalRiskRecords: state.health.totalRiskRecords,
      lastRiskScore: state.health.lastRiskScore,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      recentLogs: getFrmLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createFinancialRiskMonitor(
  bootstrap: EmpireBootstrapContext,
  financialFramework: FinancialFrameworkEngine,
  revenueEngine: RevenueEngine,
  expenseEngine: ExpenseEngine,
  profitCalculationEngine: ProfitCalculationEngine,
  cashFlowMonitor: CashFlowMonitorEngine,
  financialForecastEngine: FinancialForecastEngine,
  budgetManagementEngine: BudgetManagementEngine,
  options?: FinancialRiskMonitorOptions,
): FinancialRiskMonitor {
  return new FinancialRiskMonitor(
    bootstrap,
    financialFramework,
    revenueEngine,
    expenseEngine,
    profitCalculationEngine,
    cashFlowMonitor,
    financialForecastEngine,
    budgetManagementEngine,
    options,
  );
}

export function resetFinancialRiskMonitorForTesting(): void {
  resetFrmLogsForTesting();
  new FinancialRiskMonitorManager(null, null, null, null, null, null, null).resetForTesting();
}
