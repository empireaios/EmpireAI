/** X2-05 — Capital Distribution Engine orchestration controller. */

import { appendCdeLog } from "./cde-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { CapitalDistributionManager } from "./capital-distribution-manager.js";
import type { CapitalDistributionEngineConfiguration } from "./configuration.js";
import type {
  AllocateCapitalInput,
  AnalyzeCapitalRiskInput,
  CapitalPerformanceStats,
  CapitalRunReport,
  ConnectCapitalDistributionInput,
  EngineStatus,
  EvaluateFundingInput,
  EvaluateOpportunityInput,
  ManageCapitalPoolInput,
  RankCapitalPrioritiesInput,
  RecommendCapitalInput,
  RunCapitalDiagnosticsInput,
} from "./types.js";

export class CapitalDistributionController {
  private config: CapitalDistributionEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: CapitalRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: CapitalPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    fundingEvaluations: 0,
    opportunityEvaluations: 0,
    allocationsProposed: 0,
    riskAnalyses: 0,
    rankingsRun: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: CapitalDistributionManager,
    config: CapitalDistributionEngineConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendCdeLog({
      event: "framework_initialized",
      level: "info",
      details: "Capital Distribution Engine ready",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): CapitalDistributionEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: CapitalDistributionEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): CapitalRunReport | null {
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

  getPerformance(): CapitalPerformanceStats {
    return { ...this.performance };
  }

  connectCapitalDistributionEngine(
    input: ConnectCapitalDistributionInput = {},
  ): CapitalRunReport {
    if (!this.config.enabled) throw new Error("Capital Distribution Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectCapitalDistributionEngine(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  manageCapitalPool(input: ManageCapitalPoolInput): CapitalRunReport {
    const report = this.manager.manageCapitalPool(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  evaluateFunding(input: EvaluateFundingInput): CapitalRunReport {
    this.status = "evaluating";
    const report = this.manager.evaluateFunding(input, this.config);
    if (report.validation.decision !== "fail") this.performance.fundingEvaluations += 1;
    this.finalizeOperation(report);
    return report;
  }

  evaluateOpportunity(input: EvaluateOpportunityInput): CapitalRunReport {
    this.status = "evaluating";
    const report = this.manager.evaluateOpportunity(input, this.config);
    if (report.validation.decision !== "fail") this.performance.opportunityEvaluations += 1;
    this.finalizeOperation(report);
    return report;
  }

  allocateCapital(input: AllocateCapitalInput): CapitalRunReport {
    this.status = "allocating";
    const report = this.manager.allocateCapital(input, this.config);
    if (report.validation.decision !== "fail") this.performance.allocationsProposed += 1;
    this.finalizeOperation(report);
    return report;
  }

  analyzeCapitalRisk(input: AnalyzeCapitalRiskInput = {}): CapitalRunReport {
    this.status = "analyzing";
    const report = this.manager.analyzeCapitalRisk(input, this.config);
    if (report.validation.decision !== "fail") this.performance.riskAnalyses += 1;
    this.finalizeOperation(report);
    return report;
  }

  rankCapitalPriorities(input: RankCapitalPrioritiesInput = {}): CapitalRunReport {
    const report = this.manager.rankCapitalPriorities(input, this.config);
    if (report.validation.decision !== "fail") this.performance.rankingsRun += 1;
    this.finalizeOperation(report);
    return report;
  }

  generateRecommendations(input: RecommendCapitalInput = {}): CapitalRunReport {
    const report = this.manager.generateRecommendations(input, this.config);
    this.performance.recommendationsGenerated += report.recommendations.length;
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunCapitalDiagnosticsInput = {}): CapitalRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: CapitalRunReport): void {
    this.latestReport = report;
    this.performance.totalOperations += 1;
    const duration = report.durationMs;

    if (report.validation.decision === "fail") {
      this.performance.failedOperations += 1;
      this.recoveryManager.recordFailure(
        `Operation failed: ${report.validation.errors.join("; ")}`,
        this.config,
      );
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
    appendCdeLog({
      event: "capital_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
