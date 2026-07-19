import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { FinancialFrameworkEngine } from "../financial-framework/engine.js";
import type { PaymentGatewayIntegrationEngine } from "../payment-gateway-integration/engine.js";
import type { BankingIntegrationEngine } from "../banking-integration/engine.js";
import type { RevenueEngine } from "../revenue-engine/engine.js";
import type { ExpenseEngine } from "../expense-engine/engine.js";
import type { CashFlowMonitorEngine } from "../cash-flow-monitor/engine.js";
import {
  buildReconciliationEngineConfiguration,
  type ReconciliationEngineConfiguration,
} from "./configuration.js";
import { appendRcLog, getRcLogs, resetRcLogsForTesting } from "./rc-logging.js";
import { RECONCILIATION_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectReconciliationEngineInput,
  ReconcileAllInput,
  ReconcileBankingInput,
  ReconcileCashFlowInput,
  ReconcileExpensesInput,
  ReconcilePaymentsInput,
  ReconcileRevenueInput,
  ReconciliationCockpitSnapshot,
  ReconciliationEngineState,
  ReconciliationRunReport,
} from "./types.js";
import { ReconciliationController } from "./reconciliation-controller.js";
import { ReconciliationManager } from "./reconciliation-manager.js";

export interface ReconciliationEngineOptions {
  configuration?: Partial<ReconciliationEngineConfiguration>;
}

/**
 * Reconciliation Engine (PILLOW-RC-001 / R3-08).
 * Automated financial reconciliation consuming R3-02 through R3-07.
 */
export class ReconciliationEngine {
  private initializedAt: string | null = null;
  private readonly controller: ReconciliationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    financialFramework: FinancialFrameworkEngine,
    paymentGateway: PaymentGatewayIntegrationEngine,
    bankingIntegration: BankingIntegrationEngine,
    revenueEngine: RevenueEngine,
    expenseEngine: ExpenseEngine,
    cashFlowMonitor: CashFlowMonitorEngine,
    options: ReconciliationEngineOptions = {},
  ) {
    const config = buildReconciliationEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new ReconciliationManager(
      financialFramework,
      paymentGateway,
      bankingIntegration,
      revenueEngine,
      expenseEngine,
      cashFlowMonitor,
    );
    this.controller = new ReconciliationController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<ReconciliationEngineState> {
    const doc = await this.reader.readText(RECONCILIATION_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Reconciliation Engine")) {
      throw new Error(
        `${RECONCILIATION_ENGINE_SYSTEM_PATH} missing — Reconciliation Engine requires R3-08 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendRcLog({
      event: "engine_initialization",
      level: "info",
      details: "R3-08 Reconciliation Engine initialized",
    });
    return this.getState();
  }

  getState(): ReconciliationEngineState {
    if (!this.initializedAt) {
      throw new Error("Reconciliation Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const reconciliationRecords = this.controller.getManager().getReconciliationRecords();
    const aggregateDifferenceAmount = reconciliationRecords.reduce(
      (s, r) => s + r.differenceAmount,
      0,
    );
    const latestRecord = reconciliationRecords[reconciliationRecords.length - 1];

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalReconciliationRecords: reconciliationRecords.length,
      aggregateDifferenceAmount,
      lastReconciliationStatus: latestRecord?.reconciliationStatus ?? null,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-RC-001",
      missionId: "R3-08",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectReconciliationEngine(
    input: ConnectReconciliationEngineInput = {},
  ): ReconciliationRunReport {
    return this.controller.connectReconciliationEngine(input);
  }

  reconcilePayments(input: ReconcilePaymentsInput = {}): ReconciliationRunReport {
    return this.controller.reconcilePayments(input);
  }

  reconcileBanking(input: ReconcileBankingInput = {}): ReconciliationRunReport {
    return this.controller.reconcileBanking(input);
  }

  reconcileRevenue(input: ReconcileRevenueInput = {}): ReconciliationRunReport {
    return this.controller.reconcileRevenue(input);
  }

  reconcileExpenses(input: ReconcileExpensesInput = {}): ReconciliationRunReport {
    return this.controller.reconcileExpenses(input);
  }

  reconcileCashFlow(input: ReconcileCashFlowInput = {}): ReconciliationRunReport {
    return this.controller.reconcileCashFlow(input);
  }

  reconcileAll(input: ReconcileAllInput = {}): ReconciliationRunReport {
    return this.controller.reconcileAll(input);
  }

  getLatestReport(): ReconciliationRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getReconciliationRecords() {
    return this.controller.getManager().getReconciliationRecords();
  }

  updateConfiguration(
    overrides: Partial<ReconciliationEngineConfiguration>,
  ): ReconciliationEngineState {
    const next = buildReconciliationEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Reconciliation engine status: ${state.status}`,
        `Last reconciliation: ${state.health.lastReconciliationStatus ?? "unknown"}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No reconciliation operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ReconciliationCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalReconciliationRecords: state.health.totalReconciliationRecords,
      aggregateDifferenceAmount: state.health.aggregateDifferenceAmount,
      lastReconciliationStatus: state.health.lastReconciliationStatus,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      recentLogs: getRcLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createReconciliationEngine(
  bootstrap: EmpireBootstrapContext,
  financialFramework: FinancialFrameworkEngine,
  paymentGateway: PaymentGatewayIntegrationEngine,
  bankingIntegration: BankingIntegrationEngine,
  revenueEngine: RevenueEngine,
  expenseEngine: ExpenseEngine,
  cashFlowMonitor: CashFlowMonitorEngine,
  options?: ReconciliationEngineOptions,
): ReconciliationEngine {
  return new ReconciliationEngine(
    bootstrap,
    financialFramework,
    paymentGateway,
    bankingIntegration,
    revenueEngine,
    expenseEngine,
    cashFlowMonitor,
    options,
  );
}

export function resetReconciliationEngineForTesting(): void {
  resetRcLogsForTesting();
  new ReconciliationManager(null, null, null, null, null, null).resetForTesting();
}
