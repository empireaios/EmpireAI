import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { FinancialFrameworkEngine } from "../financial-framework/engine.js";
import {
  buildPaymentGatewayIntegrationConfiguration,
  type PaymentGatewayIntegrationConfiguration,
} from "./configuration.js";
import { appendPgLog, getPgLogs, resetPgLogsForTesting } from "./pg-logging.js";
import { PAYMENT_GATEWAY_INTEGRATION_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectPaymentGatewayInput,
  CreatePaymentRequestInput,
  HandlePaymentWebhookInput,
  PaymentCockpitSnapshot,
  PaymentGatewayIntegrationState,
  PaymentGatewayRunReport,
  ProcessPaymentInput,
  RegisterGatewayInput,
  SyncPaymentStatusInput,
} from "./types.js";
import { PaymentGatewayController } from "./payment-gateway-controller.js";
import { PaymentGatewayManager } from "./payment-gateway-manager.js";

export interface PaymentGatewayIntegrationOptions {
  configuration?: Partial<PaymentGatewayIntegrationConfiguration>;
}

/**
 * Payment Gateway Integration (PILLOW-PG-001 / R3-02).
 * Payment processing through the Financial Framework — structural API, no live HTTP.
 */
export class PaymentGatewayIntegrationEngine {
  private initializedAt: string | null = null;
  private readonly controller: PaymentGatewayController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    financialFramework: FinancialFrameworkEngine,
    options: PaymentGatewayIntegrationOptions = {},
  ) {
    const config = buildPaymentGatewayIntegrationConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new PaymentGatewayManager(financialFramework);
    this.controller = new PaymentGatewayController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<PaymentGatewayIntegrationState> {
    const doc = await this.reader.readText(PAYMENT_GATEWAY_INTEGRATION_SYSTEM_PATH);
    if (!doc?.includes("Payment Gateway Integration")) {
      throw new Error(
        `${PAYMENT_GATEWAY_INTEGRATION_SYSTEM_PATH} missing — Payment Gateway Integration requires R3-02 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendPgLog({
      event: "gateway_initialization",
      level: "info",
      details: "R3-02 Payment Gateway Integration initialized",
    });
    return this.getState();
  }

  getState(): PaymentGatewayIntegrationState {
    if (!this.initializedAt) {
      throw new Error("Payment Gateway Integration not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getGatewayRecord();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalPayments: this.controller.getManager().getPaymentRecords().length,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-PG-001",
      missionId: "R3-02",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      gatewayRecord: record,
      health,
      performance,
    };
  }

  connectPaymentGateway(input: ConnectPaymentGatewayInput = {}): PaymentGatewayRunReport {
    return this.controller.connectPaymentGateway(input);
  }

  registerGateway(input: RegisterGatewayInput): PaymentGatewayRunReport {
    return this.controller.registerGateway(input);
  }

  createPaymentRequest(input: CreatePaymentRequestInput): PaymentGatewayRunReport {
    return this.controller.createPaymentRequest(input);
  }

  processPaymentAuthorization(input: ProcessPaymentInput): PaymentGatewayRunReport {
    return this.controller.processPaymentAuthorization(input);
  }

  processPaymentCapture(input: ProcessPaymentInput): PaymentGatewayRunReport {
    return this.controller.processPaymentCapture(input);
  }

  processPaymentCancellation(input: ProcessPaymentInput): PaymentGatewayRunReport {
    return this.controller.processPaymentCancellation(input);
  }

  handlePaymentWebhook(input: HandlePaymentWebhookInput): PaymentGatewayRunReport {
    return this.controller.handlePaymentWebhook(input);
  }

  syncPaymentStatus(input: SyncPaymentStatusInput = {}): PaymentGatewayRunReport {
    return this.controller.syncPaymentStatus(input);
  }

  getLatestReport(): PaymentGatewayRunReport | null {
    return this.controller.getLatestReport();
  }

  getGatewayRecord() {
    return this.controller.getManager().getGatewayRecord();
  }

  getPaymentRecords() {
    return this.controller.getManager().getPaymentRecords();
  }

  updateConfiguration(
    overrides: Partial<PaymentGatewayIntegrationConfiguration>,
  ): PaymentGatewayIntegrationState {
    const next = buildPaymentGatewayIntegrationConfiguration(this.bootstrap.repositoryRoot, {
      ...this.controller.getConfiguration(),
      ...overrides,
    });
    this.controller.updateConfiguration(next);
    return this.getState();
  }

  validateForSupervisorSync(): {
    valid: boolean;
    health: "healthy" | "degraded" | "blocked";
    readinessScore: number;
    notes: string[];
  } {
    const state = this.getState();
    const report = state.latestReport;
    const score = report
      ? report.validation.decision === "pass"
        ? 100
        : report.validation.decision === "partial"
          ? 70
          : 40
      : state.health.healthScore;

    return {
      valid: state.health.status !== "failed",
      health: score >= 75 ? "healthy" : score >= 50 ? "degraded" : "blocked",
      readinessScore: score,
      notes: [
        `Payment gateway status: ${state.status}`,
        `Authentication: ${state.health.authenticationStatus}`,
        `Connection: ${state.health.connectionStatus}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No payment gateway operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): PaymentCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.gatewayRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      authenticationStatus: record?.authenticationStatus ?? null,
      connectionStatus: record?.connectionStatus ?? null,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      paymentRequests: state.performance.paymentRequests,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      recentLogs: getPgLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createPaymentGatewayIntegrationEngine(
  bootstrap: EmpireBootstrapContext,
  financialFramework: FinancialFrameworkEngine,
  options?: PaymentGatewayIntegrationOptions,
): PaymentGatewayIntegrationEngine {
  return new PaymentGatewayIntegrationEngine(bootstrap, financialFramework, options);
}

export function resetPaymentGatewayIntegrationForTesting(): void {
  resetPgLogsForTesting();
  new PaymentGatewayManager(null).resetForTesting();
}
