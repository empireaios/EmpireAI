/** R1-10 — Shopify Store Connector Controller. */

import { appendShopifyStoreLog } from "./shopify-store-logging.js";
import { ShopifyStoreConnectorManager } from "./shopify-store-connector-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { ShopifyStoreMarketplaceIntegrationConfiguration } from "./configuration.js";
import type {
  ShopifyStoreConnectorRunReport,
  ShopifyStorePerformanceStats,
  ConnectShopifyStoreInput,
  EngineStatus,
  HandleShopifyStoreWebhookInput,
  RouteShopifyStoreApiInput,
} from "./types.js";

export class ShopifyStoreConnectorController {
  private config: ShopifyStoreMarketplaceIntegrationConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: ShopifyStoreConnectorRunReport | null = null;
  private readonly manager: ShopifyStoreConnectorManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: ShopifyStorePerformanceStats = {
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
    manager: ShopifyStoreConnectorManager,
    config: ShopifyStoreMarketplaceIntegrationConfiguration,
  ) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendShopifyStoreLog({
      event: "connector_initialization",
      level: "info",
      details: "Shopify Store Marketplace Integration ready (R1-10)",
    });
  }

  stop(): void {
    this.status = "stopped";
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): ShopifyStoreMarketplaceIntegrationConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: ShopifyStoreMarketplaceIntegrationConfiguration): void {
    this.config = config;
  }

  getLatestReport(): ShopifyStoreConnectorRunReport | null {
    return this.latestReport;
  }

  getManager(): ShopifyStoreConnectorManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): ShopifyStorePerformanceStats {
    return { ...this.performance };
  }

  connectShopifyStore(input: ConnectShopifyStoreInput = {}): ShopifyStoreConnectorRunReport {
    if (!this.config.enabled) throw new Error("Shopify Store Marketplace Integration is disabled");
    this.status = "connecting";
    this.performance.authenticationAttempts += 1;
    appendShopifyStoreLog({
      event: "connection_attempt",
      level: "info",
      details: "connectShopifyStore started",
    });
    const report = this.manager.connectShopifyStore(input, this.config);
    this.finalizeOperation(report, "connect");
    return report;
  }

  testConnection(): ShopifyStoreConnectorRunReport {
    this.performance.connectionTests += 1;
    const report = this.manager.testConnection(this.config);
    this.finalizeOperation(report, "test_connection");
    return report;
  }

  async routeShopifyStoreApi(input: RouteShopifyStoreApiInput): Promise<ShopifyStoreConnectorRunReport> {
    this.performance.apiRequests += 1;
    const report = await this.manager.routeApi(input, this.config);
    if (report.validation.warnings.some((w) => w.includes("rate limited"))) {
      this.performance.rateLimitedRequests += 1;
    }
    this.finalizeOperation(report, "route_api");
    return report;
  }

  handleShopifyStoreWebhook(input: HandleShopifyStoreWebhookInput): ShopifyStoreConnectorRunReport {
    this.performance.webhooksProcessed += 1;
    const report = this.manager.handleWebhook(input, this.config);
    this.finalizeOperation(report, "handle_webhook");
    return report;
  }

  private finalizeOperation(report: ShopifyStoreConnectorRunReport, action: string): void {
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
    appendShopifyStoreLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
