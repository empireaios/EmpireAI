/** R1-06 — Walmart Connector Controller. */

import { appendWalmartLog } from "./wmt-logging.js";
import { WalmartConnectorManager } from "./walmart-connector-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { WalmartMarketplaceIntegrationConfiguration } from "./configuration.js";
import type {
  WalmartPerformanceStats,
  WalmartConnectorRunReport,
  ConnectWalmartInput,
  EngineStatus,
  RouteWalmartApiInput,
} from "./types.js";

export class WalmartConnectorController {
  private config: WalmartMarketplaceIntegrationConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: WalmartConnectorRunReport | null = null;
  private readonly manager: WalmartConnectorManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: WalmartPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    authenticationAttempts: 0,
    connectionTests: 0,
    apiRequests: 0,
    rateLimitedRequests: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    manager: WalmartConnectorManager,
    config: WalmartMarketplaceIntegrationConfiguration,
  ) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendWalmartLog({
      event: "connector_initialization",
      level: "info",
      details: "Walmart Marketplace Integration ready (R1-06)",
    });
  }

  stop(): void {
    this.status = "stopped";
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): WalmartMarketplaceIntegrationConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: WalmartMarketplaceIntegrationConfiguration): void {
    this.config = config;
  }

  getLatestReport(): WalmartConnectorRunReport | null {
    return this.latestReport;
  }

  getManager(): WalmartConnectorManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): WalmartPerformanceStats {
    return { ...this.performance };
  }

  connectWalmart(input: ConnectWalmartInput = {}): WalmartConnectorRunReport {
    if (!this.config.enabled) throw new Error("Walmart Marketplace Integration is disabled");
    this.status = "connecting";
    this.performance.authenticationAttempts += 1;
    appendWalmartLog({ event: "connection_attempt", level: "info", details: "connectWalmart started" });
    const report = this.manager.connectWalmart(input, this.config);
    this.finalizeOperation(report, "connect");
    return report;
  }

  testConnection(): WalmartConnectorRunReport {
    this.performance.connectionTests += 1;
    const report = this.manager.testConnection(this.config);
    this.finalizeOperation(report, "test_connection");
    return report;
  }

  async routeWalmartApi(input: RouteWalmartApiInput): Promise<WalmartConnectorRunReport> {
    this.performance.apiRequests += 1;
    const report = await this.manager.routeApi(input, this.config);
    if (report.validation.warnings.some((w) => w.includes("rate limited"))) {
      this.performance.rateLimitedRequests += 1;
    }
    this.finalizeOperation(report, "route_api");
    return report;
  }

  private finalizeOperation(report: WalmartConnectorRunReport, action: string): void {
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
      this.status = report.record.currentOperationalState === "active" ? "active" : "connected";
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
    appendWalmartLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
