/** R1-01 — Marketplace Connector Framework orchestration controller. */

import { appendFrameworkLog } from "./mcf-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { MarketplaceConnectorFrameworkManager } from "./marketplace-connector-framework-manager.js";
import type { MarketplaceConnectorFrameworkConfiguration } from "./configuration.js";
import type {
  EngineStatus,
  FrameworkPerformanceStats,
  FrameworkRunReport,
  HandleWebhookInput,
  RegisterConnectorInput,
  RouteApiRequestInput,
} from "./types.js";

export class MarketplaceConnectorFrameworkController {
  private config: MarketplaceConnectorFrameworkConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: FrameworkRunReport | null = null;
  private readonly manager = new MarketplaceConnectorFrameworkManager();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: FrameworkPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    totalApiRequests: 0,
    rateLimitedRequests: 0,
    retriedRequests: 0,
    webhookEventsHandled: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(config: MarketplaceConnectorFrameworkConfiguration) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendFrameworkLog({
      event: "framework_initialized",
      level: "info",
      details: "Marketplace Connector Framework ready",
    });
  }

  stop(): void {
    this.status = "stopped";
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): MarketplaceConnectorFrameworkConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: MarketplaceConnectorFrameworkConfiguration): void {
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

  registerConnector(input: RegisterConnectorInput): FrameworkRunReport {
    if (!this.config.enabled) throw new Error("Marketplace Connector Framework is disabled");
    this.status = "registering";
    appendFrameworkLog({ event: "connector_registration_start", level: "info", details: input.definition.marketplaceId });
    const report = this.manager.registerConnector(input, this.config);
    this.finalizeOperation(report, "register");
    return report;
  }

  activateConnector(marketplaceId: string): FrameworkRunReport {
    const report = this.manager.activateConnector(marketplaceId, this.config);
    this.finalizeOperation(report, "activate");
    return report;
  }

  suspendConnector(marketplaceId: string): FrameworkRunReport {
    const report = this.manager.suspendConnector(marketplaceId);
    this.finalizeOperation(report, "suspend");
    return report;
  }

  shutdownConnector(marketplaceId: string): FrameworkRunReport {
    this.status = "shutting_down";
    const report = this.manager.shutdownConnector(marketplaceId);
    this.finalizeOperation(report, "shutdown");
    return report;
  }

  async routeApiRequest(input: RouteApiRequestInput): Promise<FrameworkRunReport> {
    const report = await this.manager.routeApiRequest(input, this.config);
    this.performance.totalApiRequests += 1;
    if (report.validation.warnings.some((w) => w.includes("rate limited"))) {
      this.performance.rateLimitedRequests += 1;
    }
    this.finalizeOperation(report, "route_api");
    return report;
  }

  handleWebhook(input: HandleWebhookInput): FrameworkRunReport {
    const report = this.manager.handleWebhook(input, this.config);
    this.performance.webhookEventsHandled += 1;
    this.finalizeOperation(report, "handle_webhook");
    return report;
  }

  private finalizeOperation(report: FrameworkRunReport, _action: string): void {
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
      (this.performance.averageOperationDurationMs * (this.performance.totalOperations - 1) + duration) /
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
