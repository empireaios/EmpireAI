/** R3-02 — Payment Gateway Controller. */

import { appendPgLog } from "./pg-logging.js";
import { PaymentGatewayManager } from "./payment-gateway-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { PaymentGatewayIntegrationConfiguration } from "./configuration.js";
import type {
  ConnectPaymentGatewayInput,
  CreatePaymentRequestInput,
  EngineStatus,
  HandlePaymentWebhookInput,
  PaymentGatewayRunReport,
  PaymentPerformanceStats,
  ProcessPaymentInput,
  RegisterGatewayInput,
  SyncPaymentStatusInput,
} from "./types.js";

export class PaymentGatewayController {
  private config: PaymentGatewayIntegrationConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: PaymentGatewayRunReport | null = null;
  private readonly manager: PaymentGatewayManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: PaymentPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    authenticationAttempts: 0,
    paymentRequests: 0,
    authorizations: 0,
    captures: 0,
    cancellations: 0,
    webhookEventsHandled: 0,
    statusSyncs: 0,
    rateLimitedOperations: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: PaymentGatewayManager, config: PaymentGatewayIntegrationConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendPgLog({
      event: "gateway_initialization",
      level: "info",
      details: "Payment Gateway Integration ready (R3-02)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): PaymentGatewayIntegrationConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: PaymentGatewayIntegrationConfiguration): void {
    this.config = config;
  }

  getLatestReport(): PaymentGatewayRunReport | null {
    return this.latestReport;
  }

  getManager(): PaymentGatewayManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): PaymentPerformanceStats {
    return { ...this.performance };
  }

  connectPaymentGateway(input: ConnectPaymentGatewayInput = {}): PaymentGatewayRunReport {
    if (!this.config.enabled) throw new Error("Payment Gateway Integration is disabled");
    this.status = "connecting";
    this.performance.authenticationAttempts += 1;
    appendPgLog({ event: "connection_attempt", level: "info", details: "connectPaymentGateway started" });
    const report = this.manager.connectPaymentGateway(input, this.config);
    this.finalizeOperation(report, "connect");
    return report;
  }

  registerGateway(input: RegisterGatewayInput): PaymentGatewayRunReport {
    const report = this.manager.registerGateway(input, this.config);
    this.finalizeOperation(report, "register_gateway");
    return report;
  }

  createPaymentRequest(input: CreatePaymentRequestInput): PaymentGatewayRunReport {
    this.status = "processing";
    this.performance.paymentRequests += 1;
    const report = this.manager.createPaymentRequest(input, this.config);
    if (report.validation.warnings.some((w) => w.includes("rate limited"))) {
      this.performance.rateLimitedOperations += 1;
    }
    this.finalizeOperation(report, "create_payment");
    return report;
  }

  processPaymentAuthorization(input: ProcessPaymentInput): PaymentGatewayRunReport {
    this.performance.authorizations += 1;
    const report = this.manager.processPaymentAuthorization(input, this.config);
    this.finalizeOperation(report, "authorize");
    return report;
  }

  processPaymentCapture(input: ProcessPaymentInput): PaymentGatewayRunReport {
    this.performance.captures += 1;
    const report = this.manager.processPaymentCapture(input, this.config);
    this.finalizeOperation(report, "capture");
    return report;
  }

  processPaymentCancellation(input: ProcessPaymentInput): PaymentGatewayRunReport {
    this.performance.cancellations += 1;
    const report = this.manager.processPaymentCancellation(input, this.config);
    this.finalizeOperation(report, "cancel");
    return report;
  }

  handlePaymentWebhook(input: HandlePaymentWebhookInput): PaymentGatewayRunReport {
    this.performance.webhookEventsHandled += 1;
    const report = this.manager.handlePaymentWebhook(input, this.config);
    this.finalizeOperation(report, "handle_webhook");
    return report;
  }

  syncPaymentStatus(input: SyncPaymentStatusInput = {}): PaymentGatewayRunReport {
    this.performance.statusSyncs += 1;
    const report = this.manager.syncPaymentStatus(input, this.config);
    this.finalizeOperation(report, "sync_status");
    return report;
  }

  private finalizeOperation(report: PaymentGatewayRunReport, action: string): void {
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
      this.status =
        report.gatewayRecord.currentOperationalState === "active" ? "active" : "connected";
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
    appendPgLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
