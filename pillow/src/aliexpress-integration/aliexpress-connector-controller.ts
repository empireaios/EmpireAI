/** R2-03 — AliExpress Connector Controller. */

import { appendAexLog } from "./aex-logging.js";
import { AliExpressConnectorManager } from "./aliexpress-connector-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { AliExpressIntegrationConfiguration } from "./configuration.js";
import type {
  AliExpressPerformanceStats,
  AliExpressConnectorRunReport,
  ConnectAliExpressInput,
  EngineStatus,
  RouteAliExpressApiInput,
  HandleAliExpressWebhookInput,
} from "./types.js";

export class AliExpressConnectorController {
  private config: AliExpressIntegrationConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: AliExpressConnectorRunReport | null = null;
  private readonly manager: AliExpressConnectorManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: AliExpressPerformanceStats = {
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

  constructor(manager: AliExpressConnectorManager, config: AliExpressIntegrationConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendAexLog({
      event: "connector_initialization",
      level: "info",
      details: "AliExpress Integration ready (R2-03)",
    });
  }

  stop(): void {
    this.status = "stopped";
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): AliExpressIntegrationConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: AliExpressIntegrationConfiguration): void {
    this.config = config;
  }

  getLatestReport(): AliExpressConnectorRunReport | null {
    return this.latestReport;
  }

  getManager(): AliExpressConnectorManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): AliExpressPerformanceStats {
    return { ...this.performance };
  }

  connectAliExpress(input: ConnectAliExpressInput = {}): AliExpressConnectorRunReport {
    if (!this.config.enabled) throw new Error("AliExpress Integration is disabled");
    this.status = "connecting";
    this.performance.authenticationAttempts += 1;
    appendAexLog({ event: "connection_attempt", level: "info", details: "connectAliExpress started" });
    const report = this.manager.connectAliExpress(input, this.config);
    this.finalizeOperation(report, "connect");
    return report;
  }

  testConnection(): AliExpressConnectorRunReport {
    this.performance.connectionTests += 1;
    const report = this.manager.testConnection(this.config);
    this.finalizeOperation(report, "test_connection");
    return report;
  }

  async routeAliExpressApi(input: RouteAliExpressApiInput): Promise<AliExpressConnectorRunReport> {
    this.performance.apiRequests += 1;
    const report = await this.manager.routeApi(input, this.config);
    if (report.validation.warnings.some((w) => w.includes("rate limited"))) {
      this.performance.rateLimitedRequests += 1;
    }
    this.finalizeOperation(report, "route_api");
    return report;
  }

  handleAliExpressWebhook(input: HandleAliExpressWebhookInput): AliExpressConnectorRunReport {
    this.performance.webhookEventsHandled += 1;
    const report = this.manager.handleWebhook(input, this.config);
    this.finalizeOperation(report, "handle_webhook");
    return report;
  }

  private finalizeOperation(report: AliExpressConnectorRunReport, action: string): void {
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
    appendAexLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
