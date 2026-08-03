/** X3-01 — Autonomous Scaling Framework orchestration controller. */

import { appendAsfLog } from "./asf-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { AutonomousScalingFrameworkManager } from "./autonomous-scaling-framework-manager.js";
import type { AutonomousScalingFrameworkConfiguration } from "./configuration.js";
import type {
  AbstractScalingDataInput,
  EngineStatus,
  ScalingFrameworkPerformanceStats,
  ScalingFrameworkRunReport,
  RegisterScalingModuleInput,
  RouteScalingEventInput,
  RunScalingDiagnosticsInput,
} from "./types.js";

export class AutonomousScalingFrameworkController {
  private config: AutonomousScalingFrameworkConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: ScalingFrameworkRunReport | null = null;
  private readonly manager = new AutonomousScalingFrameworkManager();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: ScalingFrameworkPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    totalEventsRouted: 0,
    dataAbstractions: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(config: AutonomousScalingFrameworkConfiguration) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendAsfLog({
      event: "framework_initialized",
      level: "info",
      details: "Autonomous Scaling Framework ready",
    });
  }

  stop(): void {
    this.status = "stopped";
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): AutonomousScalingFrameworkConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: AutonomousScalingFrameworkConfiguration): void {
    this.config = config;
  }

  getLatestReport(): ScalingFrameworkRunReport | null {
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

  getPerformance(): ScalingFrameworkPerformanceStats {
    return { ...this.performance };
  }

  registerScalingModule(input: RegisterScalingModuleInput): ScalingFrameworkRunReport {
    if (!this.config.enabled) throw new Error("Autonomous Scaling Framework is disabled");
    this.status = "registering";
    appendAsfLog({
      event: "scaling_module_registration_start",
      level: "info",
      details: input.definition.scalingModuleIdentifier,
    });
    const report = this.manager.registerScalingModule(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  activateScalingModule(scalingModuleIdentifier: string): ScalingFrameworkRunReport {
    const report = this.manager.activateScalingModule(scalingModuleIdentifier, this.config);
    this.finalizeOperation(report);
    return report;
  }

  suspendScalingModule(scalingModuleIdentifier: string): ScalingFrameworkRunReport {
    const report = this.manager.suspendScalingModule(scalingModuleIdentifier, this.config);
    this.finalizeOperation(report);
    return report;
  }

  shutdownScalingModule(scalingModuleIdentifier: string): ScalingFrameworkRunReport {
    this.status = "shutting_down";
    const report = this.manager.shutdownScalingModule(scalingModuleIdentifier, this.config);
    this.finalizeOperation(report);
    return report;
  }

  routeScalingEvent(input: RouteScalingEventInput): ScalingFrameworkRunReport {
    const report = this.manager.routeScalingEvent(input, this.config);
    this.performance.totalEventsRouted += 1;
    this.finalizeOperation(report);
    return report;
  }

  abstractScalingData(input: AbstractScalingDataInput): ScalingFrameworkRunReport {
    const report = this.manager.abstractScalingData(input, this.config);
    this.performance.dataAbstractions += 1;
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunScalingDiagnosticsInput = {}): ScalingFrameworkRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: ScalingFrameworkRunReport): void {
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
    appendAsfLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
