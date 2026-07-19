/** R2-12 — Shipment Tracking Controller. */

import { appendSteLog } from "./ste-logging.js";
import { ShipmentTrackingManager } from "./shipment-tracking-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { ShipmentTrackingEngineConfiguration } from "./configuration.js";
import type {
  EngineStatus,
  QueryCarrierTrackingInput,
  ReceiveTrackingWebhookInput,
  ShipmentTrackingReport,
  SyncShipmentTrackingInput,
  TrackingPerformanceStats,
} from "./types.js";

export class ShipmentTrackingController {
  private config: ShipmentTrackingEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: ShipmentTrackingReport | null = null;
  private readonly manager: ShipmentTrackingManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: TrackingPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    syncRuns: 0,
    recordsTracked: 0,
    eventsProcessed: 0,
    deliveredDetected: 0,
    delayedDetected: 0,
    failedDeliveriesDetected: 0,
    trackingFailures: 0,
    invalidRecordsDetected: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: ShipmentTrackingManager, config: ShipmentTrackingEngineConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendSteLog({
      event: "engine_initialization",
      level: "info",
      details: "Shipment Tracking Engine ready (R2-12)",
    });
  }

  stop(): void {
    this.status = "stopped";
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): ShipmentTrackingEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: ShipmentTrackingEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): ShipmentTrackingReport | null {
    return this.latestReport;
  }

  getManager(): ShipmentTrackingManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): TrackingPerformanceStats {
    return { ...this.performance };
  }

  syncShipmentTracking(input: SyncShipmentTrackingInput = {}): ShipmentTrackingReport {
    if (!this.config.enabled) throw new Error("Shipment Tracking Engine is disabled");
    this.status = "tracking";
    this.performance.syncRuns += 1;
    appendSteLog({ event: "tracking_start", level: "info", details: "syncShipmentTracking started" });
    const report = this.manager.syncShipmentTracking(input, this.config);
    this.recordTrackingMetrics(report);
    this.finalizeOperation(report, "sync");
    return report;
  }

  queryCarrierTracking(input: QueryCarrierTrackingInput): ShipmentTrackingReport {
    const report = this.manager.queryCarrierTracking(input, this.config);
    this.recordTrackingMetrics(report);
    this.finalizeOperation(report, "query");
    return report;
  }

  receiveTrackingWebhook(input: ReceiveTrackingWebhookInput): ShipmentTrackingReport {
    const report = this.manager.receiveTrackingWebhook(input, this.config);
    this.recordTrackingMetrics(report);
    this.finalizeOperation(report, "webhook");
    return report;
  }

  private recordTrackingMetrics(report: ShipmentTrackingReport): void {
    this.performance.recordsTracked += report.records.length;
    this.performance.eventsProcessed += report.events.length;
    this.performance.deliveredDetected += report.records.filter(
      (r) => r.currentShipmentStatus === "delivered",
    ).length;
    this.performance.delayedDetected += report.records.filter(
      (r) => r.delayStatus === "delayed" || r.currentShipmentStatus === "delayed",
    ).length;
    this.performance.failedDeliveriesDetected += report.records.filter(
      (r) => r.currentShipmentStatus === "failed",
    ).length;
    this.performance.trackingFailures += report.failures.length;
    this.performance.invalidRecordsDetected += report.invalidRecords.length;
  }

  private finalizeOperation(report: ShipmentTrackingReport, action: string): void {
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
      report.records.filter((r) => r.currentShipmentStatus === "delivered").length,
      report.records.filter((r) => r.delayStatus === "delayed").length,
    );
    appendSteLog({
      event: "tracking_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
