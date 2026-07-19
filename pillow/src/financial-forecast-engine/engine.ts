import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { FinancialFrameworkEngine } from "../financial-framework/engine.js";
import type { RevenueEngine } from "../revenue-engine/engine.js";
import type { ExpenseEngine } from "../expense-engine/engine.js";
import type { ProfitCalculationEngine } from "../profit-calculation-engine/engine.js";
import type { CashFlowMonitorEngine } from "../cash-flow-monitor/engine.js";
import type { MultiCurrencyEngine } from "../multi-currency-engine/engine.js";
import {
  buildFinancialForecastEngineConfiguration,
  type FinancialForecastEngineConfiguration,
} from "./configuration.js";
import { appendFctLog, getFctLogs, resetFctLogsForTesting } from "./fct-logging.js";
import { FINANCIAL_FORECAST_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  AnalyzeFinancialTrendsInput,
  ConnectFinancialForecastEngineInput,
  DetectForecastDeviationsInput,
  ForecastCockpitSnapshot,
  FinancialForecastRunReport,
  FinancialForecastEngineState,
  GenerateFinancialProjectionInput,
} from "./types.js";
import { FinancialForecastController } from "./financial-forecast-controller.js";
import { FinancialForecastManager } from "./financial-forecast-manager.js";

export interface FinancialForecastEngineOptions {
  configuration?: Partial<FinancialForecastEngineConfiguration>;
}

/**
 * Financial Forecast Engine (PILLOW-FCT-001 / R3-13).
 * Predictive financial forecasting consuming R3-04, R3-05, R3-06, R3-07 and R3-12.
 */
export class FinancialForecastEngine {
  private initializedAt: string | null = null;
  private readonly controller: FinancialForecastController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    financialFramework: FinancialFrameworkEngine,
    revenueEngine: RevenueEngine,
    expenseEngine: ExpenseEngine,
    profitCalculationEngine: ProfitCalculationEngine,
    cashFlowMonitor: CashFlowMonitorEngine,
    multiCurrencyEngine: MultiCurrencyEngine,
    options: FinancialForecastEngineOptions = {},
  ) {
    const config = buildFinancialForecastEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new FinancialForecastManager(
      financialFramework,
      revenueEngine,
      expenseEngine,
      profitCalculationEngine,
      cashFlowMonitor,
      multiCurrencyEngine,
    );
    this.controller = new FinancialForecastController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<FinancialForecastEngineState> {
    const doc = await this.reader.readText(FINANCIAL_FORECAST_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Financial Forecast Engine")) {
      throw new Error(
        `${FINANCIAL_FORECAST_ENGINE_SYSTEM_PATH} missing — Financial Forecast Engine requires R3-13 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendFctLog({
      event: "engine_initialization",
      level: "info",
      details: "R3-13 Financial Forecast Engine initialized",
    });
    return this.getState();
  }

  getState(): FinancialForecastEngineState {
    if (!this.initializedAt) {
      throw new Error("Financial Forecast Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const forecastRecords = this.controller.getManager().getForecastRecords();
    const latestRecord = forecastRecords[forecastRecords.length - 1];

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalForecastRecords: forecastRecords.length,
      lastConfidenceScore: latestRecord?.forecastConfidenceScore ?? null,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-FCT-001",
      missionId: "R3-13",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectFinancialForecastEngine(
    input: ConnectFinancialForecastEngineInput = {},
  ): FinancialForecastRunReport {
    return this.controller.connectFinancialForecastEngine(input);
  }

  generateFinancialProjection(
    input: GenerateFinancialProjectionInput = {},
  ): FinancialForecastRunReport {
    return this.controller.generateFinancialProjection(input);
  }

  analyzeFinancialTrends(
    input: AnalyzeFinancialTrendsInput = {},
  ): FinancialForecastRunReport {
    return this.controller.analyzeFinancialTrends(input);
  }

  detectForecastDeviations(
    input: DetectForecastDeviationsInput = {},
  ): FinancialForecastRunReport {
    return this.controller.detectForecastDeviations(input);
  }

  getLatestReport(): FinancialForecastRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getForecastRecords() {
    return this.controller.getManager().getForecastRecords();
  }

  updateConfiguration(
    overrides: Partial<FinancialForecastEngineConfiguration>,
  ): FinancialForecastEngineState {
    const next = buildFinancialForecastEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Financial forecast status: ${state.status}`,
        `Last confidence: ${state.health.lastConfidenceScore ?? "unknown"}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No forecast operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ForecastCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalForecastRecords: state.health.totalForecastRecords,
      lastConfidenceScore: state.health.lastConfidenceScore,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      recentLogs: getFctLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createFinancialForecastEngine(
  bootstrap: EmpireBootstrapContext,
  financialFramework: FinancialFrameworkEngine,
  revenueEngine: RevenueEngine,
  expenseEngine: ExpenseEngine,
  profitCalculationEngine: ProfitCalculationEngine,
  cashFlowMonitor: CashFlowMonitorEngine,
  multiCurrencyEngine: MultiCurrencyEngine,
  options?: FinancialForecastEngineOptions,
): FinancialForecastEngine {
  return new FinancialForecastEngine(
    bootstrap,
    financialFramework,
    revenueEngine,
    expenseEngine,
    profitCalculationEngine,
    cashFlowMonitor,
    multiCurrencyEngine,
    options,
  );
}

export function resetFinancialForecastEngineForTesting(): void {
  resetFctLogsForTesting();
  new FinancialForecastManager(null, null, null, null, null, null).resetForTesting();
}
