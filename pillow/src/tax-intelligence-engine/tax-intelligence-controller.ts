/** R3-11 — Tax Intelligence Controller. */

import { appendTxLog } from "./tx-logging.js";
import { TaxIntelligenceManager } from "./tax-intelligence-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { TaxIntelligenceEngineConfiguration } from "./configuration.js";
import type {
  CalculateTaxAdjustmentInput,
  CalculateTaxLiabilityInput,
  ClassifyTaxableTransactionInput,
  ConnectTaxIntelligenceEngineInput,
  EngineStatus,
  GenerateTaxSummaryInput,
  RecordTaxPaymentInput,
  TaxIntelligenceRunReport,
  TaxPerformanceStats,
} from "./types.js";

export class TaxIntelligenceController {
  private config: TaxIntelligenceEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: TaxIntelligenceRunReport | null = null;
  private readonly manager: TaxIntelligenceManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: TaxPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    transactionsClassified: 0,
    liabilitiesCalculated: 0,
    adjustmentsCalculated: 0,
    taxPaymentsRecorded: 0,
    summariesGenerated: 0,
    anomaliesDetected: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: TaxIntelligenceManager, config: TaxIntelligenceEngineConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendTxLog({
      event: "engine_initialization",
      level: "info",
      details: "Tax Intelligence Engine ready (R3-11)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): TaxIntelligenceEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: TaxIntelligenceEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): TaxIntelligenceRunReport | null {
    return this.latestReport;
  }

  getManager(): TaxIntelligenceManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): TaxPerformanceStats {
    return { ...this.performance };
  }

  connectTaxIntelligenceEngine(
    input: ConnectTaxIntelligenceEngineInput = {},
  ): TaxIntelligenceRunReport {
    if (!this.config.enabled) throw new Error("Tax Intelligence Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectTaxIntelligenceEngine(input, this.config);
    this.finalizeOperation(report, "connect");
    return report;
  }

  classifyTaxableTransaction(
    input: ClassifyTaxableTransactionInput,
  ): TaxIntelligenceRunReport {
    this.status = "processing";
    this.performance.transactionsClassified += 1;
    const report = this.manager.classifyTaxableTransaction(input, this.config);
    this.trackAnomalies(report);
    this.finalizeOperation(report, "classify_transaction");
    return report;
  }

  calculateTaxLiability(input: CalculateTaxLiabilityInput): TaxIntelligenceRunReport {
    this.status = "processing";
    this.performance.liabilitiesCalculated += 1;
    const report = this.manager.calculateTaxLiability(input, this.config);
    this.trackAnomalies(report);
    this.finalizeOperation(report, "calculate_liability");
    return report;
  }

  calculateTaxAdjustment(input: CalculateTaxAdjustmentInput): TaxIntelligenceRunReport {
    this.status = "processing";
    this.performance.adjustmentsCalculated += 1;
    const report = this.manager.calculateTaxAdjustment(input, this.config);
    this.trackAnomalies(report);
    this.finalizeOperation(report, "calculate_adjustment");
    return report;
  }

  recordTaxPayment(input: RecordTaxPaymentInput): TaxIntelligenceRunReport {
    this.performance.taxPaymentsRecorded += 1;
    const report = this.manager.recordTaxPayment(input, this.config);
    this.finalizeOperation(report, "record_tax_payment");
    return report;
  }

  generateTaxSummary(input: GenerateTaxSummaryInput = {}): TaxIntelligenceRunReport {
    this.performance.summariesGenerated += 1;
    const report = this.manager.generateTaxSummary(input, this.config);
    this.finalizeOperation(report, "generate_summary");
    return report;
  }

  private trackAnomalies(report: TaxIntelligenceRunReport): void {
    if (report.anomalies.length > 0) {
      this.performance.anomaliesDetected += report.anomalies.length;
    }
  }

  private finalizeOperation(report: TaxIntelligenceRunReport, action: string): void {
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
    appendTxLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
