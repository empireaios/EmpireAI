/** R2-15 — Multi-Warehouse Controller. */

import { appendMwsLog } from "./mws-logging.js";
import { MultiWarehouseManager } from "./multi-warehouse-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { MultiWarehouseSupportConfiguration } from "./configuration.js";
import type {
  EngineStatus,
  RegisterWarehousesInput,
  RouteFulfilmentInput,
  SelectWarehouseInput,
  TransferInventoryInput,
  WarehouseNetworkPerformanceStats,
  WarehouseNetworkReport,
} from "./types.js";

export class MultiWarehouseController {
  private config: MultiWarehouseSupportConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: WarehouseNetworkReport | null = null;
  private readonly manager: MultiWarehouseManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: WarehouseNetworkPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    registrationRuns: 0,
    warehousesRegistered: 0,
    selectionsPerformed: 0,
    transfersInitiated: 0,
    transfersCompleted: 0,
    fulfilmentRoutes: 0,
    imbalancedDetected: 0,
    capacityIssuesDetected: 0,
    networkFailures: 0,
    invalidRecordsDetected: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: MultiWarehouseManager, config: MultiWarehouseSupportConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendMwsLog({
      event: "engine_initialization",
      level: "info",
      details: "Multi-Warehouse Support ready (R2-15)",
    });
  }

  stop(): void {
    this.status = "stopped";
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): MultiWarehouseSupportConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: MultiWarehouseSupportConfiguration): void {
    this.config = config;
  }

  getLatestReport(): WarehouseNetworkReport | null {
    return this.latestReport;
  }

  getManager(): MultiWarehouseManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): WarehouseNetworkPerformanceStats {
    return { ...this.performance };
  }

  registerWarehouses(input: RegisterWarehousesInput = {}): WarehouseNetworkReport {
    if (!this.config.enabled) throw new Error("Multi-Warehouse Support is disabled");
    this.status = "coordinating";
    this.performance.registrationRuns += 1;
    appendMwsLog({ event: "network_start", level: "info", details: "registerWarehouses started" });
    const report = this.manager.registerWarehouses(input, this.config);
    this.recordNetworkMetrics(report, "register");
    this.finalizeOperation(report, "register");
    return report;
  }

  selectWarehouse(input: SelectWarehouseInput = {}): WarehouseNetworkReport {
    const report = this.manager.selectWarehouse(input, this.config);
    this.performance.selectionsPerformed += 1;
    this.recordNetworkMetrics(report, "select");
    this.finalizeOperation(report, "select");
    return report;
  }

  transferInventory(input: TransferInventoryInput): WarehouseNetworkReport {
    this.performance.transfersInitiated += 1;
    const report = this.manager.transferInventory(input, this.config);
    if (report.records.some((r) => r.inventoryTransferStatus === "completed")) {
      this.performance.transfersCompleted += 1;
    }
    this.recordNetworkMetrics(report, "transfer");
    this.finalizeOperation(report, "transfer");
    return report;
  }

  routeFulfilmentBetweenWarehouses(input: RouteFulfilmentInput): WarehouseNetworkReport {
    this.performance.fulfilmentRoutes += 1;
    const report = this.manager.routeFulfilmentBetweenWarehouses(input, this.config);
    this.recordNetworkMetrics(report, "route");
    this.finalizeOperation(report, "route");
    return report;
  }

  syncWarehouseNetwork(): WarehouseNetworkReport {
    const report = this.manager.syncWarehouseNetwork(this.config);
    this.recordNetworkMetrics(report, "sync");
    this.finalizeOperation(report, "sync");
    return report;
  }

  private recordNetworkMetrics(report: WarehouseNetworkReport, action: string): void {
    if (action === "register") this.performance.warehousesRegistered += report.records.length;
    this.performance.imbalancedDetected += report.records.filter(
      (r) => r.warehouseHealthStatus === "imbalanced",
    ).length;
    this.performance.capacityIssuesDetected += report.records.filter(
      (r) => r.warehouseHealthStatus === "capacity_issue",
    ).length;
    this.performance.networkFailures += report.failures.length;
    this.performance.invalidRecordsDetected += report.invalidRecords.length;
  }

  private finalizeOperation(report: WarehouseNetworkReport, action: string): void {
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
      (this.performance.averageOperationDurationMs * (this.performance.totalOperations - 1) + duration) /
        this.performance.totalOperations,
    );
    if (duration > this.performance.peakOperationDurationMs) {
      this.performance.peakOperationDurationMs = duration;
    }

    this.healthMonitor.recordOperation(
      report.validation.decision,
      report.failures,
      report.invalidRecords,
      report.records.filter((r) => r.warehouseHealthStatus === "imbalanced").length,
      report.records.filter((r) => r.warehouseHealthStatus === "capacity_issue").length,
      report.records.filter((r) => r.inventoryTransferStatus === "completed").length,
    );
    appendMwsLog({
      event: "network_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
