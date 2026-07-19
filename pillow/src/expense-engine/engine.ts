import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { FinancialFrameworkEngine } from "../financial-framework/engine.js";
import type { PaymentGatewayIntegrationEngine } from "../payment-gateway-integration/engine.js";
import type { BankingIntegrationEngine } from "../banking-integration/engine.js";
import type { RevenueEngine } from "../revenue-engine/engine.js";
import {
  buildExpenseEngineConfiguration,
  type ExpenseEngineConfiguration,
} from "./configuration.js";
import { appendExLog, getExLogs, resetExLogsForTesting } from "./ex-logging.js";
import { EXPENSE_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  AggregateExpensesInput,
  ConnectExpenseEngineInput,
  ExpenseCockpitSnapshot,
  ExpenseEngineRunReport,
  ExpenseEngineState,
  RecordAdvertisingExpenseInput,
  RecordExpenseEventInput,
  RecordOperationalExpenseInput,
  RecordPlatformFeeInput,
  RecordShippingExpenseInput,
  RecordSupplierPaymentInput,
} from "./types.js";
import { ExpenseEngineController } from "./expense-engine-controller.js";
import { ExpenseEngineManager } from "./expense-engine-manager.js";

export interface ExpenseEngineOptions {
  configuration?: Partial<ExpenseEngineConfiguration>;
}

/**
 * Expense Engine (PILLOW-EX-001 / R3-05).
 * Centralized expense tracking consuming R3-02, R3-03, and R3-04.
 */
export class ExpenseEngine {
  private initializedAt: string | null = null;
  private readonly controller: ExpenseEngineController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    financialFramework: FinancialFrameworkEngine,
    paymentGateway: PaymentGatewayIntegrationEngine,
    bankingIntegration: BankingIntegrationEngine,
    revenueEngine: RevenueEngine,
    options: ExpenseEngineOptions = {},
  ) {
    const config = buildExpenseEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new ExpenseEngineManager(
      financialFramework,
      paymentGateway,
      bankingIntegration,
      revenueEngine,
    );
    this.controller = new ExpenseEngineController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<ExpenseEngineState> {
    const doc = await this.reader.readText(EXPENSE_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Expense Engine")) {
      throw new Error(
        `${EXPENSE_ENGINE_SYSTEM_PATH} missing — Expense Engine requires R3-05 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendExLog({
      event: "engine_initialization",
      level: "info",
      details: "R3-05 Expense Engine initialized",
    });
    return this.getState();
  }

  getState(): ExpenseEngineState {
    if (!this.initializedAt) {
      throw new Error("Expense Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const expenseRecords = this.controller.getManager().getExpenseRecords();
    const totalExpenses = expenseRecords.reduce((sum, r) => sum + r.expenseAmount, 0);
    const recurringExpenses = expenseRecords
      .filter((r) => r.expenseCategory === "recurring")
      .reduce((sum, r) => sum + r.expenseAmount, 0);

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalExpenseRecords: expenseRecords.length,
      totalExpenses,
      recurringExpenses,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-EX-001",
      missionId: "R3-05",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectExpenseEngine(input: ConnectExpenseEngineInput = {}): ExpenseEngineRunReport {
    return this.controller.connectExpenseEngine(input);
  }

  recordExpenseEvent(input: RecordExpenseEventInput): ExpenseEngineRunReport {
    return this.controller.recordExpenseEvent(input);
  }

  recordSupplierPayment(input: RecordSupplierPaymentInput): ExpenseEngineRunReport {
    return this.controller.recordSupplierPayment(input);
  }

  recordShippingExpense(input: RecordShippingExpenseInput): ExpenseEngineRunReport {
    return this.controller.recordShippingExpense(input);
  }

  recordAdvertisingExpense(input: RecordAdvertisingExpenseInput): ExpenseEngineRunReport {
    return this.controller.recordAdvertisingExpense(input);
  }

  recordPlatformFee(input: RecordPlatformFeeInput): ExpenseEngineRunReport {
    return this.controller.recordPlatformFee(input);
  }

  recordOperationalExpense(input: RecordOperationalExpenseInput): ExpenseEngineRunReport {
    return this.controller.recordOperationalExpense(input);
  }

  aggregateExpenses(input: AggregateExpensesInput = {}): ExpenseEngineRunReport {
    return this.controller.aggregateExpenses(input);
  }

  getLatestReport(): ExpenseEngineRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getExpenseRecords() {
    return this.controller.getManager().getExpenseRecords();
  }

  updateConfiguration(
    overrides: Partial<ExpenseEngineConfiguration>,
  ): ExpenseEngineState {
    const next = buildExpenseEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Expense engine status: ${state.status}`,
        `Total expenses: ${state.health.totalExpenses}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No expense operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ExpenseCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalExpenseRecords: state.health.totalExpenseRecords,
      totalExpenses: state.health.totalExpenses,
      recurringExpenses: state.health.recurringExpenses,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      recentLogs: getExLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createExpenseEngine(
  bootstrap: EmpireBootstrapContext,
  financialFramework: FinancialFrameworkEngine,
  paymentGateway: PaymentGatewayIntegrationEngine,
  bankingIntegration: BankingIntegrationEngine,
  revenueEngine: RevenueEngine,
  options?: ExpenseEngineOptions,
): ExpenseEngine {
  return new ExpenseEngine(
    bootstrap,
    financialFramework,
    paymentGateway,
    bankingIntegration,
    revenueEngine,
    options,
  );
}

export function resetExpenseEngineForTesting(): void {
  resetExLogsForTesting();
  new ExpenseEngineManager(null, null, null, null).resetForTesting();
}
