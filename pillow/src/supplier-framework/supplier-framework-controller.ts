/** R2-01 — Supplier Framework orchestration controller. */

import { appendFrameworkLog } from "./sf-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { SupplierFrameworkManager } from "./supplier-framework-manager.js";
import type { SupplierFrameworkConfiguration } from "./configuration.js";
import type {
  AbstractSupplierDataInput,
  EngineStatus,
  FrameworkPerformanceStats,
  FrameworkRunReport,
  RegisterSupplierInput,
  RouteSupplierEventInput,
  RunDiagnosticsInput,
} from "./types.js";

export class SupplierFrameworkController {
  private config: SupplierFrameworkConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: FrameworkRunReport | null = null;
  private readonly manager = new SupplierFrameworkManager();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: FrameworkPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    totalEventsRouted: 0,
    rateLimitedEvents: 0,
    dataAbstractions: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(config: SupplierFrameworkConfiguration) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendFrameworkLog({
      event: "framework_initialized",
      level: "info",
      details: "Supplier Framework ready",
    });
  }

  stop(): void {
    this.status = "stopped";
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): SupplierFrameworkConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: SupplierFrameworkConfiguration): void {
    this.config = config;
  }

  getLatestReport(): FrameworkRunReport | null {
    return this.latestReport;
  }

  getManager() {
    return this.manager;
  }

  getHealthMonitor() {
    return this.healthMonitor;
  }

  getRecoveryManager() {
    return this.recoveryManager;
  }

  getPerformance(): FrameworkPerformanceStats {
    return { ...this.performance };
  }

  registerSupplier(input: RegisterSupplierInput): FrameworkRunReport {
    if (!this.config.enabled) throw new Error("Supplier Framework is disabled");
    this.status = "registering";
    appendFrameworkLog({
      event: "supplier_registration_start",
      level: "info",
      details: input.definition.supplierIdentifier,
    });
    const report = this.manager.registerSupplier(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  activateSupplier(supplierIdentifier: string): FrameworkRunReport {
    const report = this.manager.activateSupplier(supplierIdentifier, this.config);
    this.finalizeOperation(report);
    return report;
  }

  suspendSupplier(supplierIdentifier: string): FrameworkRunReport {
    const report = this.manager.suspendSupplier(supplierIdentifier, this.config);
    this.finalizeOperation(report);
    return report;
  }

  shutdownSupplier(supplierIdentifier: string): FrameworkRunReport {
    this.status = "shutting_down";
    const report = this.manager.shutdownSupplier(supplierIdentifier, this.config);
    this.finalizeOperation(report);
    return report;
  }

  routeSupplierEvent(input: RouteSupplierEventInput): FrameworkRunReport {
    const report = this.manager.routeSupplierEvent(input, this.config);
    this.performance.totalEventsRouted += 1;
    if (report.validation.warnings.some((w) => w.includes("rate limited"))) {
      this.performance.rateLimitedEvents += 1;
    }
    this.finalizeOperation(report);
    return report;
  }

  abstractSupplierData(input: AbstractSupplierDataInput): FrameworkRunReport {
    const report = this.manager.abstractSupplierData(input, this.config);
    this.performance.dataAbstractions += 1;
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunDiagnosticsInput = {}): FrameworkRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: FrameworkRunReport): void {
    this.latestReport = report;
    this.performance.totalOperations += 1;
    const duration = report.durationMs;

    if (report.validation.decision === "fail") {
      this.performance.failedOperations += 1;
      this.recoveryManager.recordFailure(
        `Operation failed: ${report.validation.errors.join("; ")}`,
        this.config,
      );
    } else {
      this.performance.successfulOperations += 1;
      this.recoveryManager.recordSuccess();
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
    this.status = "active";
    appendFrameworkLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
