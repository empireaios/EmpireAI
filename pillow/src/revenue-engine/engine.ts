import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { FinancialFrameworkEngine } from "../financial-framework/engine.js";
import type { PaymentGatewayIntegrationEngine } from "../payment-gateway-integration/engine.js";
import type { BankingIntegrationEngine } from "../banking-integration/engine.js";
import {
  buildRevenueEngineConfiguration,
  type RevenueEngineConfiguration,
} from "./configuration.js";
import { appendReLog, getReLogs, resetReLogsForTesting } from "./re-logging.js";
import { REVENUE_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  AggregateRevenueInput,
  ConnectRevenueEngineInput,
  RecordCompletedPaymentInput,
  RecordMarketplaceRevenueInput,
  RecordRevenueEventInput,
  RecordRevenueRefundInput,
  RecordSupplierSettlementInput,
  RevenueCockpitSnapshot,
  RevenueEngineRunReport,
  RevenueEngineState,
} from "./types.js";
import { RevenueEngineController } from "./revenue-engine-controller.js";
import { RevenueEngineManager } from "./revenue-engine-manager.js";

export interface RevenueEngineOptions {
  configuration?: Partial<RevenueEngineConfiguration>;
}

/**
 * Revenue Engine (PILLOW-RE-001 / R3-04).
 * Centralized revenue tracking consuming R3-02 and R3-03.
 */
export class RevenueEngine {
  private initializedAt: string | null = null;
  private readonly controller: RevenueEngineController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    financialFramework: FinancialFrameworkEngine,
    paymentGateway: PaymentGatewayIntegrationEngine,
    bankingIntegration: BankingIntegrationEngine,
    options: RevenueEngineOptions = {},
  ) {
    const config = buildRevenueEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new RevenueEngineManager(
      financialFramework,
      paymentGateway,
      bankingIntegration,
    );
    this.controller = new RevenueEngineController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<RevenueEngineState> {
    const doc = await this.reader.readText(REVENUE_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Revenue Engine")) {
      throw new Error(
        `${REVENUE_ENGINE_SYSTEM_PATH} missing — Revenue Engine requires R3-04 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendReLog({
      event: "engine_initialization",
      level: "info",
      details: "R3-04 Revenue Engine initialized",
    });
    return this.getState();
  }

  getState(): RevenueEngineState {
    if (!this.initializedAt) {
      throw new Error("Revenue Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const revenueRecords = this.controller.getManager().getRevenueRecords();
    const grossRevenue = revenueRecords.reduce((sum, r) => sum + r.grossRevenue, 0);
    const netRevenue = revenueRecords.reduce((sum, r) => sum + r.netRevenue, 0);

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalRevenueRecords: revenueRecords.length,
      grossRevenue,
      netRevenue,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-RE-001",
      missionId: "R3-04",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectRevenueEngine(input: ConnectRevenueEngineInput = {}): RevenueEngineRunReport {
    return this.controller.connectRevenueEngine(input);
  }

  recordRevenueEvent(input: RecordRevenueEventInput): RevenueEngineRunReport {
    return this.controller.recordRevenueEvent(input);
  }

  recordCompletedPayment(input: RecordCompletedPaymentInput): RevenueEngineRunReport {
    return this.controller.recordCompletedPayment(input);
  }

  recordMarketplaceRevenue(input: RecordMarketplaceRevenueInput): RevenueEngineRunReport {
    return this.controller.recordMarketplaceRevenue(input);
  }

  recordSupplierSettlement(input: RecordSupplierSettlementInput): RevenueEngineRunReport {
    return this.controller.recordSupplierSettlement(input);
  }

  recordRevenueRefund(input: RecordRevenueRefundInput): RevenueEngineRunReport {
    return this.controller.recordRevenueRefund(input);
  }

  aggregateRevenue(input: AggregateRevenueInput = {}): RevenueEngineRunReport {
    return this.controller.aggregateRevenue(input);
  }

  getLatestReport(): RevenueEngineRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getRevenueRecords() {
    return this.controller.getManager().getRevenueRecords();
  }

  updateConfiguration(
    overrides: Partial<RevenueEngineConfiguration>,
  ): RevenueEngineState {
    const next = buildRevenueEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Revenue engine status: ${state.status}`,
        `Gross revenue: ${state.health.grossRevenue}`,
        `Net revenue: ${state.health.netRevenue}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No revenue operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): RevenueCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalRevenueRecords: state.health.totalRevenueRecords,
      grossRevenue: state.health.grossRevenue,
      netRevenue: state.health.netRevenue,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      recentLogs: getReLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createRevenueEngine(
  bootstrap: EmpireBootstrapContext,
  financialFramework: FinancialFrameworkEngine,
  paymentGateway: PaymentGatewayIntegrationEngine,
  bankingIntegration: BankingIntegrationEngine,
  options?: RevenueEngineOptions,
): RevenueEngine {
  return new RevenueEngine(
    bootstrap,
    financialFramework,
    paymentGateway,
    bankingIntegration,
    options,
  );
}

export function resetRevenueEngineForTesting(): void {
  resetReLogsForTesting();
  new RevenueEngineManager(null, null, null).resetForTesting();
}
