/** R5-01 — Marketing Framework orchestration controller. */

import { appendFrameworkLog } from "./mfw-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { MarketingFrameworkManager } from "./marketing-framework-manager.js";
import type { MarketingFrameworkConfiguration } from "./configuration.js";
import type {
  AbstractMarketingDataInput,
  EngineStatus,
  FrameworkPerformanceStats,
  FrameworkRunReport,
  RegisterMarketingModuleInput,
  RouteMarketingEventInput,
  RunDiagnosticsInput,
} from "./types.js";

export class MarketingFrameworkController {
  private config: MarketingFrameworkConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: FrameworkRunReport | null = null;
  private readonly manager = new MarketingFrameworkManager();
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

  constructor(config: MarketingFrameworkConfiguration) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendFrameworkLog({
      event: "framework_initialized",
      level: "info",
      details: "Marketing Framework ready",
    });
  }

  stop(): void {
    this.status = "stopped";
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): MarketingFrameworkConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: MarketingFrameworkConfiguration): void {
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

  registerMarketingModule(input: RegisterMarketingModuleInput): FrameworkRunReport {
    if (!this.config.enabled) throw new Error("Marketing Framework is disabled");
    this.status = "registering";
    appendFrameworkLog({
      event: "marketing_module_registration_start",
      level: "info",
      details: input.definition.marketingModuleIdentifier,
    });
    const report = this.manager.registerMarketingModule(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  activateMarketingModule(marketingModuleIdentifier: string): FrameworkRunReport {
    const report = this.manager.activateMarketingModule(marketingModuleIdentifier, this.config);
    this.finalizeOperation(report);
    return report;
  }

  suspendMarketingModule(marketingModuleIdentifier: string): FrameworkRunReport {
    const report = this.manager.suspendMarketingModule(marketingModuleIdentifier, this.config);
    this.finalizeOperation(report);
    return report;
  }

  shutdownMarketingModule(marketingModuleIdentifier: string): FrameworkRunReport {
    this.status = "shutting_down";
    const report = this.manager.shutdownMarketingModule(marketingModuleIdentifier, this.config);
    this.finalizeOperation(report);
    return report;
  }

  routeMarketingEvent(input: RouteMarketingEventInput): FrameworkRunReport {
    const report = this.manager.routeMarketingEvent(input, this.config);
    this.performance.totalEventsRouted += 1;
    if (report.validation.warnings.some((w) => w.includes("rate limited"))) {
      this.performance.rateLimitedEvents += 1;
    }
    this.finalizeOperation(report);
    return report;
  }

  abstractMarketingData(input: AbstractMarketingDataInput): FrameworkRunReport {
    const report = this.manager.abstractMarketingData(input, this.config);
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
