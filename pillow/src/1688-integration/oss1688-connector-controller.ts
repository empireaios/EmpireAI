/** R2-04 — 1688 Connector Controller. */

import { appendOssLog } from "./oss-logging.js";
import { Oss1688ConnectorManager } from "./oss1688-connector-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { Oss1688IntegrationConfiguration } from "./configuration.js";
import type {
  Oss1688PerformanceStats,
  Oss1688ConnectorRunReport,
  ConnectOss1688Input,
  EngineStatus,
  RouteOss1688ApiInput,
  HandleOss1688WebhookInput,
} from "./types.js";

export class Oss1688ConnectorController {
  private config: Oss1688IntegrationConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: Oss1688ConnectorRunReport | null = null;
  private readonly manager: Oss1688ConnectorManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: Oss1688PerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    authenticationAttempts: 0,
    connectionTests: 0,
    apiRequests: 0,
    webhookEventsHandled: 0,
    rateLimitedRequests: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: Oss1688ConnectorManager, config: Oss1688IntegrationConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendOssLog({
      event: "connector_initialization",
      level: "info",
      details: "1688 Integration ready (R2-04)",
    });
  }

  stop(): void {
    this.status = "stopped";
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): Oss1688IntegrationConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: Oss1688IntegrationConfiguration): void {
    this.config = config;
  }

  getLatestReport(): Oss1688ConnectorRunReport | null {
    return this.latestReport;
  }

  getManager(): Oss1688ConnectorManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): Oss1688PerformanceStats {
    return { ...this.performance };
  }

  connectOss1688(input: ConnectOss1688Input = {}): Oss1688ConnectorRunReport {
    if (!this.config.enabled) throw new Error("1688 Integration is disabled");
    this.status = "connecting";
    this.performance.authenticationAttempts += 1;
    appendOssLog({ event: "connection_attempt", level: "info", details: "connectOss1688 started" });
    const report = this.manager.connectOss1688(input, this.config);
    this.finalizeOperation(report, "connect");
    return report;
  }

  testConnection(): Oss1688ConnectorRunReport {
    this.performance.connectionTests += 1;
    const report = this.manager.testConnection(this.config);
    this.finalizeOperation(report, "test_connection");
    return report;
  }

  async routeOss1688Api(input: RouteOss1688ApiInput): Promise<Oss1688ConnectorRunReport> {
    this.performance.apiRequests += 1;
    const report = await this.manager.routeApi(input, this.config);
    if (report.validation.warnings.some((w) => w.includes("rate limited"))) {
      this.performance.rateLimitedRequests += 1;
    }
    this.finalizeOperation(report, "route_api");
    return report;
  }

  handleOss1688Webhook(input: HandleOss1688WebhookInput): Oss1688ConnectorRunReport {
    this.performance.webhookEventsHandled += 1;
    const report = this.manager.handleWebhook(input, this.config);
    this.finalizeOperation(report, "handle_webhook");
    return report;
  }

  private finalizeOperation(report: Oss1688ConnectorRunReport, action: string): void {
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
    appendOssLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
