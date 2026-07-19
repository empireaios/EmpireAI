/** R3-12 — Multi-Currency Controller. */

import { appendMcLog } from "./mc-logging.js";
import { MultiCurrencyManager } from "./multi-currency-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { MultiCurrencyEngineConfiguration } from "./configuration.js";
import type {
  CalculateCurrencyGainLossInput,
  ConnectMultiCurrencyEngineInput,
  ConvertCurrencyInput,
  CurrencyPerformanceStats,
  EngineStatus,
  GenerateCurrencySummaryInput,
  MultiCurrencyRunReport,
  RecordTransactionCurrencyInput,
  RefreshExchangeRatesInput,
} from "./types.js";

export class MultiCurrencyController {
  private config: MultiCurrencyEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: MultiCurrencyRunReport | null = null;
  private readonly manager: MultiCurrencyManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: CurrencyPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    conversionsPerformed: 0,
    exchangeRatesRefreshed: 0,
    gainLossCalculations: 0,
    summariesGenerated: 0,
    anomaliesDetected: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: MultiCurrencyManager, config: MultiCurrencyEngineConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendMcLog({
      event: "engine_initialization",
      level: "info",
      details: "Multi-Currency Engine ready (R3-12)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): MultiCurrencyEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: MultiCurrencyEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): MultiCurrencyRunReport | null {
    return this.latestReport;
  }

  getManager(): MultiCurrencyManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): CurrencyPerformanceStats {
    return { ...this.performance };
  }

  connectMultiCurrencyEngine(
    input: ConnectMultiCurrencyEngineInput = {},
  ): MultiCurrencyRunReport {
    if (!this.config.enabled) throw new Error("Multi-Currency Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectMultiCurrencyEngine(input, this.config);
    this.finalizeOperation(report, "connect");
    return report;
  }

  recordTransactionCurrency(
    input: RecordTransactionCurrencyInput,
  ): MultiCurrencyRunReport {
    const report = this.manager.recordTransactionCurrency(input, this.config);
    this.finalizeOperation(report, "record_transaction_currency");
    return report;
  }

  convertCurrency(input: ConvertCurrencyInput): MultiCurrencyRunReport {
    this.status = "processing";
    this.performance.conversionsPerformed += 1;
    const report = this.manager.convertCurrency(input, this.config);
    this.trackAnomalies(report);
    this.finalizeOperation(report, "convert_currency");
    return report;
  }

  refreshExchangeRates(input: RefreshExchangeRatesInput = {}): MultiCurrencyRunReport {
    this.performance.exchangeRatesRefreshed += 1;
    const report = this.manager.refreshExchangeRates(input, this.config);
    this.finalizeOperation(report, "refresh_exchange_rates");
    return report;
  }

  calculateCurrencyGainLoss(
    input: CalculateCurrencyGainLossInput,
  ): MultiCurrencyRunReport {
    this.status = "processing";
    this.performance.gainLossCalculations += 1;
    const report = this.manager.calculateCurrencyGainLoss(input, this.config);
    this.trackAnomalies(report);
    this.finalizeOperation(report, "calculate_gain_loss");
    return report;
  }

  generateCurrencySummary(
    input: GenerateCurrencySummaryInput = {},
  ): MultiCurrencyRunReport {
    this.performance.summariesGenerated += 1;
    const report = this.manager.generateCurrencySummary(input, this.config);
    this.finalizeOperation(report, "generate_summary");
    return report;
  }

  private trackAnomalies(report: MultiCurrencyRunReport): void {
    if (report.anomalies.length > 0) {
      this.performance.anomaliesDetected += report.anomalies.length;
    }
  }

  private finalizeOperation(report: MultiCurrencyRunReport, action: string): void {
    this.latestReport = report;
    this.performance.totalOperations += 1;
    const duration = report.durationMs;

    if (report.validation.decision === "fail") {
      this.performance.failedOperations += 1;
      this.recoveryManager.recordFailure(
        `${action} failed: ${report.validation.errors.join("; ")}`,
        this.config,
      );
      this.status = "failed";
    } else {
      this.performance.successfulOperations += 1;
      this.recoveryManager.recordSuccess();
      this.status =
        report.engineRecord.currentOperationalState === "active" ? "active" : "connected";
    }

    this.performance.averageOperationDurationMs = Math.round(
      (this.performance.averageOperationDurationMs * (this.performance.totalOperations - 1) +
        duration) /
        this.performance.totalOperations,
    );
    if (duration > this.performance.peakOperationDurationMs) {
      this.performance.peakOperationDurationMs = duration;
    }

    this.healthMonitor.recordOperation(report.validation.decision);
    appendMcLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
