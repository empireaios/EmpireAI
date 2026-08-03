/** X4-14 — Regional Growth Optimizer orchestration controller. */

import { appendRgoLog } from "./rgo-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { RegionalGrowthManager } from "./regional-growth-manager.js";
import type { RegionalGrowthOptimizerConfiguration } from "./configuration.js";
import type {
  ConnectRegionalGrowthOptimizerInput,
  EngineStatus,
  RegionalOptimizationInput,
  RgoPerformanceStats,
  RgoRunReport,
  RunRgoDiagnosticsInput,
} from "./types.js";

export class RegionalGrowthController {
  private config: RegionalGrowthOptimizerConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: RgoRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: RgoPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    businessPerformanceMonitors: 0,
    revenueMonitors: 0,
    profitabilityMonitors: 0,
    customerGrowthMonitors: 0,
    efficiencyMonitors: 0,
    opportunityDetections: 0,
    bottleneckDetections: 0,
    priorityRankings: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: RegionalGrowthManager,
    config: RegionalGrowthOptimizerConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendRgoLog({
      event: "engine_initialized",
      level: "info",
      details:
        "Regional Growth Optimizer ready — structural signals only; never optimize using unvalidated regional intelligence",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): RegionalGrowthOptimizerConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: RegionalGrowthOptimizerConfiguration): void {
    this.config = config;
  }

  getLatestReport(): RgoRunReport | null {
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

  getPerformance(): RgoPerformanceStats {
    return { ...this.performance };
  }

  connectRegionalGrowthOptimizer(input: ConnectRegionalGrowthOptimizerInput = {}): RgoRunReport {
    if (!this.config.enabled) throw new Error("Regional Growth Optimizer is disabled");
    this.status = "connecting";
    const report = this.manager.connectRegionalGrowthOptimizer(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  monitorRegionalBusinessPerformance(input: RegionalOptimizationInput = {}): RgoRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorRegionalBusinessPerformance(input, this.config);
    if (report.validation.decision !== "fail") this.performance.businessPerformanceMonitors += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorRegionalRevenueGrowth(input: RegionalOptimizationInput = {}): RgoRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorRegionalRevenueGrowth(input, this.config);
    if (report.validation.decision !== "fail") this.performance.revenueMonitors += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorRegionalProfitability(input: RegionalOptimizationInput = {}): RgoRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorRegionalProfitability(input, this.config);
    if (report.validation.decision !== "fail") this.performance.profitabilityMonitors += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorRegionalCustomerGrowth(input: RegionalOptimizationInput = {}): RgoRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorRegionalCustomerGrowth(input, this.config);
    if (report.validation.decision !== "fail") this.performance.customerGrowthMonitors += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorRegionalOperationalEfficiency(input: RegionalOptimizationInput = {}): RgoRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorRegionalOperationalEfficiency(input, this.config);
    if (report.validation.decision !== "fail") this.performance.efficiencyMonitors += 1;
    this.finalizeOperation(report);
    return report;
  }

  detectRegionalGrowthOpportunities(input: RegionalOptimizationInput = {}): RgoRunReport {
    this.status = "analyzing";
    const report = this.manager.detectRegionalGrowthOpportunities(input, this.config);
    if (report.validation.decision !== "fail") this.performance.opportunityDetections += 1;
    this.finalizeOperation(report);
    return report;
  }

  detectRegionalPerformanceBottlenecks(input: RegionalOptimizationInput = {}): RgoRunReport {
    this.status = "analyzing";
    const report = this.manager.detectRegionalPerformanceBottlenecks(input, this.config);
    if (report.validation.decision !== "fail") this.performance.bottleneckDetections += 1;
    this.finalizeOperation(report);
    return report;
  }

  rankRegionalOptimizationPriorities(input: RegionalOptimizationInput = {}): RgoRunReport {
    this.status = "optimizing";
    const report = this.manager.rankRegionalOptimizationPriorities(input, this.config);
    if (report.validation.decision !== "fail") this.performance.priorityRankings += 1;
    this.finalizeOperation(report);
    return report;
  }

  recommendRegionalGrowth(input: RegionalOptimizationInput = {}): RgoRunReport {
    this.status = "recommending";
    const report = this.manager.recommendRegionalGrowth(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.recommendationsGenerated += report.recommendations.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunRgoDiagnosticsInput = {}): RgoRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: RgoRunReport): void {
    this.latestReport = report;
    this.performance.totalOperations += 1;
    const duration = report.durationMs;

    if (report.validation.decision === "fail") {
      this.performance.failedOperations += 1;
      const recovered = this.recoveryManager.recordFailure(
        `Operation failed: ${report.validation.errors.join("; ")}`,
        this.config,
      );
      if (recovered) this.performance.retryAttempts += 1;
    } else {
      this.performance.successfulOperations += 1;
      this.recoveryManager.recordSuccess();
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
    this.status = "active";
    appendRgoLog({
      event: "engine_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
