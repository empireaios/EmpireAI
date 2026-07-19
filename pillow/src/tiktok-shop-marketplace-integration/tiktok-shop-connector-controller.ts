/** R1-09 — TikTok Shop Connector Controller. */

import { appendTikTokShopLog } from "./tiktok-shop-logging.js";
import { TikTokShopConnectorManager } from "./tiktok-shop-connector-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { TikTokShopMarketplaceIntegrationConfiguration } from "./configuration.js";
import type {
  TikTokShopConnectorRunReport,
  TikTokShopPerformanceStats,
  ConnectTikTokShopInput,
  EngineStatus,
  HandleTikTokShopEventInput,
  RouteTikTokShopApiInput,
} from "./types.js";

export class TikTokShopConnectorController {
  private config: TikTokShopMarketplaceIntegrationConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: TikTokShopConnectorRunReport | null = null;
  private readonly manager: TikTokShopConnectorManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: TikTokShopPerformanceStats = {
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
    manager: TikTokShopConnectorManager,
    config: TikTokShopMarketplaceIntegrationConfiguration,
  ) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendTikTokShopLog({
      event: "connector_initialization",
      level: "info",
      details: "TikTok Shop Marketplace Integration ready (R1-09)",
    });
  }

  stop(): void {
    this.status = "stopped";
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): TikTokShopMarketplaceIntegrationConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: TikTokShopMarketplaceIntegrationConfiguration): void {
    this.config = config;
  }

  getLatestReport(): TikTokShopConnectorRunReport | null {
    return this.latestReport;
  }

  getManager(): TikTokShopConnectorManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): TikTokShopPerformanceStats {
    return { ...this.performance };
  }

  connectTikTokShop(input: ConnectTikTokShopInput = {}): TikTokShopConnectorRunReport {
    if (!this.config.enabled) throw new Error("TikTok Shop Marketplace Integration is disabled");
    this.status = "connecting";
    this.performance.authenticationAttempts += 1;
    appendTikTokShopLog({
      event: "connection_attempt",
      level: "info",
      details: "connectTikTokShop started",
    });
    const report = this.manager.connectTikTokShop(input, this.config);
    this.finalizeOperation(report, "connect");
    return report;
  }

  testConnection(): TikTokShopConnectorRunReport {
    this.performance.connectionTests += 1;
    const report = this.manager.testConnection(this.config);
    this.finalizeOperation(report, "test_connection");
    return report;
  }

  async routeTikTokShopApi(input: RouteTikTokShopApiInput): Promise<TikTokShopConnectorRunReport> {
    this.performance.apiRequests += 1;
    const report = await this.manager.routeApi(input, this.config);
    if (report.validation.warnings.some((w) => w.includes("rate limited"))) {
      this.performance.rateLimitedRequests += 1;
    }
    this.finalizeOperation(report, "route_api");
    return report;
  }

  handleTikTokShopEvent(input: HandleTikTokShopEventInput): TikTokShopConnectorRunReport {
    this.performance.eventsProcessed += 1;
    const report = this.manager.handleEvent(input, this.config);
    this.finalizeOperation(report, "handle_event");
    return report;
  }

  private finalizeOperation(report: TikTokShopConnectorRunReport, action: string): void {
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
    appendTikTokShopLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
