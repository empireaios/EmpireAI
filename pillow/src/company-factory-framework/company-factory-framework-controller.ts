/** X1-01 — Company Factory Framework orchestration controller. */

import { appendFrameworkLog } from "./cff-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { CompanyFactoryFrameworkManager } from "./company-factory-framework-manager.js";
import type { CompanyFactoryFrameworkConfiguration } from "./configuration.js";
import type {
  AbstractCompanyDataInput,
  EngineStatus,
  FrameworkPerformanceStats,
  FrameworkRunReport,
  RegisterCompanyModuleInput,
  RouteCompanyEventInput,
  RunDiagnosticsInput,
} from "./types.js";

export class CompanyFactoryFrameworkController {
  private config: CompanyFactoryFrameworkConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: FrameworkRunReport | null = null;
  private readonly manager = new CompanyFactoryFrameworkManager();
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

  constructor(config: CompanyFactoryFrameworkConfiguration) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendFrameworkLog({
      event: "framework_initialized",
      level: "info",
      details: "Company Factory Framework ready",
    });
  }

  stop(): void {
    this.status = "stopped";
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): CompanyFactoryFrameworkConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: CompanyFactoryFrameworkConfiguration): void {
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

  registerCompanyModule(input: RegisterCompanyModuleInput): FrameworkRunReport {
    if (!this.config.enabled) throw new Error("Company Factory Framework is disabled");
    this.status = "registering";
    appendFrameworkLog({
      event: "company_module_registration_start",
      level: "info",
      details: input.definition.companyModuleIdentifier,
    });
    const report = this.manager.registerCompanyModule(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  activateCompanyModule(companyModuleIdentifier: string): FrameworkRunReport {
    const report = this.manager.activateCompanyModule(companyModuleIdentifier, this.config);
    this.finalizeOperation(report);
    return report;
  }

  suspendCompanyModule(companyModuleIdentifier: string): FrameworkRunReport {
    const report = this.manager.suspendCompanyModule(companyModuleIdentifier, this.config);
    this.finalizeOperation(report);
    return report;
  }

  shutdownCompanyModule(companyModuleIdentifier: string): FrameworkRunReport {
    this.status = "shutting_down";
    const report = this.manager.shutdownCompanyModule(companyModuleIdentifier, this.config);
    this.finalizeOperation(report);
    return report;
  }

  routeCompanyEvent(input: RouteCompanyEventInput): FrameworkRunReport {
    const report = this.manager.routeCompanyEvent(input, this.config);
    this.performance.totalEventsRouted += 1;
    if (report.validation.warnings.some((w) => w.includes("rate limited"))) {
      this.performance.rateLimitedEvents += 1;
    }
    this.finalizeOperation(report);
    return report;
  }

  abstractCompanyData(input: AbstractCompanyDataInput): FrameworkRunReport {
    const report = this.manager.abstractCompanyData(input, this.config);
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
