/** R3-01 — Financial Framework orchestration controller. */

import { appendFrameworkLog } from "./ff-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { FinancialFrameworkManager } from "./financial-framework-manager.js";
import type { FinancialFrameworkConfiguration } from "./configuration.js";
import type {
  AbstractFinancialDataInput,
  EngineStatus,
  FrameworkPerformanceStats,
  FrameworkRunReport,
  RegisterFinancialModuleInput,
  RouteFinancialEventInput,
  RunDiagnosticsInput,
} from "./types.js";

export class FinancialFrameworkController {
  private config: FinancialFrameworkConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: FrameworkRunReport | null = null;
  private readonly manager = new FinancialFrameworkManager();
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

  constructor(config: FinancialFrameworkConfiguration) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendFrameworkLog({
      event: "framework_initialized",
      level: "info",
      details: "Financial Framework ready",
    });
  }

  stop(): void {
    this.status = "stopped";
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): FinancialFrameworkConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: FinancialFrameworkConfiguration): void {
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

  registerFinancialModule(input: RegisterFinancialModuleInput): FrameworkRunReport {
    if (!this.config.enabled) throw new Error("Financial Framework is disabled");
    this.status = "registering";
    appendFrameworkLog({
      event: "financial_module_registration_start",
      level: "info",
      details: input.definition.financialModuleIdentifier,
    });
    const report = this.manager.registerFinancialModule(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  activateFinancialModule(financialModuleIdentifier: string): FrameworkRunReport {
    const report = this.manager.activateFinancialModule(financialModuleIdentifier, this.config);
    this.finalizeOperation(report);
    return report;
  }

  suspendFinancialModule(financialModuleIdentifier: string): FrameworkRunReport {
    const report = this.manager.suspendFinancialModule(financialModuleIdentifier, this.config);
    this.finalizeOperation(report);
    return report;
  }

  shutdownFinancialModule(financialModuleIdentifier: string): FrameworkRunReport {
    this.status = "shutting_down";
    const report = this.manager.shutdownFinancialModule(financialModuleIdentifier, this.config);
    this.finalizeOperation(report);
    return report;
  }

  routeFinancialEvent(input: RouteFinancialEventInput): FrameworkRunReport {
    const report = this.manager.routeFinancialEvent(input, this.config);
    this.performance.totalEventsRouted += 1;
    if (report.validation.warnings.some((w) => w.includes("rate limited"))) {
      this.performance.rateLimitedEvents += 1;
    }
    this.finalizeOperation(report);
    return report;
  }

  abstractFinancialData(input: AbstractFinancialDataInput): FrameworkRunReport {
    const report = this.manager.abstractFinancialData(input, this.config);
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
