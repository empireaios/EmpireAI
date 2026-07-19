/** R3-04 — Revenue Engine Controller. */

import { appendReLog } from "./re-logging.js";
import { RevenueEngineManager } from "./revenue-engine-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { RevenueEngineConfiguration } from "./configuration.js";
import type {
  AggregateRevenueInput,
  ConnectRevenueEngineInput,
  EngineStatus,
  RecordCompletedPaymentInput,
  RecordMarketplaceRevenueInput,
  RecordRevenueEventInput,
  RecordRevenueRefundInput,
  RecordSupplierSettlementInput,
  RevenueEngineRunReport,
  RevenuePerformanceStats,
} from "./types.js";

export class RevenueEngineController {
  private config: RevenueEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: RevenueEngineRunReport | null = null;
  private readonly manager: RevenueEngineManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: RevenuePerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    revenueEventsRecorded: 0,
    paymentsRecorded: 0,
    marketplaceRevenueRecorded: 0,
    settlementsRecorded: 0,
    refundsRecorded: 0,
    aggregationsRun: 0,
    anomaliesDetected: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: RevenueEngineManager, config: RevenueEngineConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendReLog({
      event: "engine_initialization",
      level: "info",
      details: "Revenue Engine ready (R3-04)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): RevenueEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: RevenueEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): RevenueEngineRunReport | null {
    return this.latestReport;
  }

  getManager(): RevenueEngineManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): RevenuePerformanceStats {
    return { ...this.performance };
  }

  connectRevenueEngine(input: ConnectRevenueEngineInput = {}): RevenueEngineRunReport {
    if (!this.config.enabled) throw new Error("Revenue Engine is disabled");
    this.status = "connecting";
    appendReLog({ event: "connection_attempt", level: "info", details: "connectRevenueEngine started" });
    const report = this.manager.connectRevenueEngine(input, this.config);
    this.finalizeOperation(report, "connect");
    return report;
  }

  recordRevenueEvent(input: RecordRevenueEventInput): RevenueEngineRunReport {
    this.status = "processing";
    this.performance.revenueEventsRecorded += 1;
    const report = this.manager.recordRevenueEvent(input, this.config);
    this.trackAnomalies(report);
    this.finalizeOperation(report, "record_event");
    return report;
  }

  recordCompletedPayment(input: RecordCompletedPaymentInput): RevenueEngineRunReport {
    this.status = "processing";
    this.performance.paymentsRecorded += 1;
    const report = this.manager.recordCompletedPayment(input, this.config);
    this.trackAnomalies(report);
    this.finalizeOperation(report, "record_payment");
    return report;
  }

  recordMarketplaceRevenue(input: RecordMarketplaceRevenueInput): RevenueEngineRunReport {
    this.status = "processing";
    this.performance.marketplaceRevenueRecorded += 1;
    const report = this.manager.recordMarketplaceRevenue(input, this.config);
    this.trackAnomalies(report);
    this.finalizeOperation(report, "record_marketplace");
    return report;
  }

  recordSupplierSettlement(input: RecordSupplierSettlementInput): RevenueEngineRunReport {
    this.status = "processing";
    this.performance.settlementsRecorded += 1;
    const report = this.manager.recordSupplierSettlement(input, this.config);
    this.trackAnomalies(report);
    this.finalizeOperation(report, "record_settlement");
    return report;
  }

  recordRevenueRefund(input: RecordRevenueRefundInput): RevenueEngineRunReport {
    this.status = "processing";
    this.performance.refundsRecorded += 1;
    const report = this.manager.recordRevenueRefund(input, this.config);
    this.trackAnomalies(report);
    this.finalizeOperation(report, "record_refund");
    return report;
  }

  aggregateRevenue(input: AggregateRevenueInput = {}): RevenueEngineRunReport {
    this.status = "aggregating";
    this.performance.aggregationsRun += 1;
    const report = this.manager.aggregateRevenue(input, this.config);
    this.finalizeOperation(report, "aggregate");
    return report;
  }

  private trackAnomalies(report: RevenueEngineRunReport): void {
    if (report.anomalies.length > 0) {
      this.performance.anomaliesDetected += report.anomalies.length;
    }
  }

  private finalizeOperation(report: RevenueEngineRunReport, action: string): void {
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
    appendReLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
