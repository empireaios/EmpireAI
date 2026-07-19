/** R5-13 — Budget Optimization Engine Controller. */

import { appendBoeLog } from "./boe-logging.js";
import { BudgetOptimizationManager } from "./budget-optimization-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { BudgetOptimizationEngineConfiguration } from "./configuration.js";
import type {
  AllocateBudgetInput,
  BudgetPerformanceStats,
  BudgetRunReport,
  ConnectBudgetOptimizationInput,
  EngineStatus,
  MonitorSpendInput,
  OptimizeBudgetsInput,
  ReallocateBudgetInput,
  RecommendAdjustmentsInput,
} from "./types.js";

export class BudgetOptimizationController {
  private config: BudgetOptimizationEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: BudgetRunReport | null = null;
  private readonly manager: BudgetOptimizationManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: BudgetPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    allocationsRun: 0,
    reallocationsRun: 0,
    optimizationsRun: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: BudgetOptimizationManager, config: BudgetOptimizationEngineConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendBoeLog({
      event: "engine_initialization",
      level: "info",
      details: "Budget Optimization Engine ready (R5-13)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): BudgetOptimizationEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: BudgetOptimizationEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): BudgetRunReport | null {
    return this.latestReport;
  }

  getManager(): BudgetOptimizationManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): BudgetPerformanceStats {
    return { ...this.performance };
  }

  connectBudgetOptimization(input: ConnectBudgetOptimizationInput = {}): BudgetRunReport {
    if (!this.config.enabled) throw new Error("Budget Optimization Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectBudgetOptimization(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  allocateBudget(input: AllocateBudgetInput): BudgetRunReport {
    this.performance.allocationsRun += 1;
    const report = this.manager.allocateBudget(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  reallocateBudget(input: ReallocateBudgetInput = {}): BudgetRunReport {
    this.status = "optimizing";
    this.performance.reallocationsRun += 1;
    const report = this.manager.reallocateBudget(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  monitorSpend(input: MonitorSpendInput = {}): BudgetRunReport {
    const report = this.manager.monitorSpend(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  monitorUtilization(input: MonitorSpendInput = {}): BudgetRunReport {
    const report = this.manager.monitorUtilization(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  detectInefficiencies(input: MonitorSpendInput = {}): BudgetRunReport {
    const report = this.manager.detectInefficiencies(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  detectOverspend(input: MonitorSpendInput = {}): BudgetRunReport {
    const report = this.manager.detectOverspend(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  calculateEfficiency(input: MonitorSpendInput = {}): BudgetRunReport {
    const report = this.manager.calculateEfficiency(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  recommendAdjustments(input: RecommendAdjustmentsInput = {}): BudgetRunReport {
    this.performance.recommendationsGenerated += 1;
    const report = this.manager.recommendAdjustments(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  optimizeBudgets(input: OptimizeBudgetsInput = {}): BudgetRunReport {
    this.status = "optimizing";
    this.performance.optimizationsRun += 1;
    const report = this.manager.optimizeBudgets(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: BudgetRunReport): void {
    this.latestReport = report;
    this.performance.totalOperations += 1;
    const duration = report.durationMs;

    if (report.validation.decision === "fail") {
      this.performance.failedOperations += 1;
      const recovered = this.recoveryManager.recordFailure(
        `${report.action} failed: ${report.validation.errors.join("; ")}`,
        this.config,
      );
      if (recovered) this.performance.retryAttempts += 1;
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
    appendBoeLog({
      event: "operation_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
