import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { FinancialFrameworkEngine } from "../financial-framework/engine.js";
import type { BankingIntegrationEngine } from "../banking-integration/engine.js";
import type { RevenueEngine } from "../revenue-engine/engine.js";
import type { ExpenseEngine } from "../expense-engine/engine.js";
import type { ProfitCalculationEngine } from "../profit-calculation-engine/engine.js";
import {
  buildCashFlowMonitorConfiguration,
  type CashFlowMonitorConfiguration,
} from "./configuration.js";
import { appendCfLog, getCfLogs, resetCfLogsForTesting } from "./cf-logging.js";
import { CASH_FLOW_MONITOR_SYSTEM_PATH } from "./paths.js";
import type {
  AggregateCashFlowInput,
  CashFlowCockpitSnapshot,
  CashFlowMonitorRunReport,
  CashFlowMonitorState,
  ConnectCashFlowMonitorInput,
  ForecastCashAvailabilityInput,
  MonitorCashFlowInput,
  MonitorInflowsInput,
  MonitorLiquidityInput,
  MonitorOutflowsInput,
} from "./types.js";
import { CashFlowMonitorController } from "./cash-flow-monitor-controller.js";
import { CashFlowMonitorManager } from "./cash-flow-monitor-manager.js";

export interface CashFlowMonitorOptions {
  configuration?: Partial<CashFlowMonitorConfiguration>;
}

/**
 * Cash Flow Monitor (PILLOW-CF-001 / R3-07).
 * Real-time liquidity monitoring consuming R3-03 through R3-06.
 */
export class CashFlowMonitorEngine {
  private initializedAt: string | null = null;
  private readonly controller: CashFlowMonitorController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    financialFramework: FinancialFrameworkEngine,
    bankingIntegration: BankingIntegrationEngine,
    revenueEngine: RevenueEngine,
    expenseEngine: ExpenseEngine,
    profitCalculationEngine: ProfitCalculationEngine,
    options: CashFlowMonitorOptions = {},
  ) {
    const config = buildCashFlowMonitorConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new CashFlowMonitorManager(
      financialFramework,
      bankingIntegration,
      revenueEngine,
      expenseEngine,
      profitCalculationEngine,
    );
    this.controller = new CashFlowMonitorController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<CashFlowMonitorState> {
    const doc = await this.reader.readText(CASH_FLOW_MONITOR_SYSTEM_PATH);
    if (!doc?.includes("Cash Flow Monitor")) {
      throw new Error(
        `${CASH_FLOW_MONITOR_SYSTEM_PATH} missing — Cash Flow Monitor requires R3-07 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendCfLog({
      event: "monitor_initialization",
      level: "info",
      details: "R3-07 Cash Flow Monitor initialized",
    });
    return this.getState();
  }

  getState(): CashFlowMonitorState {
    if (!this.initializedAt) {
      throw new Error("Cash Flow Monitor not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getMonitorRecord();
    const cashFlowRecords = this.controller.getManager().getCashFlowRecords();
    const aggregateNetCashFlow = cashFlowRecords.reduce((s, r) => s + r.netCashFlow, 0);
    const latestRecord = cashFlowRecords[cashFlowRecords.length - 1];

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalCashFlowRecords: cashFlowRecords.length,
      currentLiquidityStatus: latestRecord?.liquidityStatus ?? null,
      aggregateNetCashFlow,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-CF-001",
      missionId: "R3-07",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      monitorRecord: record,
      health,
      performance,
    };
  }

  connectCashFlowMonitor(
    input: ConnectCashFlowMonitorInput = {},
  ): CashFlowMonitorRunReport {
    return this.controller.connectCashFlowMonitor(input);
  }

  monitorCashFlow(input: MonitorCashFlowInput = {}): CashFlowMonitorRunReport {
    return this.controller.monitorCashFlow(input);
  }

  monitorInflows(input: MonitorInflowsInput = {}): CashFlowMonitorRunReport {
    return this.controller.monitorInflows(input);
  }

  monitorOutflows(input: MonitorOutflowsInput = {}): CashFlowMonitorRunReport {
    return this.controller.monitorOutflows(input);
  }

  monitorLiquidity(input: MonitorLiquidityInput = {}): CashFlowMonitorRunReport {
    return this.controller.monitorLiquidity(input);
  }

  forecastCashAvailability(
    input: ForecastCashAvailabilityInput = {},
  ): CashFlowMonitorRunReport {
    return this.controller.forecastCashAvailability(input);
  }

  aggregateCashFlow(input: AggregateCashFlowInput = {}): CashFlowMonitorRunReport {
    return this.controller.aggregateCashFlow(input);
  }

  getLatestReport(): CashFlowMonitorRunReport | null {
    return this.controller.getLatestReport();
  }

  getMonitorRecord() {
    return this.controller.getManager().getMonitorRecord();
  }

  getCashFlowRecords() {
    return this.controller.getManager().getCashFlowRecords();
  }

  updateConfiguration(
    overrides: Partial<CashFlowMonitorConfiguration>,
  ): CashFlowMonitorState {
    const next = buildCashFlowMonitorConfiguration(this.bootstrap.repositoryRoot, {
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
        `Cash flow monitor status: ${state.status}`,
        `Liquidity: ${state.health.currentLiquidityStatus ?? "unknown"}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No cash flow operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): CashFlowCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.monitorRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalCashFlowRecords: state.health.totalCashFlowRecords,
      currentLiquidityStatus: state.health.currentLiquidityStatus,
      aggregateNetCashFlow: state.health.aggregateNetCashFlow,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      recentLogs: getCfLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createCashFlowMonitorEngine(
  bootstrap: EmpireBootstrapContext,
  financialFramework: FinancialFrameworkEngine,
  bankingIntegration: BankingIntegrationEngine,
  revenueEngine: RevenueEngine,
  expenseEngine: ExpenseEngine,
  profitCalculationEngine: ProfitCalculationEngine,
  options?: CashFlowMonitorOptions,
): CashFlowMonitorEngine {
  return new CashFlowMonitorEngine(
    bootstrap,
    financialFramework,
    bankingIntegration,
    revenueEngine,
    expenseEngine,
    profitCalculationEngine,
    options,
  );
}

export function resetCashFlowMonitorForTesting(): void {
  resetCfLogsForTesting();
  new CashFlowMonitorManager(null, null, null, null, null).resetForTesting();
}
