/** R1-07 — Etsy Connector Controller. */

import { appendEtsyLog } from "./etsy-logging.js";
import { EtsyConnectorManager } from "./etsy-connector-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { EtsyMarketplaceIntegrationConfiguration } from "./configuration.js";
import type {
  EtsyConnectorRunReport,
  EtsyPerformanceStats,
  ConnectEtsyInput,
  EngineStatus,
  HandleEtsyEventInput,
  RouteEtsyApiInput,
} from "./types.js";

export class EtsyConnectorController {
  private config: EtsyMarketplaceIntegrationConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: EtsyConnectorRunReport | null = null;
  private readonly manager: EtsyConnectorManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: EtsyPerformanceStats = {
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
    manager: EtsyConnectorManager,
    config: EtsyMarketplaceIntegrationConfiguration,
  ) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendEtsyLog({
      event: "connector_initialization",
      level: "info",
      details: "Etsy Marketplace Integration ready (R1-07)",
    });
  }

  stop(): void {
    this.status = "stopped";
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): EtsyMarketplaceIntegrationConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: EtsyMarketplaceIntegrationConfiguration): void {
    this.config = config;
  }

  getLatestReport(): EtsyConnectorRunReport | null {
    return this.latestReport;
  }

  getManager(): EtsyConnectorManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): EtsyPerformanceStats {
    return { ...this.performance };
  }

  connectEtsy(input: ConnectEtsyInput = {}): EtsyConnectorRunReport {
    if (!this.config.enabled) throw new Error("Etsy Marketplace Integration is disabled");
    this.status = "connecting";
    this.performance.authenticationAttempts += 1;
    appendEtsyLog({ event: "connection_attempt", level: "info", details: "connectEtsy started" });
    const report = this.manager.connectEtsy(input, this.config);
    this.finalizeOperation(report, "connect");
    return report;
  }

  testConnection(): EtsyConnectorRunReport {
    this.performance.connectionTests += 1;
    const report = this.manager.testConnection(this.config);
    this.finalizeOperation(report, "test_connection");
    return report;
  }

  async routeEtsyApi(input: RouteEtsyApiInput): Promise<EtsyConnectorRunReport> {
    this.performance.apiRequests += 1;
    const report = await this.manager.routeApi(input, this.config);
    if (report.validation.warnings.some((w) => w.includes("rate limited"))) {
      this.performance.rateLimitedRequests += 1;
    }
    this.finalizeOperation(report, "route_api");
    return report;
  }

  handleEtsyEvent(input: HandleEtsyEventInput): EtsyConnectorRunReport {
    this.performance.eventsProcessed += 1;
    const report = this.manager.handleEvent(input, this.config);
    this.finalizeOperation(report, "handle_event");
    return report;
  }

  private finalizeOperation(report: EtsyConnectorRunReport, action: string): void {
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
    appendEtsyLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
