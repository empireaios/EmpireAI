/** R3-14 — Budget Management Controller. */

import { appendBmgLog } from "./bmg-logging.js";
import { BudgetManagementManager } from "./budget-management-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { BudgetManagementEngineConfiguration } from "./configuration.js";
import type {
  AllocateBudgetInput,
  BudgetManagementRunReport,
  BudgetPerformanceStats,
  CompareActualVsBudgetInput,
  ConnectBudgetManagementEngineInput,
  CreateBudgetInput,
  DetectBudgetOverrunsInput,
  DetectBudgetVariancesInput,
  EngineStatus,
  GenerateBudgetRecommendationsInput,
  TrackBudgetUtilizationInput,
} from "./types.js";

export class BudgetManagementController {
  private config: BudgetManagementEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: BudgetManagementRunReport | null = null;
  private readonly manager: BudgetManagementManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: BudgetPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    budgetsCreated: 0,
    allocationsManaged: 0,
    utilizationsTracked: 0,
    variancesDetected: 0,
    overrunsDetected: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: BudgetManagementManager, config: BudgetManagementEngineConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendBmgLog({
      event: "engine_initialization",
      level: "info",
      details: "Budget Management Engine ready (R3-14)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): BudgetManagementEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: BudgetManagementEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): BudgetManagementRunReport | null {
    return this.latestReport;
  }

  getManager(): BudgetManagementManager {
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

  connectBudgetManagementEngine(
    input: ConnectBudgetManagementEngineInput = {},
  ): BudgetManagementRunReport {
    if (!this.config.enabled) throw new Error("Budget Management Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectBudgetManagementEngine(input, this.config);
    this.finalizeOperation(report, "connect");
    return report;
  }

  createBudget(input: CreateBudgetInput): BudgetManagementRunReport {
    this.status = "processing";
    this.performance.budgetsCreated += 1;
    const report = this.manager.createBudget(input, this.config);
    this.finalizeOperation(report, "create_budget");
    return report;
  }

  allocateBudget(input: AllocateBudgetInput): BudgetManagementRunReport {
    this.performance.allocationsManaged += 1;
    const report = this.manager.allocateBudget(input, this.config);
    this.finalizeOperation(report, "allocate_budget");
    return report;
  }

  trackBudgetUtilization(
    input: TrackBudgetUtilizationInput = {},
  ): BudgetManagementRunReport {
    this.performance.utilizationsTracked += 1;
    const report = this.manager.trackBudgetUtilization(input, this.config);
    this.finalizeOperation(report, "track_utilization");
    return report;
  }

  compareActualVsBudget(
    input: CompareActualVsBudgetInput = {},
  ): BudgetManagementRunReport {
    const report = this.manager.compareActualVsBudget(input, this.config);
    this.finalizeOperation(report, "compare_actual");
    return report;
  }

  detectBudgetOverruns(
    input: DetectBudgetOverrunsInput = {},
  ): BudgetManagementRunReport {
    const report = this.manager.detectBudgetOverruns(input, this.config);
    if (report.overruns.length > 0) {
      this.performance.overrunsDetected += report.overruns.length;
    }
    this.finalizeOperation(report, "detect_overruns");
    return report;
  }

  detectBudgetVariances(
    input: DetectBudgetVariancesInput = {},
  ): BudgetManagementRunReport {
    const report = this.manager.detectBudgetVariances(input, this.config);
    if (report.variances.length > 0) {
      this.performance.variancesDetected += report.variances.length;
    }
    this.finalizeOperation(report, "detect_variances");
    return report;
  }

  generateBudgetRecommendations(
    input: GenerateBudgetRecommendationsInput = {},
  ): BudgetManagementRunReport {
    const report = this.manager.generateBudgetRecommendations(input, this.config);
    if (report.recommendations.length > 0) {
      this.performance.recommendationsGenerated += report.recommendations.length;
    }
    this.finalizeOperation(report, "generate_recommendations");
    return report;
  }

  private finalizeOperation(report: BudgetManagementRunReport, action: string): void {
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
    appendBmgLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
