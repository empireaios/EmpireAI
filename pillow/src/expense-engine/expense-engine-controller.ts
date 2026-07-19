/** R3-05 — Expense Engine Controller. */

import { appendExLog } from "./ex-logging.js";
import { ExpenseEngineManager } from "./expense-engine-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { ExpenseEngineConfiguration } from "./configuration.js";
import type {
  AggregateExpensesInput,
  ConnectExpenseEngineInput,
  EngineStatus,
  ExpenseEngineRunReport,
  ExpensePerformanceStats,
  RecordAdvertisingExpenseInput,
  RecordExpenseEventInput,
  RecordOperationalExpenseInput,
  RecordPlatformFeeInput,
  RecordShippingExpenseInput,
  RecordSupplierPaymentInput,
} from "./types.js";

export class ExpenseEngineController {
  private config: ExpenseEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: ExpenseEngineRunReport | null = null;
  private readonly manager: ExpenseEngineManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: ExpensePerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    expenseEventsRecorded: 0,
    supplierPaymentsRecorded: 0,
    shippingExpensesRecorded: 0,
    advertisingExpensesRecorded: 0,
    platformFeesRecorded: 0,
    operationalExpensesRecorded: 0,
    aggregationsRun: 0,
    anomaliesDetected: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: ExpenseEngineManager, config: ExpenseEngineConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendExLog({
      event: "engine_initialization",
      level: "info",
      details: "Expense Engine ready (R3-05)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): ExpenseEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: ExpenseEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): ExpenseEngineRunReport | null {
    return this.latestReport;
  }

  getManager(): ExpenseEngineManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): ExpensePerformanceStats {
    return { ...this.performance };
  }

  connectExpenseEngine(input: ConnectExpenseEngineInput = {}): ExpenseEngineRunReport {
    if (!this.config.enabled) throw new Error("Expense Engine is disabled");
    this.status = "connecting";
    appendExLog({ event: "connection_attempt", level: "info", details: "connectExpenseEngine started" });
    const report = this.manager.connectExpenseEngine(input, this.config);
    this.finalizeOperation(report, "connect");
    return report;
  }

  recordExpenseEvent(input: RecordExpenseEventInput): ExpenseEngineRunReport {
    this.status = "processing";
    this.performance.expenseEventsRecorded += 1;
    const report = this.manager.recordExpenseEvent(input, this.config);
    this.trackAnomalies(report);
    this.finalizeOperation(report, "record_event");
    return report;
  }

  recordSupplierPayment(input: RecordSupplierPaymentInput): ExpenseEngineRunReport {
    this.performance.supplierPaymentsRecorded += 1;
    const report = this.manager.recordSupplierPayment(input, this.config);
    this.trackAnomalies(report);
    this.finalizeOperation(report, "record_supplier_payment");
    return report;
  }

  recordShippingExpense(input: RecordShippingExpenseInput): ExpenseEngineRunReport {
    this.performance.shippingExpensesRecorded += 1;
    const report = this.manager.recordShippingExpense(input, this.config);
    this.trackAnomalies(report);
    this.finalizeOperation(report, "record_shipping");
    return report;
  }

  recordAdvertisingExpense(input: RecordAdvertisingExpenseInput): ExpenseEngineRunReport {
    this.performance.advertisingExpensesRecorded += 1;
    const report = this.manager.recordAdvertisingExpense(input, this.config);
    this.trackAnomalies(report);
    this.finalizeOperation(report, "record_advertising");
    return report;
  }

  recordPlatformFee(input: RecordPlatformFeeInput): ExpenseEngineRunReport {
    this.performance.platformFeesRecorded += 1;
    const report = this.manager.recordPlatformFee(input, this.config);
    this.trackAnomalies(report);
    this.finalizeOperation(report, "record_platform_fee");
    return report;
  }

  recordOperationalExpense(input: RecordOperationalExpenseInput): ExpenseEngineRunReport {
    this.performance.operationalExpensesRecorded += 1;
    const report = this.manager.recordOperationalExpense(input, this.config);
    this.trackAnomalies(report);
    this.finalizeOperation(report, "record_operational");
    return report;
  }

  aggregateExpenses(input: AggregateExpensesInput = {}): ExpenseEngineRunReport {
    this.status = "aggregating";
    this.performance.aggregationsRun += 1;
    const report = this.manager.aggregateExpenses(input, this.config);
    this.finalizeOperation(report, "aggregate");
    return report;
  }

  private trackAnomalies(report: ExpenseEngineRunReport): void {
    if (report.anomalies.length > 0) {
      this.performance.anomaliesDetected += report.anomalies.length;
    }
  }

  private finalizeOperation(report: ExpenseEngineRunReport, action: string): void {
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
    appendExLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
