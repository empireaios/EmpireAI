/** R2-14 — Warehouse Intelligence Controller. */

import { appendWiLog } from "./wi-logging.js";
import { WarehouseIntelligenceManager } from "./warehouse-intelligence-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { WarehouseIntelligenceConfiguration } from "./configuration.js";
import type {
  AllocateWarehouseInput,
  CoordinateWarehousesInput,
  EngineStatus,
  OptimizeInventoryDistributionInput,
  WarehousePerformanceStats,
  WarehouseReport,
} from "./types.js";

export class WarehouseIntelligenceController {
  private config: WarehouseIntelligenceConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: WarehouseReport | null = null;
  private readonly manager: WarehouseIntelligenceManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: WarehousePerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    coordinationRuns: 0,
    warehousesCoordinated: 0,
    allocationsPerformed: 0,
    distributionsOptimized: 0,
    bottlenecksDetected: 0,
    shortagesDetected: 0,
    overstockDetected: 0,
    warehouseFailures: 0,
    invalidRecordsDetected: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: WarehouseIntelligenceManager, config: WarehouseIntelligenceConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendWiLog({
      event: "engine_initialization",
      level: "info",
      details: "Warehouse Intelligence ready (R2-14)",
    });
  }

  stop(): void {
    this.status = "stopped";
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): WarehouseIntelligenceConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: WarehouseIntelligenceConfiguration): void {
    this.config = config;
  }

  getLatestReport(): WarehouseReport | null {
    return this.latestReport;
  }

  getManager(): WarehouseIntelligenceManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): WarehousePerformanceStats {
    return { ...this.performance };
  }

  coordinateWarehouses(input: CoordinateWarehousesInput = {}): WarehouseReport {
    if (!this.config.enabled) throw new Error("Warehouse Intelligence is disabled");
    this.status = "coordinating";
    this.performance.coordinationRuns += 1;
    appendWiLog({ event: "coordination_start", level: "info", details: "coordinateWarehouses started" });
    const report = this.manager.coordinateWarehouses(input, this.config);
    this.recordWarehouseMetrics(report);
    this.finalizeOperation(report, "coordinate");
    return report;
  }

  allocateWarehouse(input: AllocateWarehouseInput = {}): WarehouseReport {
    const report = this.manager.allocateWarehouse(input, this.config);
    this.performance.allocationsPerformed += 1;
    this.recordWarehouseMetrics(report);
    this.finalizeOperation(report, "allocate");
    return report;
  }

  optimizeInventoryDistribution(input: OptimizeInventoryDistributionInput = {}): WarehouseReport {
    const report = this.manager.optimizeInventoryDistribution(input, this.config);
    this.performance.distributionsOptimized += 1;
    this.recordWarehouseMetrics(report);
    this.finalizeOperation(report, "optimize");
    return report;
  }

  private recordWarehouseMetrics(report: WarehouseReport): void {
    this.performance.warehousesCoordinated += report.records.length;
    this.performance.bottlenecksDetected += report.records.filter(
      (r) => r.warehouseStatus === "bottleneck",
    ).length;
    this.performance.shortagesDetected += report.records.filter(
      (r) => r.warehouseStatus === "shortage",
    ).length;
    this.performance.overstockDetected += report.records.filter(
      (r) => r.warehouseStatus === "overstock",
    ).length;
    this.performance.warehouseFailures += report.failures.length;
    this.performance.invalidRecordsDetected += report.invalidRecords.length;
  }

  private finalizeOperation(report: WarehouseReport, action: string): void {
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
      report.records.filter((r) => r.warehouseStatus === "bottleneck").length,
      report.records.filter((r) => r.warehouseStatus === "shortage").length,
      report.records.filter((r) => r.warehouseStatus === "overstock").length,
    );
    appendWiLog({
      event: "coordination_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
