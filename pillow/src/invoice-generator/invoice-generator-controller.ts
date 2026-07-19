/** R3-09 — Invoice Generator Controller. */

import { appendIgLog } from "./ig-logging.js";
import { InvoiceGeneratorManager } from "./invoice-generator-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { InvoiceGeneratorConfiguration } from "./configuration.js";
import type {
  ConnectInvoiceGeneratorInput,
  CreateCustomerInvoiceInput,
  CreateSupplierInvoiceInput,
  EngineStatus,
  InvoiceGeneratorRunReport,
  InvoicePerformanceStats,
  UpdateInvoiceStatusInput,
} from "./types.js";

export class InvoiceGeneratorController {
  private config: InvoiceGeneratorConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: InvoiceGeneratorRunReport | null = null;
  private readonly manager: InvoiceGeneratorManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: InvoicePerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    customerInvoicesCreated: 0,
    supplierInvoicesCreated: 0,
    lifecycleUpdates: 0,
    inconsistenciesDetected: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: InvoiceGeneratorManager, config: InvoiceGeneratorConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendIgLog({
      event: "generator_initialization",
      level: "info",
      details: "Invoice Generator ready (R3-09)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): InvoiceGeneratorConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: InvoiceGeneratorConfiguration): void {
    this.config = config;
  }

  getLatestReport(): InvoiceGeneratorRunReport | null {
    return this.latestReport;
  }

  getManager(): InvoiceGeneratorManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): InvoicePerformanceStats {
    return { ...this.performance };
  }

  connectInvoiceGenerator(
    input: ConnectInvoiceGeneratorInput = {},
  ): InvoiceGeneratorRunReport {
    if (!this.config.enabled) throw new Error("Invoice Generator is disabled");
    this.status = "connecting";
    const report = this.manager.connectInvoiceGenerator(input, this.config);
    this.finalizeOperation(report, "connect");
    return report;
  }

  createCustomerInvoice(
    input: CreateCustomerInvoiceInput,
  ): InvoiceGeneratorRunReport {
    this.status = "generating";
    this.performance.customerInvoicesCreated += 1;
    const report = this.manager.createCustomerInvoice(input, this.config);
    this.trackInconsistencies(report);
    this.finalizeOperation(report, "create_customer_invoice");
    return report;
  }

  createSupplierInvoice(
    input: CreateSupplierInvoiceInput,
  ): InvoiceGeneratorRunReport {
    this.status = "generating";
    this.performance.supplierInvoicesCreated += 1;
    const report = this.manager.createSupplierInvoice(input, this.config);
    this.trackInconsistencies(report);
    this.finalizeOperation(report, "create_supplier_invoice");
    return report;
  }

  updateInvoiceStatus(input: UpdateInvoiceStatusInput): InvoiceGeneratorRunReport {
    this.performance.lifecycleUpdates += 1;
    const report = this.manager.updateInvoiceStatus(input, this.config);
    this.finalizeOperation(report, "update_invoice_status");
    return report;
  }

  private trackInconsistencies(report: InvoiceGeneratorRunReport): void {
    if (report.inconsistencies.length > 0) {
      this.performance.inconsistenciesDetected += report.inconsistencies.length;
    }
  }

  private finalizeOperation(report: InvoiceGeneratorRunReport, action: string): void {
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
        report.generatorRecord.currentOperationalState === "active" ? "active" : "connected";
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
    appendIgLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
