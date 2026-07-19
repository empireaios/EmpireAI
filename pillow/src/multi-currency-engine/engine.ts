import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { FinancialFrameworkEngine } from "../financial-framework/engine.js";
import type { BankingIntegrationEngine } from "../banking-integration/engine.js";
import type { RevenueEngine } from "../revenue-engine/engine.js";
import type { ExpenseEngine } from "../expense-engine/engine.js";
import type { ProfitCalculationEngine } from "../profit-calculation-engine/engine.js";
import type { TaxIntelligenceEngine } from "../tax-intelligence-engine/engine.js";
import {
  buildMultiCurrencyEngineConfiguration,
  type MultiCurrencyEngineConfiguration,
} from "./configuration.js";
import { appendMcLog, getMcLogs, resetMcLogsForTesting } from "./mc-logging.js";
import { MULTI_CURRENCY_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  CalculateCurrencyGainLossInput,
  ConnectMultiCurrencyEngineInput,
  ConvertCurrencyInput,
  CurrencyCockpitSnapshot,
  GenerateCurrencySummaryInput,
  MultiCurrencyRunReport,
  MultiCurrencyEngineState,
  RecordTransactionCurrencyInput,
  RefreshExchangeRatesInput,
} from "./types.js";
import { MultiCurrencyController } from "./multi-currency-controller.js";
import { MultiCurrencyManager } from "./multi-currency-manager.js";

export interface MultiCurrencyEngineOptions {
  configuration?: Partial<MultiCurrencyEngineConfiguration>;
}

/**
 * Multi-Currency Engine (PILLOW-MC-001 / R3-12).
 * Centralized multi-currency processing consuming R3-03, R3-04, R3-05, R3-06 and R3-11.
 */
export class MultiCurrencyEngine {
  private initializedAt: string | null = null;
  private readonly controller: MultiCurrencyController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    financialFramework: FinancialFrameworkEngine,
    bankingIntegration: BankingIntegrationEngine,
    revenueEngine: RevenueEngine,
    expenseEngine: ExpenseEngine,
    profitCalculationEngine: ProfitCalculationEngine,
    taxIntelligenceEngine: TaxIntelligenceEngine,
    options: MultiCurrencyEngineOptions = {},
  ) {
    const config = buildMultiCurrencyEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new MultiCurrencyManager(
      financialFramework,
      bankingIntegration,
      revenueEngine,
      expenseEngine,
      profitCalculationEngine,
      taxIntelligenceEngine,
    );
    this.controller = new MultiCurrencyController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<MultiCurrencyEngineState> {
    const doc = await this.reader.readText(MULTI_CURRENCY_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Multi-Currency Engine")) {
      throw new Error(
        `${MULTI_CURRENCY_ENGINE_SYSTEM_PATH} missing — Multi-Currency Engine requires R3-12 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendMcLog({
      event: "engine_initialization",
      level: "info",
      details: "R3-12 Multi-Currency Engine initialized",
    });
    return this.getState();
  }

  getState(): MultiCurrencyEngineState {
    if (!this.initializedAt) {
      throw new Error("Multi-Currency Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const currencyRecords = this.controller.getManager().getCurrencyRecords();
    const aggregateConvertedAmount = currencyRecords.reduce(
      (s, r) => s + r.convertedAmount,
      0,
    );
    const latestRecord = currencyRecords[currencyRecords.length - 1];

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalCurrencyRecords: currencyRecords.length,
      aggregateConvertedAmount,
      lastConversionStatus: latestRecord?.conversionStatus ?? null,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-MC-001",
      missionId: "R3-12",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectMultiCurrencyEngine(
    input: ConnectMultiCurrencyEngineInput = {},
  ): MultiCurrencyRunReport {
    return this.controller.connectMultiCurrencyEngine(input);
  }

  recordTransactionCurrency(
    input: RecordTransactionCurrencyInput,
  ): MultiCurrencyRunReport {
    return this.controller.recordTransactionCurrency(input);
  }

  convertCurrency(input: ConvertCurrencyInput): MultiCurrencyRunReport {
    return this.controller.convertCurrency(input);
  }

  refreshExchangeRates(input: RefreshExchangeRatesInput = {}): MultiCurrencyRunReport {
    return this.controller.refreshExchangeRates(input);
  }

  calculateCurrencyGainLoss(
    input: CalculateCurrencyGainLossInput,
  ): MultiCurrencyRunReport {
    return this.controller.calculateCurrencyGainLoss(input);
  }

  generateCurrencySummary(input: GenerateCurrencySummaryInput = {}): MultiCurrencyRunReport {
    return this.controller.generateCurrencySummary(input);
  }

  getLatestReport(): MultiCurrencyRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getCurrencyRecords() {
    return this.controller.getManager().getCurrencyRecords();
  }

  getExchangeRateHistory() {
    return this.controller.getManager().getExchangeRateHistory();
  }

  updateConfiguration(
    overrides: Partial<MultiCurrencyEngineConfiguration>,
  ): MultiCurrencyEngineState {
    const next = buildMultiCurrencyEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Multi-currency status: ${state.status}`,
        `Last conversion: ${state.health.lastConversionStatus ?? "unknown"}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No currency operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): CurrencyCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalCurrencyRecords: state.health.totalCurrencyRecords,
      aggregateConvertedAmount: state.health.aggregateConvertedAmount,
      lastConversionStatus: state.health.lastConversionStatus,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      recentLogs: getMcLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createMultiCurrencyEngine(
  bootstrap: EmpireBootstrapContext,
  financialFramework: FinancialFrameworkEngine,
  bankingIntegration: BankingIntegrationEngine,
  revenueEngine: RevenueEngine,
  expenseEngine: ExpenseEngine,
  profitCalculationEngine: ProfitCalculationEngine,
  taxIntelligenceEngine: TaxIntelligenceEngine,
  options?: MultiCurrencyEngineOptions,
): MultiCurrencyEngine {
  return new MultiCurrencyEngine(
    bootstrap,
    financialFramework,
    bankingIntegration,
    revenueEngine,
    expenseEngine,
    profitCalculationEngine,
    taxIntelligenceEngine,
    options,
  );
}

export function resetMultiCurrencyEngineForTesting(): void {
  resetMcLogsForTesting();
  new MultiCurrencyManager(null, null, null, null, null, null).resetForTesting();
}
