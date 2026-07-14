/** R1-04 — Amazon Order Management Controller. */

import { appendOrderLog } from "./amzord-logging.js";
import { AmazonOrderManagementManager } from "./amazon-order-management-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { AmazonOrderManagementConfiguration } from "./configuration.js";
import type {
  AmazonOrderPerformanceStats,
  AmazonOrderSyncReport,
  EngineStatus,
  FetchAmazonOrderInput,
  ProcessAmazonOrderEventInput,
  SyncAmazonOrdersInput,
} from "./types.js";

export class AmazonOrderManagementController {
  private config: AmazonOrderManagementConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: AmazonOrderSyncReport | null = null;
  private readonly manager: AmazonOrderManagementManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: AmazonOrderPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    syncRuns: 0,
    ordersFetched: 0,
    ordersSynced: 0,
    newOrdersDetected: 0,
    updatedOrdersDetected: 0,
    cancelledOrdersDetected: 0,
    fulfilledOrdersDetected: 0,
    refundedOrdersDetected: 0,
    lifecycleEventsProcessed: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    manager: AmazonOrderManagementManager,
    config: AmazonOrderManagementConfiguration,
  ) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendOrderLog({
      event: "engine_initialization",
      level: "info",
      details: "Amazon Order Management ready (R1-04)",
    });
  }

  stop(): void {
    this.status = "stopped";
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): AmazonOrderManagementConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: AmazonOrderManagementConfiguration): void {
    this.config = config;
  }

  getLatestReport(): AmazonOrderSyncReport | null {
    return this.latestReport;
  }

  getManager(): AmazonOrderManagementManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): AmazonOrderPerformanceStats {
    return { ...this.performance };
  }

  async syncAmazonOrders(input: SyncAmazonOrdersInput = {}): Promise<AmazonOrderSyncReport> {
    if (!this.config.enabled) throw new Error("Amazon Order Management is disabled");
    this.status = "syncing";
    this.performance.syncRuns += 1;
    appendOrderLog({ event: "order_sync_start", level: "info", details: "syncAmazonOrders started" });
    const report = await this.manager.syncAmazonOrders(input, this.config);
    this.performance.ordersSynced += report.orders.length;
    this.performance.newOrdersDetected += report.changes.newOrders.length;
    this.performance.updatedOrdersDetected += report.changes.updatedOrders.length;
    this.performance.cancelledOrdersDetected += report.changes.cancelledOrders.length;
    this.performance.fulfilledOrdersDetected += report.changes.fulfilledOrders.length;
    this.performance.refundedOrdersDetected += report.changes.refundedOrders.length;
    this.finalizeOperation(report, "sync");
    return report;
  }

  async fetchAmazonOrder(input: FetchAmazonOrderInput): Promise<AmazonOrderSyncReport> {
    this.performance.ordersFetched += 1;
    const report = await this.manager.fetchAmazonOrder(input, this.config);
    this.finalizeOperation(report, "fetch");
    return report;
  }

  processOrderEvent(input: ProcessAmazonOrderEventInput): AmazonOrderSyncReport {
    this.performance.lifecycleEventsProcessed += 1;
    const report = this.manager.processOrderEvent(input, this.config);
    this.finalizeOperation(report, "process_event");
    return report;
  }

  private finalizeOperation(report: AmazonOrderSyncReport, action: string): void {
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
      this.status = "active";
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
    appendOrderLog({
      event: "order_sync_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
