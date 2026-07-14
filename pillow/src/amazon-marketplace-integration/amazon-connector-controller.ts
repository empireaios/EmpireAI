/** R1-02 — Amazon Connector Controller. */

import { appendAmazonLog } from "./amz-logging.js";
import { AmazonConnectorManager } from "./amazon-connector-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { AmazonMarketplaceIntegrationConfiguration } from "./configuration.js";
import type {
  AmazonConnectorRunReport,
  AmazonPerformanceStats,
  ConnectAmazonInput,
  EngineStatus,
  HandleAmazonEventInput,
  RouteAmazonApiInput,
} from "./types.js";

export class AmazonConnectorController {
  private config: AmazonMarketplaceIntegrationConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: AmazonConnectorRunReport | null = null;
  private readonly manager: AmazonConnectorManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: AmazonPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    authenticationAttempts: 0,
    connectionTests: 0,
    apiRequests: 0,
    eventsProcessed: 0,
    rateLimitedRequests: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    manager: AmazonConnectorManager,
    config: AmazonMarketplaceIntegrationConfiguration,
  ) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendAmazonLog({
      event: "connector_initialization",
      level: "info",
      details: "Amazon Marketplace Integration ready (R1-02)",
    });
  }

  stop(): void {
    this.status = "stopped";
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): AmazonMarketplaceIntegrationConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: AmazonMarketplaceIntegrationConfiguration): void {
    this.config = config;
  }

  getLatestReport(): AmazonConnectorRunReport | null {
    return this.latestReport;
  }

  getManager(): AmazonConnectorManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): AmazonPerformanceStats {
    return { ...this.performance };
  }

  connectAmazon(input: ConnectAmazonInput = {}): AmazonConnectorRunReport {
    if (!this.config.enabled) throw new Error("Amazon Marketplace Integration is disabled");
    this.status = "connecting";
    this.performance.authenticationAttempts += 1;
    appendAmazonLog({ event: "connection_attempt", level: "info", details: "connectAmazon started" });
    const report = this.manager.connectAmazon(input, this.config);
    this.finalizeOperation(report, "connect");
    return report;
  }

  testConnection(): AmazonConnectorRunReport {
    this.performance.connectionTests += 1;
    const report = this.manager.testConnection(this.config);
    this.finalizeOperation(report, "test_connection");
    return report;
  }

  async routeAmazonApi(input: RouteAmazonApiInput): Promise<AmazonConnectorRunReport> {
    this.performance.apiRequests += 1;
    const report = await this.manager.routeApi(input, this.config);
    if (report.validation.warnings.some((w) => w.includes("rate limited"))) {
      this.performance.rateLimitedRequests += 1;
    }
    this.finalizeOperation(report, "route_api");
    return report;
  }

  handleAmazonEvent(input: HandleAmazonEventInput): AmazonConnectorRunReport {
    this.performance.eventsProcessed += 1;
    const report = this.manager.handleEvent(input, this.config);
    this.finalizeOperation(report, "handle_event");
    return report;
  }

  private finalizeOperation(report: AmazonConnectorRunReport, action: string): void {
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
    appendAmazonLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
