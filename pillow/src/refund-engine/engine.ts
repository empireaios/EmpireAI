import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { FinancialFrameworkEngine } from "../financial-framework/engine.js";
import type { PaymentGatewayIntegrationEngine } from "../payment-gateway-integration/engine.js";
import type { BankingIntegrationEngine } from "../banking-integration/engine.js";
import type { RevenueEngine } from "../revenue-engine/engine.js";
import type { ExpenseEngine } from "../expense-engine/engine.js";
import type { InvoiceGeneratorEngine } from "../invoice-generator/engine.js";
import {
  buildRefundEngineConfiguration,
  type RefundEngineConfiguration,
} from "./configuration.js";
import { appendRfLog, getRfLogs, resetRfLogsForTesting } from "./rf-logging.js";
import { REFUND_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectRefundEngineInput,
  CreateRefundRequestInput,
  ProcessFullRefundInput,
  ProcessPartialRefundInput,
  RefundCockpitSnapshot,
  RefundEngineRunReport,
  RefundEngineState,
  ValidateRefundEligibilityInput,
} from "./types.js";
import { RefundEngineController } from "./refund-engine-controller.js";
import { RefundEngineManager } from "./refund-engine-manager.js";

export interface RefundEngineOptions {
  configuration?: Partial<RefundEngineConfiguration>;
}

/**
 * Refund Engine (PILLOW-RF-001 / R3-10).
 * Centralized refund processing consuming R3-02, R3-03, R3-04, R3-05 and R3-09.
 */
export class RefundEngine {
  private initializedAt: string | null = null;
  private readonly controller: RefundEngineController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    financialFramework: FinancialFrameworkEngine,
    paymentGateway: PaymentGatewayIntegrationEngine,
    bankingIntegration: BankingIntegrationEngine,
    revenueEngine: RevenueEngine,
    expenseEngine: ExpenseEngine,
    invoiceGenerator: InvoiceGeneratorEngine,
    options: RefundEngineOptions = {},
  ) {
    const config = buildRefundEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new RefundEngineManager(
      financialFramework,
      paymentGateway,
      bankingIntegration,
      revenueEngine,
      expenseEngine,
      invoiceGenerator,
    );
    this.controller = new RefundEngineController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<RefundEngineState> {
    const doc = await this.reader.readText(REFUND_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Refund Engine")) {
      throw new Error(
        `${REFUND_ENGINE_SYSTEM_PATH} missing — Refund Engine requires R3-10 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendRfLog({
      event: "engine_initialization",
      level: "info",
      details: "R3-10 Refund Engine initialized",
    });
    return this.getState();
  }

  getState(): RefundEngineState {
    if (!this.initializedAt) {
      throw new Error("Refund Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const refundRecords = this.controller.getManager().getRefundRecords();
    const aggregateRefundAmount = refundRecords
      .filter((r) => r.refundStatus === "completed")
      .reduce((s, r) => s + r.refundAmount, 0);
    const latestRecord = refundRecords[refundRecords.length - 1];

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalRefundRecords: refundRecords.length,
      aggregateRefundAmount,
      lastRefundStatus: latestRecord?.refundStatus ?? null,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-RF-001",
      missionId: "R3-10",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectRefundEngine(input: ConnectRefundEngineInput = {}): RefundEngineRunReport {
    return this.controller.connectRefundEngine(input);
  }

  createRefundRequest(input: CreateRefundRequestInput): RefundEngineRunReport {
    return this.controller.createRefundRequest(input);
  }

  validateRefundEligibility(input: ValidateRefundEligibilityInput): RefundEngineRunReport {
    return this.controller.validateRefundEligibility(input);
  }

  processFullRefund(input: ProcessFullRefundInput): RefundEngineRunReport {
    return this.controller.processFullRefund(input);
  }

  processPartialRefund(input: ProcessPartialRefundInput): RefundEngineRunReport {
    return this.controller.processPartialRefund(input);
  }

  getLatestReport(): RefundEngineRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getRefundRecords() {
    return this.controller.getManager().getRefundRecords();
  }

  updateConfiguration(
    overrides: Partial<RefundEngineConfiguration>,
  ): RefundEngineState {
    const next = buildRefundEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Refund engine status: ${state.status}`,
        `Last refund: ${state.health.lastRefundStatus ?? "unknown"}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No refund operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): RefundCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalRefundRecords: state.health.totalRefundRecords,
      aggregateRefundAmount: state.health.aggregateRefundAmount,
      lastRefundStatus: state.health.lastRefundStatus,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      recentLogs: getRfLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createRefundEngine(
  bootstrap: EmpireBootstrapContext,
  financialFramework: FinancialFrameworkEngine,
  paymentGateway: PaymentGatewayIntegrationEngine,
  bankingIntegration: BankingIntegrationEngine,
  revenueEngine: RevenueEngine,
  expenseEngine: ExpenseEngine,
  invoiceGenerator: InvoiceGeneratorEngine,
  options?: RefundEngineOptions,
): RefundEngine {
  return new RefundEngine(
    bootstrap,
    financialFramework,
    paymentGateway,
    bankingIntegration,
    revenueEngine,
    expenseEngine,
    invoiceGenerator,
    options,
  );
}

export function resetRefundEngineForTesting(): void {
  resetRfLogsForTesting();
  new RefundEngineManager(null, null, null, null, null, null).resetForTesting();
}
