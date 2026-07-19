/** R3-08 — Reconciliation Engine Controller. */

import { appendRcLog } from "./rc-logging.js";
import { ReconciliationManager } from "./reconciliation-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { ReconciliationEngineConfiguration } from "./configuration.js";
import type {
  ConnectReconciliationEngineInput,
  EngineStatus,
  ReconcileAllInput,
  ReconcileBankingInput,
  ReconcileCashFlowInput,
  ReconcileExpensesInput,
  ReconcilePaymentsInput,
  ReconcileRevenueInput,
  ReconciliationPerformanceStats,
  ReconciliationRunReport,
} from "./types.js";

export class ReconciliationController {
  private config: ReconciliationEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: ReconciliationRunReport | null = null;
  private readonly manager: ReconciliationManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: ReconciliationPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    paymentReconciliations: 0,
    bankingReconciliations: 0,
    revenueReconciliations: 0,
    expenseReconciliations: 0,
    cashFlowReconciliations: 0,
    fullReconciliations: 0,
    mismatchesDetected: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: ReconciliationManager, config: ReconciliationEngineConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendRcLog({
      event: "engine_initialization",
      level: "info",
      details: "Reconciliation Engine ready (R3-08)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): ReconciliationEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: ReconciliationEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): ReconciliationRunReport | null {
    return this.latestReport;
  }

  getManager(): ReconciliationManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): ReconciliationPerformanceStats {
    return { ...this.performance };
  }

  connectReconciliationEngine(
    input: ConnectReconciliationEngineInput = {},
  ): ReconciliationRunReport {
    if (!this.config.enabled) throw new Error("Reconciliation Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectReconciliationEngine(input, this.config);
    this.finalizeOperation(report, "connect");
    return report;
  }

  reconcilePayments(input: ReconcilePaymentsInput = {}): ReconciliationRunReport {
    this.status = "reconciling";
    this.performance.paymentReconciliations += 1;
    const report = this.manager.reconcilePayments(input, this.config);
    this.trackMismatches(report);
    this.finalizeOperation(report, "reconcile_payments");
    return report;
  }

  reconcileBanking(input: ReconcileBankingInput = {}): ReconciliationRunReport {
    this.status = "reconciling";
    this.performance.bankingReconciliations += 1;
    const report = this.manager.reconcileBanking(input, this.config);
    this.trackMismatches(report);
    this.finalizeOperation(report, "reconcile_banking");
    return report;
  }

  reconcileRevenue(input: ReconcileRevenueInput = {}): ReconciliationRunReport {
    this.status = "reconciling";
    this.performance.revenueReconciliations += 1;
    const report = this.manager.reconcileRevenue(input, this.config);
    this.trackMismatches(report);
    this.finalizeOperation(report, "reconcile_revenue");
    return report;
  }

  reconcileExpenses(input: ReconcileExpensesInput = {}): ReconciliationRunReport {
    this.status = "reconciling";
    this.performance.expenseReconciliations += 1;
    const report = this.manager.reconcileExpenses(input, this.config);
    this.trackMismatches(report);
    this.finalizeOperation(report, "reconcile_expenses");
    return report;
  }

  reconcileCashFlow(input: ReconcileCashFlowInput = {}): ReconciliationRunReport {
    this.status = "reconciling";
    this.performance.cashFlowReconciliations += 1;
    const report = this.manager.reconcileCashFlow(input, this.config);
    this.trackMismatches(report);
    this.finalizeOperation(report, "reconcile_cash_flow");
    return report;
  }

  reconcileAll(input: ReconcileAllInput = {}): ReconciliationRunReport {
    this.status = "reconciling";
    this.performance.fullReconciliations += 1;
    const report = this.manager.reconcileAll(input, this.config);
    this.trackMismatches(report);
    this.finalizeOperation(report, "reconcile_all");
    return report;
  }

  private trackMismatches(report: ReconciliationRunReport): void {
    if (report.mismatches.length > 0) {
      this.performance.mismatchesDetected += report.mismatches.length;
    }
  }

  private finalizeOperation(report: ReconciliationRunReport, action: string): void {
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
        report.engineRecord.currentOperationalState === "active" ? "active" : "connected";
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
    appendRcLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
