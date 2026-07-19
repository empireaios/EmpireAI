/** R1-11 — WooCommerce Connector Controller. */

import { appendWooCommerceLog } from "./woocommerce-logging.js";
import { WooCommerceConnectorManager } from "./woocommerce-connector-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { WooCommerceMarketplaceIntegrationConfiguration } from "./configuration.js";
import type {
  WooCommerceConnectorRunReport,
  WooCommercePerformanceStats,
  ConnectWooCommerceInput,
  EngineStatus,
  HandleWooCommerceWebhookInput,
  RouteWooCommerceApiInput,
} from "./types.js";

export class WooCommerceConnectorController {
  private config: WooCommerceMarketplaceIntegrationConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: WooCommerceConnectorRunReport | null = null;
  private readonly manager: WooCommerceConnectorManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: WooCommercePerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    authenticationAttempts: 0,
    connectionTests: 0,
    apiRequests: 0,
    webhooksProcessed: 0,
    rateLimitedRequests: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    manager: WooCommerceConnectorManager,
    config: WooCommerceMarketplaceIntegrationConfiguration,
  ) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendWooCommerceLog({
      event: "connector_initialization",
      level: "info",
      details: "WooCommerce Marketplace Integration ready (R1-11)",
    });
  }

  stop(): void {
    this.status = "stopped";
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): WooCommerceMarketplaceIntegrationConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: WooCommerceMarketplaceIntegrationConfiguration): void {
    this.config = config;
  }

  getLatestReport(): WooCommerceConnectorRunReport | null {
    return this.latestReport;
  }

  getManager(): WooCommerceConnectorManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): WooCommercePerformanceStats {
    return { ...this.performance };
  }

  connectWooCommerce(input: ConnectWooCommerceInput = {}): WooCommerceConnectorRunReport {
    if (!this.config.enabled) throw new Error("WooCommerce Marketplace Integration is disabled");
    this.status = "connecting";
    this.performance.authenticationAttempts += 1;
    appendWooCommerceLog({
      event: "connection_attempt",
      level: "info",
      details: "connectWooCommerce started",
    });
    const report = this.manager.connectWooCommerce(input, this.config);
    this.finalizeOperation(report, "connect");
    return report;
  }

  testConnection(): WooCommerceConnectorRunReport {
    this.performance.connectionTests += 1;
    const report = this.manager.testConnection(this.config);
    this.finalizeOperation(report, "test_connection");
    return report;
  }

  async routeWooCommerceApi(input: RouteWooCommerceApiInput): Promise<WooCommerceConnectorRunReport> {
    this.performance.apiRequests += 1;
    const report = await this.manager.routeApi(input, this.config);
    if (report.validation.warnings.some((w) => w.includes("rate limited"))) {
      this.performance.rateLimitedRequests += 1;
    }
    this.finalizeOperation(report, "route_api");
    return report;
  }

  handleWooCommerceWebhook(input: HandleWooCommerceWebhookInput): WooCommerceConnectorRunReport {
    this.performance.webhooksProcessed += 1;
    const report = this.manager.handleWebhook(input, this.config);
    this.finalizeOperation(report, "handle_webhook");
    return report;
  }

  private finalizeOperation(report: WooCommerceConnectorRunReport, action: string): void {
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
    appendWooCommerceLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
