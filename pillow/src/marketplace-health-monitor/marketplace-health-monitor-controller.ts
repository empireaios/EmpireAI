/** R1-14 — Marketplace Health Monitor Controller. */

import { appendHealthMonitorLog } from "./mhm-logging.js";
import { MarketplaceHealthMonitorManager } from "./marketplace-health-monitor-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { MarketplaceHealthMonitorConfiguration } from "./configuration.js";
import type {
  DetectFailuresInput,
  EngineStatus,
  MarketplaceHealthCheckReport,
  MarketplaceHealthMonitorPerformanceStats,
  RunHealthCheckInput,
} from "./types.js";

export class MarketplaceHealthMonitorController {
  private config: MarketplaceHealthMonitorConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: MarketplaceHealthCheckReport | null = null;
  private readonly manager: MarketplaceHealthMonitorManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: MarketplaceHealthMonitorPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    healthCheckRuns: 0,
    marketplacesMonitored: 0,
    failuresDetected: 0,
    alertsGenerated: 0,
    degradedConnectorsDetected: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    manager: MarketplaceHealthMonitorManager,
    config: MarketplaceHealthMonitorConfiguration,
  ) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendHealthMonitorLog({
      event: "engine_initialization",
      level: "info",
      details: "Marketplace Health Monitor ready (R1-14)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): MarketplaceHealthMonitorConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: MarketplaceHealthMonitorConfiguration): void {
    this.config = config;
  }

  getLatestReport(): MarketplaceHealthCheckReport | null {
    return this.latestReport;
  }

  getManager(): MarketplaceHealthMonitorManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): MarketplaceHealthMonitorPerformanceStats {
    return { ...this.performance };
  }

  async runHealthCheck(input: RunHealthCheckInput = {}): Promise<MarketplaceHealthCheckReport> {
    if (!this.config.enabled) throw new Error("Marketplace Health Monitor is disabled");
    this.status = "monitoring";
    this.performance.healthCheckRuns += 1;
    appendHealthMonitorLog({
      event: "health_check_start",
      level: "info",
      details: "runHealthCheck started",
    });
    const report = await this.manager.runHealthCheck(input, this.config);
    this.performance.marketplacesMonitored += report.records.length;
    this.performance.failuresDetected += report.failures.length;
    this.performance.alertsGenerated += report.alerts.length;
    this.performance.degradedConnectorsDetected += report.records.filter(
      (r) => r.overallHealthStatus === "degraded",
    ).length;
    this.finalizeOperation(report, "health_check");
    return report;
  }

  detectFailures(input: DetectFailuresInput = {}): MarketplaceHealthCheckReport {
    const report = this.manager.detectFailures(input, this.config);
    this.performance.failuresDetected += report.failures.length;
    this.performance.alertsGenerated += report.alerts.length;
    this.finalizeOperation(report, "detect_failures");
    return report;
  }

  private finalizeOperation(report: MarketplaceHealthCheckReport, action: string): void {
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
      this.status = report.failures.length > 0 ? "degraded" : "active";
    }

    this.performance.averageOperationDurationMs = Math.round(
      (this.performance.averageOperationDurationMs * (this.performance.totalOperations - 1) +
        duration) /
        this.performance.totalOperations,
    );
    if (duration > this.performance.peakOperationDurationMs) {
      this.performance.peakOperationDurationMs = duration;
    }

    this.healthMonitor.recordOperation(report.validation.decision, report.failures.length);
    appendHealthMonitorLog({
      event: "health_check_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
