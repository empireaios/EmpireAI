/** X4-01 — Global Expansion Framework orchestration controller. */

import { appendGefLog } from "./gef-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { GlobalExpansionFrameworkManager } from "./global-expansion-framework-manager.js";
import type { GlobalExpansionFrameworkConfiguration } from "./configuration.js";
import type {
  AbstractRegionalDataInput,
  EngineStatus,
  ExpansionFrameworkPerformanceStats,
  ExpansionFrameworkRunReport,
  RegisterExpansionModuleInput,
  RouteExpansionEventInput,
  RunExpansionDiagnosticsInput,
} from "./types.js";

export class GlobalExpansionFrameworkController {
  private config: GlobalExpansionFrameworkConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: ExpansionFrameworkRunReport | null = null;
  private readonly manager = new GlobalExpansionFrameworkManager();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: ExpansionFrameworkPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    totalEventsRouted: 0,
    dataAbstractions: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(config: GlobalExpansionFrameworkConfiguration) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendGefLog({
      event: "framework_initialized",
      level: "info",
      details: "Global Expansion Framework ready",
    });
  }

  stop(): void {
    this.status = "stopped";
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): GlobalExpansionFrameworkConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: GlobalExpansionFrameworkConfiguration): void {
    this.config = config;
  }

  getLatestReport(): ExpansionFrameworkRunReport | null {
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

  getPerformance(): ExpansionFrameworkPerformanceStats {
    return { ...this.performance };
  }

  registerExpansionModule(input: RegisterExpansionModuleInput): ExpansionFrameworkRunReport {
    if (!this.config.enabled) throw new Error("Global Expansion Framework is disabled");
    this.status = "registering";
    appendGefLog({
      event: "global_expansion_module_registration_start",
      level: "info",
      details: input.definition.expansionModuleIdentifier,
    });
    const report = this.manager.registerExpansionModule(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  activateExpansionModule(expansionModuleIdentifier: string): ExpansionFrameworkRunReport {
    const report = this.manager.activateExpansionModule(expansionModuleIdentifier, this.config);
    this.finalizeOperation(report);
    return report;
  }

  suspendExpansionModule(expansionModuleIdentifier: string): ExpansionFrameworkRunReport {
    const report = this.manager.suspendExpansionModule(expansionModuleIdentifier, this.config);
    this.finalizeOperation(report);
    return report;
  }

  shutdownExpansionModule(expansionModuleIdentifier: string): ExpansionFrameworkRunReport {
    this.status = "shutting_down";
    const report = this.manager.shutdownExpansionModule(expansionModuleIdentifier, this.config);
    this.finalizeOperation(report);
    return report;
  }

  routeExpansionEvent(input: RouteExpansionEventInput): ExpansionFrameworkRunReport {
    const report = this.manager.routeExpansionEvent(input, this.config);
    this.performance.totalEventsRouted += 1;
    this.finalizeOperation(report);
    return report;
  }

  abstractRegionalData(input: AbstractRegionalDataInput): ExpansionFrameworkRunReport {
    const report = this.manager.abstractRegionalData(input, this.config);
    this.performance.dataAbstractions += 1;
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunExpansionDiagnosticsInput = {}): ExpansionFrameworkRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: ExpansionFrameworkRunReport): void {
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
    appendGefLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
