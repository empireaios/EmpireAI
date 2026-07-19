/** R2-11 — Shipping Carrier Controller. */

import { appendSciLog } from "./sci-logging.js";
import { ShippingCarrierManager } from "./shipping-carrier-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { ShippingCarrierIntegrationConfiguration } from "./configuration.js";
import type {
  CarrierPerformanceStats,
  CreateShipmentRequestInput,
  EngineStatus,
  RegisterCarrierInput,
  RequestShippingLabelInput,
  RequestShippingRatesInput,
  ShipmentReport,
} from "./types.js";

export class ShippingCarrierController {
  private config: ShippingCarrierIntegrationConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: ShipmentReport | null = null;
  private readonly manager: ShippingCarrierManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: CarrierPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    shipmentRequests: 0,
    labelsGenerated: 0,
    ratesRequested: 0,
    carriersRegistered: 0,
    carrierFailures: 0,
    invalidRequestsDetected: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: ShippingCarrierManager, config: ShippingCarrierIntegrationConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendSciLog({
      event: "engine_initialization",
      level: "info",
      details: "Shipping Carrier Integration ready (R2-11)",
    });
  }

  stop(): void {
    this.status = "stopped";
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): ShippingCarrierIntegrationConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: ShippingCarrierIntegrationConfiguration): void {
    this.config = config;
  }

  getLatestReport(): ShipmentReport | null {
    return this.latestReport;
  }

  getManager(): ShippingCarrierManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): CarrierPerformanceStats {
    return { ...this.performance };
  }

  registerCarriers(input: RegisterCarrierInput = {}): ShipmentReport {
    if (!this.config.enabled) throw new Error("Shipping Carrier Integration is disabled");
    const report = this.manager.registerCarriers(input, this.config);
    this.performance.carriersRegistered += this.manager.getCarriers().length;
    this.finalizeOperation(report, "register");
    return report;
  }

  createShipmentRequest(input: CreateShipmentRequestInput = {}): ShipmentReport {
    if (!this.config.enabled) throw new Error("Shipping Carrier Integration is disabled");
    this.status = "shipping";
    this.performance.shipmentRequests += 1;
    appendSciLog({ event: "shipment_start", level: "info", details: "createShipmentRequest started" });
    const report = this.manager.createShipmentRequest(input, this.config);
    this.recordShipmentMetrics(report);
    this.finalizeOperation(report, "create");
    return report;
  }

  requestShippingLabel(input: RequestShippingLabelInput): ShipmentReport {
    const report = this.manager.requestShippingLabel(input, this.config);
    this.recordShipmentMetrics(report);
    this.finalizeOperation(report, "label");
    return report;
  }

  requestShippingRates(input: RequestShippingRatesInput = {}): ShipmentReport {
    this.performance.ratesRequested += 1;
    const report = this.manager.requestShippingRates(input, this.config);
    this.finalizeOperation(report, "rate");
    return report;
  }

  private recordShipmentMetrics(report: ShipmentReport): void {
    this.performance.labelsGenerated += report.records.filter(
      (r) => r.shippingLabelReference !== null,
    ).length;
    this.performance.carrierFailures += report.failures.length;
    this.performance.invalidRequestsDetected += report.invalidRequests.length;
  }

  private finalizeOperation(report: ShipmentReport, action: string): void {
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

    this.healthMonitor.recordOperation(
      report.validation.decision,
      report.failures,
      report.invalidRequests,
      report.records.filter((r) => r.shippingLabelReference !== null).length,
    );
    appendSciLog({
      event: "shipment_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
