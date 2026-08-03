/** X2-18 — Portfolio Expansion Planner orchestration controller. */

import { appendPepLog } from "./pep-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { PortfolioExpansionManager } from "./portfolio-expansion-manager.js";
import type { PortfolioExpansionPlannerConfiguration } from "./configuration.js";
import type {
  ConnectPortfolioExpansionPlannerInput,
  EngineStatus,
  EstimateExpansionCostsInput,
  EstimateExpansionReturnsInput,
  EvaluateExpansionInput,
  ExpansionPerformanceStats,
  ExpansionRunReport,
  GenerateExpansionRecommendationsInput,
  IdentifyExpansionOpportunitiesInput,
  PrioritizeExpansionsInput,
  RunExpansionDiagnosticsInput,
} from "./types.js";

export class PortfolioExpansionController {
  private config: PortfolioExpansionPlannerConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: ExpansionRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: ExpansionPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    identifyOpportunitiesOps: 0,
    evaluateMarketsOps: 0,
    evaluateIndustriesOps: 0,
    evaluateInternalOps: 0,
    evaluateAcquisitionOps: 0,
    prioritizeOps: 0,
    estimateCostsOps: 0,
    estimateReturnsOps: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: PortfolioExpansionManager,
    config: PortfolioExpansionPlannerConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendPepLog({
      event: "framework_initialized",
      level: "info",
      details: "Portfolio Expansion Planner ready",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): PortfolioExpansionPlannerConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: PortfolioExpansionPlannerConfiguration): void {
    this.config = config;
  }

  getLatestReport(): ExpansionRunReport | null {
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

  getPerformance(): ExpansionPerformanceStats {
    return { ...this.performance };
  }

  connectPortfolioExpansionPlanner(
    input: ConnectPortfolioExpansionPlannerInput = {},
  ): ExpansionRunReport {
    if (!this.config.enabled) throw new Error("Portfolio Expansion Planner is disabled");
    this.status = "connecting";
    const report = this.manager.connectPortfolioExpansionPlanner(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  identifyOpportunities(
    input: IdentifyExpansionOpportunitiesInput = {},
  ): ExpansionRunReport {
    this.status = "discovering";
    const report = this.manager.identifyOpportunities(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.identifyOpportunitiesOps += report.expansionRecords.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  evaluateMarkets(input: EvaluateExpansionInput = {}): ExpansionRunReport {
    this.status = "evaluating";
    const report = this.manager.evaluateMarkets(input, this.config);
    if (report.validation.decision !== "fail") this.performance.evaluateMarketsOps += 1;
    this.finalizeOperation(report);
    return report;
  }

  evaluateIndustries(input: EvaluateExpansionInput = {}): ExpansionRunReport {
    this.status = "evaluating";
    const report = this.manager.evaluateIndustries(input, this.config);
    if (report.validation.decision !== "fail") this.performance.evaluateIndustriesOps += 1;
    this.finalizeOperation(report);
    return report;
  }

  evaluateInternal(input: EvaluateExpansionInput = {}): ExpansionRunReport {
    this.status = "evaluating";
    const report = this.manager.evaluateInternal(input, this.config);
    if (report.validation.decision !== "fail") this.performance.evaluateInternalOps += 1;
    this.finalizeOperation(report);
    return report;
  }

  evaluateAcquisition(input: EvaluateExpansionInput = {}): ExpansionRunReport {
    this.status = "evaluating";
    const report = this.manager.evaluateAcquisition(input, this.config);
    if (report.validation.decision !== "fail") this.performance.evaluateAcquisitionOps += 1;
    this.finalizeOperation(report);
    return report;
  }

  prioritizeExpansions(input: PrioritizeExpansionsInput = {}): ExpansionRunReport {
    this.status = "prioritizing";
    const report = this.manager.prioritizeExpansions(input, this.config);
    if (report.validation.decision !== "fail") this.performance.prioritizeOps += 1;
    this.finalizeOperation(report);
    return report;
  }

  estimateCosts(input: EstimateExpansionCostsInput = {}): ExpansionRunReport {
    this.status = "evaluating";
    const report = this.manager.estimateCosts(input, this.config);
    if (report.validation.decision !== "fail") this.performance.estimateCostsOps += 1;
    this.finalizeOperation(report);
    return report;
  }

  estimateReturns(input: EstimateExpansionReturnsInput = {}): ExpansionRunReport {
    this.status = "evaluating";
    const report = this.manager.estimateReturns(input, this.config);
    if (report.validation.decision !== "fail") this.performance.estimateReturnsOps += 1;
    this.finalizeOperation(report);
    return report;
  }

  generateRecommendations(
    input: GenerateExpansionRecommendationsInput = {},
  ): ExpansionRunReport {
    this.status = "recommending";
    const report = this.manager.generateRecommendations(input, this.config);
    this.performance.recommendationsGenerated += report.recommendations.length;
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunExpansionDiagnosticsInput = {}): ExpansionRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: ExpansionRunReport): void {
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
    appendPepLog({
      event: "expansion_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
